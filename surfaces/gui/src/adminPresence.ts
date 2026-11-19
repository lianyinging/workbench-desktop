/**
 * Report this desktop instance to the OPC admin backend (register + heartbeat).
 * Failures are swallowed so the main UI is never blocked.
 */
import { loggedFetch } from "./appRequestLog";
import { FALLBACK_APP_VERSION, getAppVersion, isTauri, platformOS } from "./tauri";

const DEVICE_ID_KEY = "opc:desktop:deviceId";
const DEVICE_TOKEN_KEY = "opc:desktop:deviceToken";
const DEVICE_NAME_KEY = "opc:desktop:deviceName";
const ADMIN_BASE_URL_KEY = "opc:admin:baseUrl";

const DEFAULT_ADMIN_BASE_URL = "http://localhost:9080";
const DEFAULT_CLIENT_ID = "a1b2c3d4e5f6789012345678abcdef01";
const DEFAULT_CLIENT_SECRET = "desktop123";
const HEARTBEAT_MS = 30_000;

let started = false;
let timer: ReturnType<typeof setInterval> | undefined;
let inFlight: Promise<void> | null = null;

export function getAdminBaseUrl(): string {
  // User override (Settings) wins over packaged build default.
  try {
    const stored = localStorage.getItem(ADMIN_BASE_URL_KEY);
    if (stored && stored.trim()) return stored.trim().replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  const fromEnv =
    import.meta.env?.VITE_OPC_ADMIN_BASE_URL ||
    (typeof globalThis !== "undefined" && (globalThis as any).OPC_ADMIN_BASE_URL);
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  return DEFAULT_ADMIN_BASE_URL;
}

export function setAdminBaseUrl(url: string): void {
  const normalized = (url || "").trim().replace(/\/$/, "") || DEFAULT_ADMIN_BASE_URL;
  try {
    localStorage.setItem(ADMIN_BASE_URL_KEY, normalized);
  } catch {
    /* ignore */
  }
  // Restart reporter so the next tick hits the new host.
  stopAdminPresence();
  void startAdminPresence();
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.trim()) return existing.trim();
  } catch {
    /* ignore */
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `opc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(DEVICE_TOKEN_KEY, token);
    else localStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function hostname(): string {
  const injected = (globalThis as any).__OCW_HOSTNAME__;
  if (typeof injected === "string" && injected.trim()) return injected.trim();
  return "";
}

function friendlyOsName(raw: string): string {
  switch (raw) {
    case "macos":
    case "darwin":
      return "macOS";
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return raw || "desktop";
  }
}

function deviceName(): string {
  try {
    const stored = localStorage.getItem(DEVICE_NAME_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    /* ignore */
  }
  const host = hostname() || friendlyOsName(platformOS());
  return `Opc WorkBench (${host})`;
}

function osInfo(): { osName: string; osVersion: string } {
  const osName = friendlyOsName(platformOS());
  const injected = (globalThis as any).__OCW_OS_VERSION__;
  const osVersion = typeof injected === "string" && injected ? injected : "";
  return { osName, osVersion };
}

async function postJson<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const base = getAdminBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // RuoYi 客户端体系常见请求头；与 body.clientId 保持一致
    clientid: DEFAULT_CLIENT_ID,
    clientId: DEFAULT_CLIENT_ID,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await loggedFetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json && typeof json.code === "number" && json.code !== 200)) {
    const msg = (json && (json.msg || json.message)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return (json?.data ?? json) as T;
}

async function register(): Promise<string> {
  const { osName, osVersion } = osInfo();
  const appVersion = (await getAppVersion()) || FALLBACK_APP_VERSION;
  const data = await postJson<{ deviceToken: string }>("/opc/desktop/register", {
    clientId: DEFAULT_CLIENT_ID,
    clientSecret: DEFAULT_CLIENT_SECRET,
    deviceId: getOrCreateDeviceId(),
    deviceName: deviceName(),
    osName,
    osVersion,
    appVersion,
  });
  if (!data?.deviceToken) throw new Error("register returned no deviceToken");
  setStoredToken(data.deviceToken);
  return data.deviceToken;
}

async function heartbeat(token: string): Promise<void> {
  const { osName, osVersion } = osInfo();
  const appVersion = (await getAppVersion()) || FALLBACK_APP_VERSION;
  await postJson(
    "/opc/desktop/heartbeat",
    {
      deviceName: deviceName(),
      osName,
      osVersion,
      appVersion,
    },
    token,
  );
}

async function tick(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      let token = getStoredToken();
      if (!token) {
        token = await register();
      } else {
        try {
          await heartbeat(token);
        } catch {
          // Token expired / device disabled — re-register once.
          setStoredToken(null);
          token = await register();
          await heartbeat(token);
        }
      }
    } catch (err) {
      // Soft-fail: admin backend may be down.
      if (import.meta.env.DEV) {
        console.debug("[adminPresence]", err);
      }
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Start background register/heartbeat. Idempotent. Only the Tauri desktop shell reports. */
export function startAdminPresence(): void {
  if (!isTauri()) {
    return;
  }
  if (started) return;
  started = true;
  void tick();
  timer = setInterval(() => {
    void tick();
  }, HEARTBEAT_MS);
}

export function stopAdminPresence(): void {
  started = false;
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
