import { getI18n } from "react-i18next";

// A persona is "project-scoped" when it declares requires_folder: an explicit directory the
// user picks, sessions grouped by project in the sidebar. Everything else runs on a transparent
// per-conversation scratch dir, with real folders added as roots when needed — no folder gate.
// (The old family/workspace-enum pair collapsed into this trait; workspace-scratch-design.md.)
export function isProjectScoped(p?: { requires_folder?: boolean }): boolean {
  return p?.requires_folder === true;
}

// Persona naming: backend manifests stay English (API / tests). The UI maps known builtin
// ids through `personas.names` / `personas.names_short` so zh (and other locales) can localize.

/** The default coworker's id. Its backend name is "OpenWorker"; on screen it is "Coworker". */
export const DEFAULT_PERSONA_ID = "cowork";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function tr(t?: TFunc): TFunc {
  if (t) return t;
  return (key, options) => getI18n().t(key, options) as string;
}

/** Look up a localized persona label; empty string means "no mapping". */
function mappedName(id: string | null | undefined, kind: "names" | "names_short", t: TFunc): string {
  if (!id) return "";
  const key = `personas.${kind}.${id}`;
  const value = t(key, { defaultValue: "" });
  return value && value !== key ? value : "";
}

/** A coworker's name where coworkers are listed side by side (Settings ▸ Coworkers, Usage's
 * tables, its picker, Ratings): the default one is "Coworker (default)", as "Coworker" alone
 * reads like the column's heading there; every other coworker keeps its localized/full name. */
export function listPersonaName(
  name: string | null | undefined,
  id: string | null | undefined,
  t: TFunc,
): string {
  if (id === DEFAULT_PERSONA_ID) return t("personas.default_in_list");
  return mappedName(id, "names", t) || (name || id || "").trim();
}

// Short label for the sidebar + top bar: "Coworker" / "Code" / "Ops" / "Chat" (localized).
export function shortPersonaName(name?: string, id?: string, t?: TFunc): string {
  const translate = tr(t);
  const short = mappedName(id, "names_short", translate);
  if (short) return short;
  if (id === "cowork") return translate("personas.names_short.cowork", { defaultValue: "Coworker" });
  const n = (name || id || "").trim();
  return n.replace(/\s*coworker$/i, "").trim() || n;
}

// Full family name for the persona detail page / picker: "Coworker" / "Code Coworker" / …
export function fullPersonaName(name?: string, id?: string, t?: TFunc): string {
  const translate = tr(t);
  const full = mappedName(id, "names", translate);
  if (full) return full;
  if (id === "cowork") return translate("personas.names.cowork", { defaultValue: "Coworker" });
  const n = (name || id || "").trim();
  if (id === "chat" || !n) return n;
  return /coworker$/i.test(n) ? n : `${n} Coworker`;
}
