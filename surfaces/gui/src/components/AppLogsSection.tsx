import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  APP_REQUEST_LOG_CHANGED,
  clearAppRequestLogs,
  listAppRequestLogs,
  type AppRequestLogEntry,
} from "../appRequestLog";
import { getAdminBaseUrl } from "../adminPresence";
import { PanelHead } from "./IntegrationsView";

const CARD = "rounded-xl2 border border-line bg-panel";
const FIELD_HELP = "text-meta text-muted mt-1.5 leading-relaxed";
const BTN_BORDERED =
  "text-ui px-3 py-2 rounded-lg border border-line bg-panel hover:bg-chromeHover shrink-0 disabled:opacity-40";

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function statusTone(entry: AppRequestLogEntry): string {
  if (entry.error) return "text-red-600";
  if (entry.status == null) return "text-muted";
  if (entry.status >= 200 && entry.status < 300) return "text-green-700";
  if (entry.status >= 400) return "text-red-600";
  return "text-amber-700";
}

function LogRow({ entry }: { entry: AppRequestLogEntry }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const statusLabel = entry.error
    ? t("settingsx.app_logs.failed")
    : entry.status != null
      ? String(entry.status)
      : "…";

  return (
    <div className="border-b border-line last:border-b-0" data-testid={`app-log-row-${entry.id}`}>
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 hover:bg-chromeHover/60 flex items-start gap-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-meta font-medium text-ink w-14 shrink-0 pt-0.5">{entry.method}</span>
        <span className="flex-1 min-w-0">
          <span className="text-ui text-ink break-all">{entry.path}</span>
          <span className="block text-meta text-muted mt-0.5">{formatTime(entry.ts)}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className={"text-meta font-medium " + statusTone(entry)}>{statusLabel}</span>
          {entry.durationMs != null && (
            <span className="block text-meta text-muted mt-0.5">{entry.durationMs} ms</span>
          )}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-meta text-muted break-all">{entry.url}</div>
          {entry.error && (
            <pre className="text-meta text-red-600 whitespace-pre-wrap break-all bg-red-50/60 rounded-lg p-2">
              {entry.error}
            </pre>
          )}
          {entry.requestPreview && (
            <div>
              <div className="text-meta font-medium text-ink mb-1">{t("settingsx.app_logs.request")}</div>
              <pre className="text-meta text-muted whitespace-pre-wrap break-all bg-chromeHover/40 rounded-lg p-2 max-h-40 overflow-auto hairline-scroll">
                {entry.requestPreview}
              </pre>
            </div>
          )}
          {entry.responsePreview && (
            <div>
              <div className="text-meta font-medium text-ink mb-1">{t("settingsx.app_logs.response")}</div>
              <pre className="text-meta text-muted whitespace-pre-wrap break-all bg-chromeHover/40 rounded-lg p-2 max-h-48 overflow-auto hairline-scroll">
                {entry.responsePreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Settings ▸ App ▸ App logs — OPC admin HTTP request history for this session. */
export function AppLogsSection() {
  const { t } = useTranslation();
  const [rev, setRev] = useState(0);
  const logs = useMemo(() => listAppRequestLogs(), [rev]);
  const base = getAdminBaseUrl();

  useEffect(() => {
    const onChange = () => setRev((n) => n + 1);
    window.addEventListener(APP_REQUEST_LOG_CHANGED, onChange);
    return () => window.removeEventListener(APP_REQUEST_LOG_CHANGED, onChange);
  }, []);

  return (
    <section data-testid="app-logs-section">
      <PanelHead title={t("settingsx.app_logs.title")} sub={t("settingsx.app_logs.sub")} />

      <div className={CARD + " p-4 mb-4"}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-ui font-medium text-ink">{t("settingsx.app_logs.scope")}</div>
            <div className={FIELD_HELP}>
              {t("settingsx.app_logs.scope_help", { base })}
            </div>
          </div>
          <button
            type="button"
            className={BTN_BORDERED}
            onClick={() => clearAppRequestLogs()}
            disabled={logs.length === 0}
            data-testid="app-logs-clear"
          >
            {t("settingsx.app_logs.clear")}
          </button>
        </div>
      </div>

      <div className={CARD + " overflow-hidden"} data-testid="app-logs-list">
        {logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-ui text-muted">{t("settingsx.app_logs.empty")}</div>
        ) : (
          logs.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </section>
  );
}
