import { localPlugins } from "../plugins";
import type { IndustryAppManifest } from "./types";

/** Merge local plugin packages. Remote config can layer on later. */
export function listIndustryApps(): IndustryAppManifest[] {
  return [...localPlugins];
}

export function getIndustryApp(id: string): IndustryAppManifest | undefined {
  return listIndustryApps().find((a) => a.id === id);
}
