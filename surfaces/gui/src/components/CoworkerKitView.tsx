import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconBolt,
  IconCategory2,
  IconCheck,
  IconDownload,
  IconLink,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  getCloudStatus,
  getConnectors,
  getPersonasIndex,
  listSkills,
  updatePersona,
  updateSkill,
  type CloudStatus,
  type Connector,
  type Persona,
  type SkillRow,
} from "../api";
import { ConnectorBadge } from "../connectors/ConnectorIcon";
import { listPersonaName } from "../personaScope";
import { beginWindowDrag, WINDOW_DRAG_CLASS } from "../windowDrag";
import { AddConnectionModal } from "./connectors/AddConnectionModal";
import { AddMcpModal } from "./connectors/CustomMcp";
import { ConnectorsSection } from "./connectors/ConnectorsSection";
import { Icon } from "./Icon";
import { PersonaGlyph } from "./personaIcon";
import { SkillsTab } from "./SkillsTab";

export type CoworkerKitTab = "experts" | "skills" | "connectors";

type Props = {
  initialTab?: CoworkerKitTab;
  onOpenPersona?: (id: string) => void;
  onCreateSkill?: (description: string) => void;
  onConfigureConnector?: (name: string) => void;
  /** Sidebar collapsed — show inline reveal beside the tab row (reference chrome). */
  navCollapsed?: boolean;
  onToggleNav?: () => void;
};

type ExpertSort = "mixed" | "hot" | "new";
type SkillSort = "mixed" | "usage" | "installs" | "new";

const TONES = ["#2563eb", "#0f766e", "#7c3aed", "#b45309", "#059669", "#dc2626", "#0284c7", "#9333ea"];

function toneFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

function metricFor(id: string, scale = 1): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  const n = ((h % 9000) + 1000) * scale;
  return n >= 10000 ? `${(n / 10000).toFixed(2)}w` : String(n);
}

/**
 * Marketplace shell for coworkers · skills · connectors — layout matches the
 * product reference (search chrome, filters, card grids) while every action
 * hits the real personas / skills / connectors APIs.
 */
