/**
 * In-app request log for OPC admin (and future) HTTP calls.
 * Settings ▸ App ▸ App logs reads this ring buffer.
 */

export type AppRequestLogEntry = {
  id: string;
  ts: number;
  method: string;
  url: string;
  /** Short path / label for list rows */
  path: string;
  status?: number;
  ok?: boolean;
  durationMs?: number;
  error?: string;
  category: "opc-admin";
  requestPreview?: string;
  responsePreview?: string;
};

export const APP_REQUEST_LOG_CHANGED = "opc:app-request-log-changed";

const MAX_ENTRIES = 200;
const STORE_KEY = "opc:app-request-log";
const PREVIEW_MAX = 2400;
const REDACT_KEYS = new Set(["password", "clientsecret", "client_secret", "accesstoken", "access_token", "token", "authorization"]);

let entries: AppRequestLogEntry[] = load();

function load(): AppRequestLogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppRequestLogEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new Event(APP_REQUEST_LOG_CHANGED));
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function truncate(s: string, max = PREVIEW_MAX): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function redactValue(raw: unknown): unknown {
  if (raw == null) return raw;
  if (Array.isArray(raw)) return raw.map(redactValue);
  if (typeof raw !== "object") return raw;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "***";
    } else {
      out[k] = redactValue(v);
    }
  }
  return out;
}

export function previewBody(body: unknown): string | undefined {
  if (body == null || body === "") return undefined;
  try {
    if (typeof body === "string") {
      try {
        return truncate(JSON.stringify(redactValue(JSON.parse(body)), null, 0));
      } catch {
        return truncate(body);
      }
    }
    return truncate(JSON.stringify(redactValue(body), null, 0));
  } catch {
    return undefined;
  }
}

function shortPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export function listAppRequestLogs(): AppRequestLogEntry[] {
  return entries.slice();
}

export function clearAppRequestLogs(): void {
  entries = [];
  persist();
}

function push(entry: AppRequestLogEntry) {
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  persist();
}

function patch(id: string, patchFields: Partial<AppRequestLogEntry>) {
  const i = entries.findIndex((e) => e.id === id);
  if (i < 0) return;
  entries[i] = { ...entries[i], ...patchFields };
  persist();
}

/**
 * fetch wrapper that records method/url/status/duration (+ redacted body previews).
 * Response body is cloned for the preview so callers can still read the original.
 */
export async function loggedFetch(
  url: string,
  init?: RequestInit,
  opts?: { category?: "opc-admin"; requestPreview?: string },
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const id = newId();
  const started = Date.now();
  const requestPreview =
    opts?.requestPreview ??
    (typeof init?.body === "string" ? previewBody(init.body) : undefined);

  push({
    id,
    ts: started,
    method,
    url,
    path: shortPath(url),
    category: opts?.category || "opc-admin",
    requestPreview,
  });

  try {
    const res = await fetch(url, init);
    let responsePreview: string | undefined;
    try {
      const text = await res.clone().text();
      responsePreview = previewBody(text) ?? truncate(text);
    } catch {
      /* ignore */
    }
    patch(id, {
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - started,
      responsePreview,
    });
    return res;
  } catch (err) {
    patch(id, {
      ok: false,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
