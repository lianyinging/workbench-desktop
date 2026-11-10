import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { openExternal } from "../tauri";
import { beginWindowDrag, WINDOW_DRAG_CLASS } from "../windowDrag";
import type { IndustryAppManifest } from "./types";

export function EmbedHost({
  app,
  title,
  onBack,
}: {
  app: IndustryAppManifest;
  title: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const url = app.url || "";

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-panel" data-testid="industry-apps-embed">
      <div
        className={"industry-apps-sticky shrink-0 bg-panel border-b border-line " + WINDOW_DRAG_CLASS}
        onPointerDown={beginWindowDrag}
      >
        <div className="max-w-none mx-auto px-4 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-ui text-ink hover:bg-chromeHover shrink-0"
              onClick={onBack}
              data-testid="industry-apps-back"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <IconArrowLeft size={16} stroke={1.7} aria-hidden />
              {t("industry_apps.back_list")}
            </button>
            <span className="topbar-cluster-sep text-faint select-none" aria-hidden="true">
              |
            </span>
            <div className="min-w-0">
              <div className="text-ui font-semibold text-ink truncate">{title}</div>
              <div className="text-meta text-faint truncate max-w-[420px]">{url}</div>
            </div>
          </div>
          {url && (
            <button
              type="button"
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full border border-line bg-panel text-ui text-ink hover:bg-chromeHover"
              onClick={() => openExternal(url)}
            >
              <IconExternalLink size={14} stroke={1.7} aria-hidden />
              {t("industry_apps.open_external")}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0 bg-panel">
        {url ? (
          <iframe
            title={title}
            src={url}
            className="w-full h-full border-0 bg-panel"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            referrerPolicy="no-referrer-when-downgrade"
            data-testid="industry-apps-iframe"
          />
        ) : (
          <div className="h-full grid place-items-center text-ui text-muted">
            {t("industry_apps.empty")}
          </div>
        )}
      </div>
    </main>
  );
}
