import type { IndustryAppManifest } from "../../industry-apps/types";

/** Local plugin sample — not iframe embed. Entry is attached in plugins/index.ts. */
export const sampleAManifest: Omit<IndustryAppManifest, "Entry"> = {
  id: "sample_a",
  titleKey: "industry_apps.card_sample_a_title",
  subKey: "industry_apps.card_sample_a_sub",
  category: "ops",
  tags: ["industry_apps.tag_plugin", "industry_apps.tag_sample"],
  icon: "wrench",
  tone: "#0f766e",
  mode: "plugin",
};
