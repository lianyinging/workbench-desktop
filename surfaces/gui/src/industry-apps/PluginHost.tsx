import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { beginWindowDrag, WINDOW_DRAG_CLASS } from "../windowDrag";
import type { IndustryAppManifest } from "./types";

export function PluginHost({
  app,
  title,
  onBack,
}: {
  app: IndustryAppManifest;
  title: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const Entry = app.Entry;

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-panel" data-testid="industry-apps-plugin">
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
              <div className="text-meta text-faint truncate">
                {t("industry_apps.tag_plugin")}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto hairline-scroll">
        {Entry ? <Entry /> : (
          <div className="h-full grid place-items-center text-ui text-muted p-8">
            {t("industry_apps.empty")}
          </div>
        )}
      </div>
    </main>
  );
}
