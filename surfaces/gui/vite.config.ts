import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function coworkerStateDir(): string {
  return (
    process.env.COWORKER_STATE_DIR ||
    (process.platform === "win32"
      ? path.join(process.env.APPDATA || os.homedir(), "coworker")
      : path.join(os.homedir(), ".config", "coworker"))
  );
}

function readSidecarToken(): string {
  try {
    return fs.readFileSync(path.join(coworkerStateDir(), "sidecar-8765.token"), "utf8").trim();
  } catch {
    return "";
  }
}

/** Inject the current sidecar token on every HTML response so a browser tab
 * stays in sync after the Tauri shell (or a standalone server) restarts. */
function injectDevToken(): Plugin {
  return {
    name: "openworker-inject-dev-token",
    transformIndexHtml(html) {
      const token = readSidecarToken();
      if (!token) return html;
      // Do not overwrite a Tauri-injected launch token (init script runs first).
      const script =
        `<script>window.__COWORKER_API_TOKEN__=window.__COWORKER_API_TOKEN__||${JSON.stringify(token)};</script>`;
      return html.replace(/<head[^>]*>/i, (m) => `${m}\n    ${script}`);
    },
  };
}

/** Safari 15 / macOS 12 WKWebView rejects lookbehind `(?<=…)` with
 * "Invalid regular expression: invalid group specifier name". remark-gfm's
 * email autolink uses one; strip it (boundary is still checked in findEmail). */
function patchGfmAutolinkForSafari(): Plugin {
  const rewrite = (code: string): string | null => {
    const next = code
      .replace(
        "/(?<=^|\\s|\\p{P}|\\p{S})([-\\.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)/gu",
        "/([-\\.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)/gu",
      )
      .replace(
        'new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)", "gu")',
        'new RegExp("([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)", "gu")',
      );
    return next === code ? null : next;
  };
  return {
    name: "openworker-patch-gfm-autolink-safari",
    transform(code, id) {
      if (!/mdast-util-gfm-autolink|remark-gfm/.test(id)) return null;
      const next = rewrite(code);
      return next == null ? null : next;
    },
  };
}

// `base: "./"` makes built asset URLs relative, so the bundle loads from the `tauri://`
// origin in the desktop shell (absolute `/assets` 404s there); a server-hosted build is
// unaffected. Dev runs on a fixed port (1420) with strictPort so the Tauri webview always
// loads the vite instance Tauri itself spawns (a drifting port would make the window load a
// stale/other server). `tauri.conf.json` devUrl must match this.
export default defineConfig(({ command }) => {
  const devToken = command === "serve" ? readSidecarToken() : "";
  // COWORKER_DEV_PROXY=http://127.0.0.1:8790 points the dev GUI at a hosted-
  // shaped backend (the machines service) through vite's own origin, so the
  // browser sees no cross-origin calls — the hosted service serves its bundle
  // same-origin and deliberately has no CORS. Pair it with
  // VITE_COWORKER_HTTP/WS set to the vite origin. Off unless set.
  const devProxy = process.env.COWORKER_DEV_PROXY || "";
  const proxy = devProxy
    ? {
        "/v1": { target: devProxy, changeOrigin: true },
        "/ws": { target: devProxy.replace(/^http/, "ws"), ws: true, changeOrigin: true },
        "/j": { target: devProxy, changeOrigin: true },
      }
    : undefined;
  return {
    base: "./",
    plugins: [
      react(),
      patchGfmAutolinkForSafari(),
      ...(command === "serve" ? [injectDevToken()] : []),
    ],
    // Bind IPv4 loopback explicitly. On macOS Vite's default `localhost` can be
    // [::1] only; WKWebView sometimes fails to paint against that and the Tauri
    // window stays blank while fetches still succeed.
    server: { host: "127.0.0.1", port: 1420, strictPort: true, ...(proxy ? { proxy } : {}) },
    // Force these through the Safari lookbehind patch instead of opaque prebundles.
    optimizeDeps: {
      exclude: ["remark-gfm", "mdast-util-gfm-autolink-literal"],
    },
    define: { __COWORKER_DEV_TOKEN__: JSON.stringify(devToken) },
    // Tauri CLI looks for these; harmless for the browser build.
    clearScreen: false,
    envPrefix: ["VITE_", "TAURI_"],
  };
});
