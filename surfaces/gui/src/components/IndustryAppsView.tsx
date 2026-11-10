import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconBolt,
  IconSearch,
  IconTableShortcut,
} from "@tabler/icons-react";
import { beginWindowDrag, WINDOW_DRAG_CLASS } from "../windowDrag";
import { Icon } from "./Icon";
import {
  EmbedHost,
  PluginHost,
  listIndustryApps,
  type IndustryAppCategory,
  type IndustryAppManifest,
} from "../industry-apps";
import { openExternal } from "../tauri";

export { AI_ECOM_WORKBENCH_URL } from "../plugins";

type CatId = "all" | IndustryAppCategory;

const CATS: CatId[] = ["all", "listing", "ops", "service", "content", "analytics", "global"];

type Props = {
  /** True while an app is open solo — App hides the desktop sidebar. */
  onSoloChange?: (solo: boolean) => void;
  /** Sidebar collapsed — show inline reveal beside the title (reference chrome). */
  navCollapsed?: boolean;
  onToggleNav?: () => void;
};

/**
 * Industry apps — list from local plugin registry; open via EmbedHost / PluginHost.
 */
export function IndustryAppsView({
  onSoloChange,
  navCollapsed = false,
  onToggleNav,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CatId>("all");
  const [active, setActive] = useState<IndustryAppManifest | null>(null);
  const apps = useMemo(() => listIndustryApps(), []);

  useEffect(() => {
    onSoloChange?.(active != null);
    return () => onSoloChange?.(false);
  }, [active, onSoloChange]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (cat !== "all" && app.category !== cat) return false;
      if (!q) return true;
      const hay = `${t(app.titleKey)} ${t(app.subKey)} ${app.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [apps, query, cat, t]);

  if (active) {
    const title = t(active.titleKey);
    if (active.mode === "plugin") {
      return <PluginHost app={active} title={title} onBack={() => setActive(null)} />;
    }
    return <EmbedHost app={active} title={title} onBack={() => setActive(null)} />;
  }

  const listChromeInner = navCollapsed ? "px-4 max-w-none" : "px-7 max-w-5xl";

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-panel" data-testid="industry-apps">
      <div
        className={"industry-apps-sticky shrink-0 bg-panel border-b border-line " + WINDOW_DRAG_CLASS}
        onPointerDown={beginWindowDrag}
      >
        <div className={listChromeInner}>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {navCollapsed && onToggleNav && (
                <>
                  <button
                    type="button"
                    className="topbar-icon-btn shrink-0"
                    data-testid="industry-apps-nav-reveal"
                    title={t("topbar.show_sidebar")}
                    aria-label={t("topbar.show_sidebar_short")}
                    onClick={onToggleNav}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Icon name="sidebar" size={18} />
                  </button>
                  <span className="topbar-cluster-sep text-faint select-none" aria-hidden="true">
                    |
                  </span>
                </>
              )}
              <div
                className={
                  "inline-flex items-center gap-1.5 h-8 rounded-lg text-body font-semibold text-ink " +
                  (navCollapsed ? "px-3" : "pl-0 pr-3")
                }
              >
                <IconTableShortcut size={18} stroke={1.7} aria-hidden />
                {t("industry_apps.title")}
              </div>
            </div>
            <label className="relative flex items-center">
              <IconSearch size={16} stroke={1.7} className="absolute left-2.5 text-faint pointer-events-none" />
              <input
                className="h-8 w-[220px] pl-8 pr-3 rounded-full border border-line bg-panel text-body text-ink placeholder:text-placeholder outline-none focus:border-lineStrong"
                placeholder={t("industry_apps.search_placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="industry-apps-search"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto hairline-scroll">
        <div className="max-w-5xl px-7 pt-4 pb-5">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATS.map((id) => (
              <button
                key={id}
                type="button"
                className={
                  "px-3 py-1.5 rounded-full text-ui border " +
                  (cat === id
                    ? "bg-chromeHover border-lineStrong text-ink font-medium"
                    : "bg-transparent border-transparent text-muted hover:text-ink")
                }
                onClick={() => setCat(id)}
              >
                {t(`industry_apps.cat_${id}`)}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl2 border border-line bg-panel px-5 py-10 text-center text-muted text-ui">
              {t("industry_apps.empty")}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2" data-testid="industry-apps-grid">
              {visible.map((app) => {
                const title = t(app.titleKey);
                return (
                  <article
                    key={app.id}
                    className="group relative rounded-xl2 border border-line bg-panel px-4 py-4 hover:border-lineStrong hover:bg-chromeHover/40 transition-colors"
                    data-testid={`industry-app-${app.id}`}
                  >
                    <div className="flex items-center gap-3 pr-16">
                      <div
                        className="w-14 h-14 rounded-xl shrink-0 grid place-items-center text-white [&_svg]:text-white"
                        style={{ background: app.tone }}
                        aria-hidden
                      >
                        <Icon name={app.icon} size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-body font-semibold text-ink truncate">{title}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={
                        "absolute top-3.5 right-3.5 h-8 px-3.5 rounded-full bg-ink text-white text-ui font-medium " +
                        "opacity-0 pointer-events-none translate-y-0.5 " +
                        "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 " +
                        "group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 " +
                        "transition-[opacity,transform] duration-150 hover:opacity-90"
                      }
                      data-testid={`industry-app-go-${app.id}`}
                      onClick={() => {
                        if (app.mode === "external" && app.url) {
                          openExternal(app.url);
                          return;
                        }
                        setActive(app);
                      }}
                    >
                      {t("industry_apps.go")}
                    </button>

                    <p className="text-ui text-muted mt-2.5 line-clamp-2 leading-snug">{t(app.subKey)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.tags.map((tk) => (
                        <span
                          key={tk}
                          className="text-label px-1.5 py-0.5 rounded-md bg-chromeHover/80 text-muted"
                        >
                          {t(tk)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2.5 inline-flex items-center gap-1 text-meta text-faint">
                      <IconBolt size={14} stroke={1.7} className="text-warnInk" aria-hidden />
                      {app.mode === "embed" ? "Web" : app.mode === "plugin" ? "Plugin" : "Link"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
