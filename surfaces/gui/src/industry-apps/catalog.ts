/**
 * Fetch industry-app catalog from OPC admin (default: localhost:9080).
 * Public apps are returned without login; login-visibility apps need Bearer.
 */
import { getAdminBaseUrl } from "../adminPresence";
import { getAccessToken } from "../localAuth";
import type { IndustryAppRemoteDto } from "./types";

export const INDUSTRY_APPS_CHANGED = "opc:industry-apps-changed";

const CACHE_KEY = "opc:industry-apps:cache";

let remoteCache: IndustryAppRemoteDto[] | null = null;
let loading: Promise<IndustryAppRemoteDto[]> | null = null;

export function getCachedIndustryApps(): IndustryAppRemoteDto[] | null {
  if (remoteCache) return remoteCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IndustryAppRemoteDto[];
    if (Array.isArray(parsed)) {
      remoteCache = parsed;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persist(list: IndustryAppRemoteDto[]) {
  remoteCache = list;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(INDUSTRY_APPS_CHANGED));
}

/** Load catalog (startup / login / each industry-apps page open). Soft-fails to cache/empty. */
export function loadIndustryAppsCatalog(opts?: { force?: boolean }): Promise<IndustryAppRemoteDto[]> {
  if (loading && !opts?.force) return loading;
  loading = (async () => {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${getAdminBaseUrl()}/opc/desktop/industry-apps`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || (json && typeof json.code === "number" && json.code !== 200)) {
        throw new Error((json && (json.msg || json.message)) || `HTTP ${res.status}`);
      }
      const data = (json?.data ?? []) as IndustryAppRemoteDto[];
      const list = Array.isArray(data) ? data : [];
      persist(list);
      return list;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug("[industry-apps] catalog fetch failed", err);
      }
      return getCachedIndustryApps() ?? [];
    } finally {
      loading = null;
    }
  })();
  return loading;
}
