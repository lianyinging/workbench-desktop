// Server/engine notices are still authored in English on the wire (and in persisted
// transcripts). Map well-known phrases to locale keys so the GUI can show Chinese
// (or any UI language) without waiting for every backend string to become a code.
import i18n from "i18next";

const EXACT: Record<string, string> = {
  "This session is already running a turn. Wait for it to finish or stop it.":
    "app.notice.turn_busy",
  "Context compacted — earlier turns were summarized":
    "app.notice.context_compacted_detail",
  "Context compacted": "app.notice.context_compacted",
  "Context trimmed — oldest turns dropped (summary unavailable)":
    "app.notice.context_trimmed",
  "Interrupted.": "app.notice.interrupted",
  Interrupted: "app.notice.interrupted",
  "Model switched": "app.notice.model_switched",
  "Auto-approve paused for the rest of this turn.": "app.notice.reviewer_paused",
  "This isn't in the conversation's folder anymore — it may have been moved or deleted.":
    "rail.artifact_missing",
  "no workspace": "rail.artifact_no_workspace",
  "path escapes workspace": "rail.artifact_escapes",
  // Mode switch / auto-approve banner (server MODE_LABELS + AUTO_APPROVE_NOTICE).
  "Auto-approve is on.": "app.notice.mode_auto_approve_on",
  "Auto-approve uses a model to let routine actions through without asking; anything it isn't sure about still comes to you. It cuts interruptions but still carries some risk i.e. a command it allows still reaches anything you can. These are model judgments, and not guarantees.":
    "app.notice.mode_auto_approve_body",
  "Dangerously bypass approvals is on. Nothing will stop for you.":
    "app.notice.mode_dangerous_warning",
};

// English MODE_LABELS → composer/app mode label keys (for "{{mode}} is on.").
const MODE_LABEL_KEYS: Record<string, string> = {
  Discuss: "composer.mode.discuss",
  Plan: "app.notice.mode_plan",
  "Ask for approval": "composer.mode.interactive",
  "Bypass approvals": "composer.mode.auto",
  "Auto-approve": "composer.mode.auto_approve",
  "Dangerously bypass approvals": "app.notice.mode_dangerous",
};

function tr(key: string, fallback: string, vars?: Record<string, string>): string {
  const out = vars ? i18n.t(key, vars) : i18n.t(key);
  // Before i18n.init (unit tests) t() returns the key — keep the English source.
  return !out || out === key ? fallback : String(out);
}

function localizeModeOn(raw: string): string | null {
  const m = raw.match(/^(.+) is on\.$/);
  if (!m) return null;
  const eng = m[1];
  const labelKey = MODE_LABEL_KEYS[eng];
  if (!labelKey) return null;
  const mode = tr(labelKey, eng);
  return tr("app.notice.mode_on", `${mode} is on.`, { mode });
}

/** Localize a server/persisted notice when we know the English source string. */
export function localizeServerNotice(text: string | null | undefined, fallbackKey?: string): string {
  const raw = (text || "").trim();
  if (!raw) return fallbackKey ? tr(fallbackKey, "") : "";
  const key = EXACT[raw];
  if (key) return tr(key, raw);
  const modeOn = localizeModeOn(raw);
  if (modeOn) return modeOn;
  // Prefix match for slightly varied compacted/trimmed copy from older builds.
  if (raw.startsWith("Context compacted")) return tr("app.notice.context_compacted_detail", raw);
  if (raw.startsWith("Context trimmed")) return tr("app.notice.context_trimmed", raw);
  if (raw.startsWith("This session is already running a turn")) return tr("app.notice.turn_busy", raw);
  if (raw.startsWith("This isn't in the conversation's folder anymore"))
    return tr("rail.artifact_missing", raw);
  if (raw.startsWith("Dangerously bypass approvals is on"))
    return tr("app.notice.mode_dangerous_warning", raw);
  if (raw.startsWith("Auto-approve uses a model"))
    return tr("app.notice.mode_auto_approve_body", raw);
  return fallbackKey ? tr(fallbackKey, raw) : raw;
}
