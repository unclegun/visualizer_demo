import { getSiteRoot, joinSitePath } from "../core/dom.js";

export async function loadPalettes() {
  const siteRoot = getSiteRoot();
  const path = `${siteRoot}/${joinSitePath("assets", "data", "palettes.json")}`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load palettes from ${path}`);
  }

  const palettes = await response.json();
  if (!Array.isArray(palettes)) {
    throw new Error("Palette JSON was not an array");
  }

  return palettes;
}

export function findPaletteById(palettes, id) {
  return palettes.find((palette) => palette.id === id);
}

export function getContrastColor(hexColor) {
  const color = (hexColor || "").replace("#", "");
  if (color.length !== 6) {
    return "#ffffff";
  }

  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  const luma = (0.299 * red) + (0.587 * green) + (0.114 * blue);
  return luma >= 150 ? "#1f2937" : "#ffffff";
}
