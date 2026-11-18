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
  INDUSTRY_APPS_CHANGED,
  PluginHost,
  industryAppLabel,
  industryAppSub,
  listIndustryApps,
  loadIndustryAppsCatalog,
  type IndustryAppCategory,
  type IndustryAppManifest,
} from "../industry-apps";
import { getAccessToken, LOCAL_AUTH_CHANGED } from "../localAuth";
import { openExternal } from "../tauri";

export { AI_ECOM_WORKBENCH_URL } from "../plugins";

type CatId = "all" | IndustryAppCategory;

const CATS: CatId[] = ["all", "listing", "ops", "service", "content", "analytics", "global"];

function tagLabel(tag: string, t: (k: string) => string): string {
  return tag.includes(".") ? t(tag) : tag;
}

type Props = {
  /** True while an app is open solo — App hides the desktop sidebar. */
  onSoloChange?: (solo: boolean) => void;
  /** Sidebar collapsed — show inline reveal beside the title (reference chrome). */
  navCollapsed?: boolean;
  onToggleNav?: () => void;
};

/**
 * Industry apps — remote catalog (admin) merged with local plugin Entry.
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
  const [rev, setRev] = useState(0);
  const apps = useMemo(() => listIndustryApps(), [rev]);

  useEffect(() => {
    const onChange = () => setRev((n) => n + 1);
    window.addEventListener(INDUSTRY_APPS_CHANGED, onChange);
    return () => window.removeEventListener(INDUSTRY_APPS_CHANGED, onChange);
  }, []);

  // Every time this page opens (mount), and after desktop login/logout, re-fetch entitlements.
  useEffect(() => {
    void loadIndustryAppsCatalog({ force: true });
    const onAuth = () => void loadIndustryAppsCatalog({ force: true });
    window.addEventListener(LOCAL_AUTH_CHANGED, onAuth);
    return () => window.removeEventListener(LOCAL_AUTH_CHANGED, onAuth);
  }, []);

  useEffect(() => {
    onSoloChange?.(active != null);
    return () => onSoloChange?.(false);
  }, [active, onSoloChange]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (cat !== "all" && app.category !== cat) return false;
      if (!q) return true;
      const hay = `${industryAppLabel(app, t)} ${industryAppSub(app, t)} ${app.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [apps, query, cat, t]);

  if (active) {
    const title = industryAppLabel(active, t);
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
                const title = industryAppLabel(app, t);
                const pluginMissing = app.mode === "plugin" && app.available === false;
                const noAccess = app.accessible === false;
                const locked = pluginMissing || noAccess;
                const lockTip = pluginMissing
                  ? t("industry_apps.unavailable")
                  : noAccess
                    ? app.visibility === "login"
                      ? t("industry_apps.need_login")
                      : getAccessToken()
                        ? t("industry_apps.need_subscribe")
                        : t("industry_apps.need_login")
                    : undefined;
                return (
                  <article
                    key={app.id}
                    className={
                      "group relative rounded-xl2 border border-line bg-panel px-4 py-4 transition-colors " +
                      (locked
                        ? "opacity-60"
                        : "hover:border-lineStrong hover:bg-chromeHover/40")
                    }
                    data-testid={`industry-app-${app.id}`}
                    title={lockTip}
                  >
                    <div className="flex items-center gap-3 pr-16">
                      <div
                        className="w-14 h-14 rounded-xl shrink-0 grid place-items-center overflow-hidden text-white [&_svg]:text-white"
                        style={{ background: app.logo ? "#fff" : app.tone }}
                        aria-hidden
                      >
                        {app.logo ? (
                          <img src={app.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name={app.icon} size={24} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-body font-semibold text-ink truncate">{title}</div>
                      </div>
                    </div>

                    <div
                      className={
                        "absolute top-3.5 right-3.5 flex flex-col items-end gap-1 " +
                        "opacity-0 pointer-events-none translate-y-0.5 " +
                        "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 " +
                        "group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 " +
                        "transition-[opacity,transform] duration-150"
                      }
                    >
                      <button
                        type="button"
                        className={
                          "h-8 px-3.5 rounded-full bg-ink text-white text-ui font-medium " +
                          "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        }
                        data-testid={`industry-app-go-${app.id}`}
                        disabled={locked}
                        aria-disabled={locked}
                        aria-label={lockTip ? `${t("industry_apps.go")}: ${lockTip}` : t("industry_apps.go")}
                        title={lockTip}
                        onClick={() => {
                          if (locked) return;
                          if (app.mode === "external" && app.url) {
                            openExternal(app.url);
                            return;
                          }
                          setActive(app);
                        }}
                      >
                        {t("industry_apps.go")}
                      </button>
                      {lockTip ? (
                        <div
                          className="max-w-[11rem] rounded-md bg-ink text-white text-meta px-2 py-1 leading-snug shadow-sm"
                          role="tooltip"
                          data-testid={`industry-app-tip-${app.id}`}
                        >
                          {lockTip}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-ui text-muted mt-2.5 line-clamp-2 leading-snug">
                      {industryAppSub(app, t)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.tags.map((tk) => (
                        <span
                          key={tk}
                          className="text-label px-1.5 py-0.5 rounded-md bg-chromeHover/80 text-muted"
                        >
                          {tagLabel(tk, t)}
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
