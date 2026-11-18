import type { IndustryAppManifest } from "../../industry-apps/types";

/** Destination — OPC AI 电商工作台. */
export const AI_ECOM_WORKBENCH_URL = "http://118.253.178.37:3030/";

/**
 * First industry app: opened via embed Web (iframe Host).
 * Local plugin folder keeps metadata here so core dirs stay clean.
 */
export const aiEcommerceManifest: IndustryAppManifest = {
  id: "ai_ecommerce",
  titleKey: "industry_apps.card_ai_ecommerce_title",
  subKey: "industry_apps.card_ai_ecommerce_sub",
  category: "global",
  tags: ["industry_apps.tag_ai", "industry_apps.tag_sourcing"],
  icon: "sparkle",
  tone: "#1d4ed8",
  mode: "embed",
  url: AI_ECOM_WORKBENCH_URL,
};
