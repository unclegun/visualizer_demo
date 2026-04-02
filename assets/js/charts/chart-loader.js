import { getSiteRoot, joinSitePath } from "../core/dom.js";

export async function loadChartConfigs() {
  const siteRoot = getSiteRoot();
  const path = `${siteRoot}/${joinSitePath("assets", "data", "charts.json")}`;
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load chart configs from ${path}`);
  }

  return response.json();
}
