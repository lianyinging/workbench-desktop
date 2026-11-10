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
  /** i18n keys for list card copy */
  titleKey: string;
  subKey: string;
  category: IndustryAppCategory;
  tags: readonly string[];
  icon: IconName;
  tone: string;
  mode: IndustryAppMode;
  /** Required for embed / external */
  url?: string;
  /** Local React entry — required for mode === "plugin" */
  Entry?: ComponentType;
};
