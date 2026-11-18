import { localPlugins } from "../plugins";
import type { IconName } from "../components/Icon";
import { getCachedIndustryApps } from "./catalog";
import type { IndustryAppCategory, IndustryAppManifest, IndustryAppRemoteDto } from "./types";

const KNOWN_ICONS = new Set<string>([
  "stretch",
  "unstretch",
  "sparkle",
  "logo",
  "sidebar",
  "sidebarRight",
  "signOut",
  "chat",
  "workList",
  "diamond",
  "book",
  "search",
  "folder",
  "folderPlus",
  "plus",
  "brain",
  "clock",
  "sliders",
  "gear",
  "inbox",
  "monitor",
  "cloud",
  "code",
  "wrench",
  "pencil",
  "branch",
  "arrowLeft",
  "arrowRight",
  "team",
  "copy",
  "refresh",
  "panelClose",
  "panelOpen",
  "plug",
  "audit",
  "chevronRight",
  "chevronDown",
  "moreHorizontal",
  "pin",
  "archive",
  "trash",
  "shield",
  "file",
  "fileCode",
  "image",
  "table",
  "mic",
  "stop",
  "warning",
  "user",
  "eye",
  "eyeOff",
  "x",
]);

const CATS = new Set<IndustryAppCategory>([
  "listing",
  "ops",
  "service",
  "content",
  "analytics",
  "global",
]);

function localByPluginId(): Map<string, IndustryAppManifest> {
  const map = new Map<string, IndustryAppManifest>();
  for (const p of localPlugins) {
    map.set(p.id, p);
    if (p.pluginId) map.set(p.pluginId, p);
  }
  return map;
}

function asIcon(raw?: string): IconName {
  if (raw && KNOWN_ICONS.has(raw)) return raw as IconName;
  return "sparkle";
}

function asCategory(raw?: string): IndustryAppCategory {
  if (raw && CATS.has(raw as IndustryAppCategory)) return raw as IndustryAppCategory;
  return "global";
}

function fromRemote(dto: IndustryAppRemoteDto, locals: Map<string, IndustryAppManifest>): IndustryAppManifest {
  const mode = dto.mode || "embed";
  const pluginId = dto.pluginId || (mode === "plugin" ? dto.appKey : undefined) || undefined;
  const local = pluginId ? locals.get(pluginId) : locals.get(dto.appKey);
  const tags =
    dto.tagList && dto.tagList.length
      ? dto.tagList
      : (dto.tags || "")
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean);

  const visibility =
    dto.visibility === "login" || dto.visibility === "subscribe" ? dto.visibility : "public";

  const base: IndustryAppManifest = {
    id: dto.appKey,
    title: dto.title,
    subtitle: dto.subtitle || "",
    category: asCategory(dto.category),
    tags,
    icon: asIcon(dto.icon),
    logo: dto.logo || undefined,
    tone: dto.tone || "#1d4ed8",
    mode,
    url: dto.url || undefined,
    pluginId,
    visibility,
    accessible: dto.accessible !== false,
    available: true,
  };

  if (mode === "plugin") {
    if (local?.Entry) {
      base.Entry = local.Entry;
      base.available = true;
    } else {
      base.available = false;
    }
  }

  return base;
}

/**
 * Prefer remote catalog (admin-configured). Fall back to local plugins if remote empty.
 */
export function listIndustryApps(): IndustryAppManifest[] {
  const remote = getCachedIndustryApps();
  const locals = localByPluginId();
  if (remote && remote.length > 0) {
    return remote.map((dto) => fromRemote(dto, locals));
  }
  return localPlugins.map((p) => ({
    ...p,
    available: p.mode !== "plugin" || !!p.Entry,
    accessible: p.accessible !== false,
  }));
}

export function getIndustryApp(id: string): IndustryAppManifest | undefined {
  return listIndustryApps().find((a) => a.id === id);
}

export function industryAppLabel(app: IndustryAppManifest, t: (key: string) => string): string {
  if (app.title) return app.title;
  if (app.titleKey) return t(app.titleKey);
  return app.id;
}

export function industryAppSub(app: IndustryAppManifest, t: (key: string) => string): string {
  if (app.subtitle) return app.subtitle;
  if (app.subKey) return t(app.subKey);
  return "";
}