export function CoworkerKitView({
  initialTab = "experts",
  onOpenPersona,
  onCreateSkill,
  onConfigureConnector,
  navCollapsed = false,
  onToggleNav,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CoworkerKitTab>(initialTab);
  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [skillsManage, setSkillsManage] = useState(false);

  // Reset search when switching tabs so placeholders stay honest.
  useEffect(() => {
    setQuery("");
    setMineOnly(false);
    setSkillsManage(false);
  }, [tab]);

  const searchPlaceholder =
    tab === "experts"
      ? t("coworker_kit.search_experts")
      : tab === "skills"
        ? t("coworker_kit.search_skills")
        : t("coworker_kit.search_connectors");

  /* Vertical inset lives in CSS (web brand band / desktop traffic-light band). */
  const chromeInner = navCollapsed ? "px-4 max-w-none" : "px-7 max-w-5xl";

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-panel" data-testid="coworker-kit">
      {/* Fixed chrome (not sticky-in-scroll) — only the pane below scrolls. */}
      <div
        className={"coworker-kit-sticky shrink-0 bg-panel border-b border-line " + WINDOW_DRAG_CLASS}
        onPointerDown={beginWindowDrag}
      >
        <div className={chromeInner}>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {navCollapsed && onToggleNav && (
                <>
                  <button
                    type="button"
                    className="topbar-icon-btn shrink-0"
                    data-testid="coworker-kit-nav-reveal"
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
              <div className="flex items-center gap-1" role="tablist" aria-label={t("sidebar.coworker_kit")}>
              {(
                [
                  { id: "experts" as const, icon: IconUser, label: t("coworker_kit.tab_experts") },
                  { id: "skills" as const, icon: IconCategory2, label: t("coworker_kit.tab_skills") },
                  { id: "connectors" as const, icon: IconLink, label: t("coworker_kit.tab_connectors") },
                ] as const
              ).map((item) => {
                const ActiveIcon = item.icon;
                const on = tab === item.id;
                const flushLeft = item.id === "experts" && !navCollapsed;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={on}
                    data-testid={`coworker-kit-tab-${item.id}`}
                    className={
                      "inline-flex items-center gap-1.5 h-8 rounded-lg text-body transition-colors " +
                      (flushLeft ? "pl-0 pr-3" : "px-3") +
                      (on ? " font-semibold text-ink" : " text-muted hover:text-ink")
                    }
                    onClick={() => setTab(item.id)}
                  >
                    <ActiveIcon size={18} stroke={1.7} aria-hidden />
                    {item.label}
                  </button>
                );
              })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <label className="relative flex items-center">
                <IconSearch size={16} stroke={1.7} className="absolute left-2.5 text-faint pointer-events-none" />
                <input
                  className="h-8 w-[220px] pl-8 pr-3 rounded-full border border-line bg-panel text-body text-ink placeholder:text-placeholder outline-none focus:border-lineStrong"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  data-testid="coworker-kit-search"
                />
              </label>

              {tab === "experts" && (
                <button
                  type="button"
                  className={
                    "h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full border text-body " +
                    (mineOnly
                      ? "border-lineStrong bg-chromeHover text-ink font-medium"
                      : "border-line bg-panel text-ink hover:bg-chromeHover")
                  }
                  aria-pressed={mineOnly}
                  onClick={() => setMineOnly((v) => !v)}
                >
                  <IconUsersGroup size={16} stroke={1.7} aria-hidden />
                  {t("coworker_kit.mine_experts")}
                </button>
              )}

              {tab === "skills" && (
                <>
                  <SkillsInstalledChip active={mineOnly} onToggle={() => setMineOnly((v) => !v)} />
                  <button
                    type="button"
                    className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-ink text-white text-body hover:opacity-90"
                    onClick={() => setSkillsManage(true)}
                    data-testid="coworker-kit-add-skill"
                  >
                    <IconPlus size={16} stroke={1.8} aria-hidden />
                    {t("skills.add_skill")}
                  </button>
                </>
              )}

              {tab === "connectors" && <ConnectorsCustomButton />}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto hairline-scroll">
        <div className="max-w-5xl px-7 pt-4 pb-5">
          {tab === "experts" ? (
            <ExpertsPane query={query} mineOnly={mineOnly} onOpenPersona={onOpenPersona} />
          ) : tab === "skills" ? (
            skillsManage ? (
              <div>
                <button
                  type="button"
                  className="text-ui text-accent mb-3"
                  onClick={() => setSkillsManage(false)}
                >
                  ← {t("coworker_kit.back_marketplace")}
                </button>
                <SkillsTab onCreateSkill={onCreateSkill} />
              </div>
            ) : (
              <SkillsPane
                query={query}
                installedOnly={mineOnly}
                onManage={() => setSkillsManage(true)}
                onCreateSkill={onCreateSkill}
              />
            )
          ) : (
            <ConnectorsPane query={query} onConfigureConnector={onConfigureConnector} />
          )}
        </div>
      </div>
    </main>
  );
}

function SkillsInstalledChip({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const [n, setN] = useState(0);
  useEffect(() => {
    listSkills()
      .then((rows) => setN(rows.length))
      .catch(() => setN(0));
  }, []);
  return (
    <button
      type="button"
      className={
        "h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full border text-body " +
        (active
          ? "border-lineStrong bg-chromeHover text-ink font-medium"
          : "border-line bg-panel text-ink hover:bg-chromeHover")
      }
      aria-pressed={active}
      onClick={onToggle}
    >
      <IconCheck size={16} stroke={1.8} aria-hidden />
      {t("coworker_kit.installed_n", { count: n })}
    </button>
  );
}

function ConnectorsCustomButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-ink text-white text-body hover:opacity-90"
        onClick={() => setOpen(true)}
        data-testid="coworker-kit-custom-connector"
      >
        <IconPencil size={16} stroke={1.8} aria-hidden />
        {t("coworker_kit.custom_connector")}
      </button>
      {open && (
        <AddMcpModal
          onClose={() => setOpen(false)}
          onChanged={() => setOpen(false)}
          onAdded={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ---------------- Experts ---------------- */

function ExpertsPane({
  query,
  mineOnly,
  onOpenPersona,
}: {
  query: string;
  mineOnly: boolean;
  onOpenPersona?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<ExpertSort>("mixed");
  const [tag, setTag] = useState<string>("all");

  const reload = () =>
    getPersonasIndex()
      .then((r) => setPersonas(r.personas.filter((p) => p.ships !== false)))
      .catch(() => setPersonas([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    reload();
  }, []);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of personas) if (p.group) set.add(p.group);
    return ["all", ...Array.from(set)];
  }, [personas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = personas.filter((p) => {
      if (mineOnly && !p.enabled) return false;
      if (tag !== "all" && (p.group || "general") !== tag) return false;
      if (!q) return true;
      const name = listPersonaName(p.name, p.id, t).toLowerCase();
      return name.includes(q) || p.tagline.toLowerCase().includes(q) || p.id.includes(q);
    });
    if (sort === "hot") rows = [...rows].sort((a, b) => b.tools.length - a.tools.length);
    else if (sort === "new")
      rows = [...rows].sort((a, b) => (b.installed_at || "").localeCompare(a.installed_at || ""));
    else rows = [...rows].sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name));
    return rows;
  }, [personas, query, mineOnly, tag, sort, t]);

  const tagLabel = (id: string) =>
    id === "all"
      ? t("coworker_kit.tag_all")
      : t(`personas.group_${id}`, { defaultValue: id });

  return (
    <section>
      {/* Tab label lives in sticky head — keep sort + tags only. */}
      <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
        <SortPills
          value={sort}
          options={[
            ["mixed", "coworker_kit.sort_mixed"],
            ["hot", "coworker_kit.sort_hot"],
            ["new", "coworker_kit.sort_new"],
          ]}
          onChange={setSort}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.map((id) => (
          <Chip key={id} active={tag === id} onClick={() => setTag(id)} label={tagLabel(id)} />
        ))}
      </div>

      {loading ? (
        <div className="text-ui text-muted py-10 text-center">{t("coworker_kit.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl2 border border-line bg-panel px-5 py-10 text-center text-muted text-ui">
          {t("coworker_kit.empty_experts")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="rounded-xl2 border border-line bg-panel px-4 py-4 flex gap-3.5 hover:border-lineStrong transition-colors cursor-pointer"
              data-testid={`coworker-kit-card-${p.id}`}
              onClick={() => onOpenPersona?.(p.id)}
            >
              <div
                className="w-14 h-14 rounded-xl shrink-0 grid place-items-center text-white"
                style={{ background: toneFor(p.id) }}
                aria-hidden
              >
                <PersonaGlyph icon={p.icon} folderScoped={p.requires_folder} size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-body font-semibold text-ink truncate">
                    {listPersonaName(p.name, p.id, t)}
                  </div>
                  <button
                    type="button"
                    className={
                      "shrink-0 w-8 h-8 rounded-md grid place-items-center border " +
                      (p.enabled
                        ? "bg-ok/15 border-ok/30 text-ok"
                        : "bg-paper border-line text-muted hover:text-ink")
                    }
                    title={p.enabled ? t("personas.disable_coworker") : t("personas.enable_coworker")}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const r = await updatePersona(p.id, { enabled: !p.enabled });
                      if (r.personas) setPersonas(r.personas.filter((x) => x.ships !== false));
                      else reload();
                    }}
                  >
                    {p.enabled ? <IconCheck size={16} stroke={2} /> : <IconPlus size={16} stroke={2} />}
                  </button>
                </div>
                <p className="text-ui text-muted mt-0.5 line-clamp-2 leading-snug">
                  {p.tagline || t("coworker_kit.no_tagline")}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(p.group ? [p.group] : ["general"]).map((g) => (
                    <span
                      key={g}
                      className="text-meta px-1.5 py-0.5 rounded bg-paper border border-line text-muted"
                    >
                      {tagLabel(g)}
                    </span>
                  ))}
                  {p.tools.slice(0, 2).map((tool) => (
                    <span
                      key={tool}
                      className="text-meta px-1.5 py-0.5 rounded bg-paper border border-line text-muted"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-ui text-faint">
                  <IconBolt size={15} stroke={1.7} className="text-warnInk" aria-hidden />
                  {metricFor(p.id)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Skills ---------------- */

function SkillsPane({
  query,
  installedOnly,
  onManage,
  onCreateSkill,
}: {
  query: string;
  installedOnly: boolean;
  onManage: () => void;
  onCreateSkill?: (description: string) => void;
}) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SkillSort>("mixed");
  const [tag, setTag] = useState("all");
  const [featuredOffset, setFeaturedOffset] = useState(0);

  const reload = () =>
    listSkills()
      .then(setSkills)
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = skills.filter((s) => {
      if (installedOnly && !s.enabled) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
      );
    });
    if (sort === "usage" || sort === "installs")
      rows = [...rows].sort((a, b) => metricFor(b.name).localeCompare(metricFor(a.name)));
    else if (sort === "new") rows = [...rows].reverse();
    return rows;
  }, [skills, query, installedOnly, sort]);

  const featured = useMemo(() => {
    if (filtered.length === 0) return [];
    const a = filtered[featuredOffset % filtered.length];
    const b = filtered[(featuredOffset + 1) % filtered.length];
    return a === b ? [a] : [a, b];
  }, [filtered, featuredOffset]);

  const tags = useMemo(() => {
    // Skills don't carry categories — offer All + scope chips.
    return ["all", "global", "project"] as const;
  }, []);

  const byTag = useMemo(() => {
    if (tag === "all") return filtered;
    return filtered.filter((s) => s.scope === tag);
  }, [filtered, tag]);

  const toggle = async (s: SkillRow) => {
    const r = await updateSkill(s.name, { enabled: !s.enabled });
    if (!r.ok) return;
    reload();
  };

  if (loading) {
    return <div className="text-ui text-muted py-10 text-center">{t("coworker_kit.loading")}</div>;
  }

  if (skills.length === 0) {
    return (
      <div className="rounded-xl2 border border-line bg-panel px-6 py-14 text-center">
        <div className="text-heading font-semibold text-ink">{t("coworker_kit.skills_empty_title")}</div>
        <p className="text-ui text-muted mt-1.5 max-w-md mx-auto">{t("coworker_kit.skills_empty_sub")}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="text-ui px-3 py-1.5 rounded-lg bg-ink text-white"
            onClick={onManage}
          >
            {t("skills.add_skill")}
          </button>
          {onCreateSkill && (
            <button
              type="button"
              className="text-ui px-3 py-1.5 rounded-lg border border-line bg-panel"
              onClick={() => onCreateSkill("")}
            >
              {t("skills.door_ai")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section>
      {!installedOnly && featured.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading font-semibold">{t("coworker_kit.featured_skills")}</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-meta text-muted hover:text-ink"
              onClick={() => setFeaturedOffset((n) => n + 2)}
            >
              <IconRefresh size={14} stroke={1.7} aria-hidden />
              {t("coworker_kit.shuffle")}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((s) => (
              <SkillCard key={`feat-${s.name}`} skill={s} onToggle={() => toggle(s)} featured />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-heading font-semibold">{t("coworker_kit.recommended")}</h2>
        <SortPills
          value={sort}
          options={[
            ["mixed", "coworker_kit.sort_mixed"],
            ["usage", "coworker_kit.sort_usage"],
            ["installs", "coworker_kit.sort_installs"],
            ["new", "coworker_kit.sort_new"],
          ]}
          onChange={setSort}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.map((id) => (
          <Chip
            key={id}
            active={tag === id}
            onClick={() => setTag(id)}
            label={
              id === "all"
                ? t("coworker_kit.tag_all")
                : id === "global"
                  ? t("coworker_kit.tag_global_scope")
                  : t("coworker_kit.tag_project_scope")
            }
          />
        ))}
      </div>

      {byTag.length === 0 ? (
        <div className="rounded-xl2 border border-line bg-panel px-5 py-10 text-center text-muted text-ui">
          {t("coworker_kit.empty_skills")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {byTag.map((s) => (
            <SkillCard key={s.name} skill={s} onToggle={() => toggle(s)} />
          ))}
        </div>
      )}
    </section>
  );
}

function SkillCard({
  skill,
  onToggle,
  featured,
}: {
  skill: SkillRow;
  onToggle: () => void;
  featured?: boolean;
}) {
  return (
    <article
      className={
        "rounded-xl2 border border-line bg-panel px-4 py-4 flex gap-3.5 hover:border-lineStrong transition-colors " +
        (featured ? "min-h-[96px]" : "")
      }
      data-testid={`coworker-kit-skill-${skill.name}`}
    >
      <div
        className="w-14 h-14 rounded-xl shrink-0 grid place-items-center text-white"
        style={{ background: toneFor(skill.name) }}
        aria-hidden
      >
        <IconCategory2 size={26} stroke={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="text-body font-semibold text-ink truncate">{skill.name}</div>
          <button
            type="button"
            className={
              "shrink-0 w-8 h-8 rounded-md grid place-items-center border " +
              (skill.enabled
                ? "bg-ok/15 border-ok/30 text-ok"
                : "bg-paper border-line text-muted hover:text-ink")
            }
            onClick={onToggle}
            aria-label={skill.enabled ? "disable" : "enable"}
          >
            {skill.enabled ? <IconCheck size={16} stroke={2} /> : <IconPlus size={16} stroke={2} />}
          </button>
        </div>
        <p className="text-ui text-muted mt-0.5 line-clamp-2 leading-snug">
          {skill.description || "—"}
        </p>
        <div className="mt-2 inline-flex items-center gap-3 text-ui text-faint">
          <span className="inline-flex items-center gap-1">
            <IconBolt size={15} stroke={1.7} className="text-warnInk" aria-hidden />
            {metricFor(skill.name, 1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconDownload size={15} stroke={1.7} aria-hidden />
            {metricFor(skill.name + "-dl", 2)}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Connectors ---------------- */

function ConnectorsPane({
  query,
  onConfigureConnector,
}: {
  query: string;
  onConfigureConnector?: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [cloud, setCloud] = useState<CloudStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Connector | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const refresh = () => {
    getConnectors()
      .then(setConnectors)
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false));
    getCloudStatus().then(setCloud).catch(() => setCloud(null));
  };

  useEffect(() => {
    refresh();
    const tmr = setInterval(refresh, 5000);
    return () => clearInterval(tmr);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return connectors.filter((c) => {
      if (!c.available && !c.connected) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.name.includes(q) ||
        (c.blurb || "").toLowerCase().includes(q) ||
        (c.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [connectors, query]);

  if (detail) {
    return (
      <div>
        <button type="button" className="text-ui text-accent mb-3" onClick={() => setDetail(null)}>
          ← {t("coworker_kit.back_marketplace")}
        </button>
        <ConnectorsSection
          key={detail}
          initialDetail={detail}
          onConfigure={(name) => {
            setDetail(null);
            onConfigureConnector?.(name);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="text-ui text-muted py-10 text-center">{t("coworker_kit.loading")}</div>;
  }

  return (
    <section>
      {filtered.length === 0 ? (
        <div className="rounded-xl2 border border-line bg-panel px-5 py-10 text-center text-muted text-ui">
          {t("coworker_kit.empty_connectors")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c.name}
              className="rounded-xl2 border border-line bg-panel px-4 py-3.5 flex gap-3.5 items-start hover:border-lineStrong transition-colors"
              data-testid={`coworker-kit-connector-${c.name}`}
            >
              <ConnectorBadge connector={c} size={48} title={c.title} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left min-w-0"
                    onClick={() => setDetail(c.name)}
                  >
                    <div className="text-body font-semibold text-ink truncate inline-flex items-center gap-1.5">
                      {c.connected && <span className="w-1.5 h-1.5 rounded-full bg-ok shrink-0" />}
                      {c.title}
                    </div>
                    <p className="text-ui text-muted mt-0.5 line-clamp-2 leading-snug">
                      {c.blurb || c.about || "—"}
                    </p>
                  </button>
                  <button
                    type="button"
                    className={
                      "shrink-0 w-8 h-8 rounded-md grid place-items-center border " +
                      (c.connected
                        ? "bg-ok/15 border-ok/30 text-ok"
                        : "bg-paper border-line text-muted hover:text-ink")
                    }
                    title={c.connected ? t("connector.connected") : t("connector.connect")}
                    onClick={() => {
                      if (c.connected) setDetail(c.name);
                      else if (c.name === "slack" || c.name === "github") onConfigureConnector?.(c.name);
                      else setConnecting(c);
                    }}
                  >
                    {c.connected ? <IconCheck size={16} stroke={2} /> : <IconPlus size={16} stroke={2} />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {connecting && (
        <AddConnectionModal
          c={connecting}
          cloud={cloud}
          onClose={() => setConnecting(null)}
          onChanged={() => {
            setConnecting(null);
            refresh();
          }}
        />
      )}
    </section>
  );
}

/* ---------------- shared chrome ---------------- */

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={
        "px-3 py-1.5 rounded-full text-ui border " +
        (active
          ? "bg-chromeHover border-lineStrong text-ink font-medium"
          : "bg-transparent border-transparent text-muted hover:text-ink")
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SortPills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-ui">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={
            "px-3 py-1.5 rounded-md " +
            (value === key ? "bg-chromeHover text-ink font-medium" : "text-muted hover:text-ink")
          }
          onClick={() => onChange(key)}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}
