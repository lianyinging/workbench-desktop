/**
 * Opc WorkBench desktop login session (opc_desktop_user via /opc/desktop/login).
 */
import { getAdminBaseUrl, getOrCreateDeviceId } from "./adminPresence";

export type LocalAccount = {
  username: string;
  nickName?: string;
  userId?: number;
  accessToken?: string;
  signedInAt: number;
};

const KEY = "ocw:local-account";
const TOKEN_KEY = "opc:desktop:accessToken";
export const LOCAL_AUTH_CHANGED = "ocw:local-auth-changed";

export function getLocalAccount(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAccount;
    if (!parsed?.username) return null;
    if (!parsed.accessToken) {
      try {
        parsed.accessToken = localStorage.getItem(TOKEN_KEY) || undefined;
      } catch {
        /* ignore */
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistAccount(account: LocalAccount): LocalAccount {
  localStorage.setItem(KEY, JSON.stringify(account));
  if (account.accessToken) {
    localStorage.setItem(TOKEN_KEY, account.accessToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED));
  return account;
}

/** @deprecated Prefer loginWithPassword — kept for tests that inject a display name. */
export function setLocalAccount(username: string): LocalAccount {
  return persistAccount({ username: username.trim(), signedInAt: Date.now() });
}

export function clearLocalAccount(): void {
  const token = getAccessToken();
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED));
  if (token) {
    void fetch(`${getAdminBaseUrl()}/opc/desktop/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}

type LoginResult = {
  accessToken: string;
  expireIn?: number;
  userId: number;
  userName: string;
  nickName?: string;
};

/**
 * Account/password login against the OPC admin backend (desktop-only users).
 * Only meaningful in Tauri; browsers can still call it if admin URL is reachable.
 */
export async function loginWithPassword(username: string, password: string): Promise<LocalAccount> {
  const u = username.trim();
  const res = await fetch(`${getAdminBaseUrl()}/opc/desktop/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: u,
      password,
      deviceId: getOrCreateDeviceId(),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json && typeof json.code === "number" && json.code !== 200)) {
    const msg = (json && (json.msg || json.message)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  const data = (json?.data ?? json) as LoginResult;
  if (!data?.accessToken) {
    throw new Error("登录未返回令牌");
  }
  const account = persistAccount({
    username: data.userName || u,
    nickName: data.nickName || data.userName || u,
    userId: data.userId,
    accessToken: data.accessToken,
    signedInAt: Date.now(),
  });
  // Refresh catalog so visibility=login apps appear after sign-in.
  void import("./industry-apps").then(({ loadIndustryAppsCatalog }) =>
    loadIndustryAppsCatalog({ force: true }),
  );
  return account;
}
