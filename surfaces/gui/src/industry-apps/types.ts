import type { ComponentType } from "react";
import type { IconName } from "../components/Icon";

/** Industry-app category ids used by the list chrome. */
export type IndustryAppCategory =
  | "listing"
  | "ops"
  | "service"
  | "content"
  | "analytics"
  | "global";

/** How the host opens the app — see tech doc §6.4. */
export type IndustryAppMode = "embed" | "plugin" | "external";

export type IndustryAppManifest = {
  id: string;
  /** Plain title from remote config (preferred when set) */
  title?: string;
  /** Plain subtitle from remote config */
  subtitle?: string;
  /** i18n keys for list card copy (local fallback) */
  titleKey?: string;
  subKey?: string;
  category: IndustryAppCategory;
  tags: readonly string[];
  icon: IconName;
  /** Optional admin-uploaded logo (data URL / base64) */
  logo?: string;
  tone: string;
  mode: IndustryAppMode;
  /** Required for embed / external */
  url?: string;
  /** Remote plugin id — join to local Entry */
  pluginId?: string;
  /** Local React entry — required for mode === "plugin" when available */
  Entry?: ComponentType;
  /** false when plugin mode but local Entry missing */
  available?: boolean;
  /** Server entitlement for current desktop user (login + subscribe) */
  accessible?: boolean;
  visibility?: "public" | "login" | "subscribe";
};

/** DTO from GET /opc/desktop/industry-apps */
export type IndustryAppRemoteDto = {
  appId?: number;
  appKey: string;
  title: string;
  subtitle?: string;
  category?: string;
  tags?: string;
  tagList?: string[];
  icon?: string;
  logo?: string | null;
  tone?: string;
  mode: IndustryAppMode;
  url?: string | null;
  pluginId?: string | null;
  visibility?: string;
  /** false → show card but gray out 前往 */
  accessible?: boolean;
  sortOrder?: number;
};
