/** Local desktop account session (username/password dialog).
 *  Persists display identity in localStorage until OPC backend auth is wired. */

export type LocalAccount = {
  username: string;
  signedInAt: number;
};

const KEY = "ocw:local-account";
export const LOCAL_AUTH_CHANGED = "ocw:local-auth-changed";

export function getLocalAccount(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAccount;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setLocalAccount(username: string): LocalAccount {
  const account: LocalAccount = { username: username.trim(), signedInAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(account));
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED));
  return account;
}

export function clearLocalAccount(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED));
}
