/**
 * Local industry-app plugins.
 * Add a new app: create `plugins/<id>/` with manifest (+ optional Entry), then
 * register it here. Do not touch Sidebar / sessions / automations.
 */
import { aiEcommerceManifest } from "./ai-ecommerce/manifest";
import { AiEcommercePlugin } from "./ai-ecommerce";
import { sampleAManifest } from "./sample-a/manifest";
import { SampleAPlugin } from "./sample-a";
import type { IndustryAppManifest } from "../industry-apps/types";

export const localPlugins: IndustryAppManifest[] = [
  {
    ...aiEcommerceManifest,
    // Entry reserved for mode === "plugin"; embed apps ignore it.
    Entry: AiEcommercePlugin,
  },
  {
    ...sampleAManifest,
    Entry: SampleAPlugin,
  },
];

export { AI_ECOM_WORKBENCH_URL } from "./ai-ecommerce/manifest";
