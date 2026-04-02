import { qs, setRootVariable } from "../core/dom.js";
import { getStorageItem, setStorageItem } from "../core/storage.js";
import { loadPalettes, findPaletteById, getContrastColor } from "./palette-service.js";

const toneKey = "toneMode";
const paletteKey = "selectedThemePalette";

function ensurePaletteControls() {
  if (qs("#paletteSelect") && qs("#paletteSearchInput") && qs("#applyPaletteBtn")) {
    return;
  }

  const toneButton = qs("#toneToggleBtn");
  const targetContainer = toneButton?.parentElement || qs(".navbar .d-flex");
  if (!targetContainer) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "dropdown";
  wrapper.innerHTML = `
    <button class="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Palette</button>
    <div class="dropdown-menu dropdown-menu-end p-3 palette-dropdown-menu">
      <label class="form-label small mb-1" for="paletteSearchInput">Search Palettes</label>
      <input id="paletteSearchInput" class="form-control form-control-sm mb-2" type="search" placeholder="Type to filter" />
      <label class="form-label small mb-1" for="paletteSelect">Palette</label>
      <select id="paletteSelect" class="form-select form-select-sm mb-2" size="8"></select>
      <div class="d-flex justify-content-between align-items-center">
        <button id="applyPaletteBtn" class="btn btn-primary btn-sm" type="button">Apply</button>
        <a id="paletteSourceLink" href="https://coolors.co/palettes/trending" target="_blank" rel="noopener">Source</a>
      </div>
    </div>`;

  targetContainer.prepend(wrapper);
}

function applyTone(mode) {
  const normalized = mode === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", normalized === "dark");
  setStorageItem(toneKey, normalized);

  const button = qs("#toneToggleBtn");
  if (button) {
    button.innerHTML = normalized === "dark"
      ? '<i class="fas fa-sun me-1"></i>Light'
      : '<i class="fas fa-moon me-1"></i>Dark';
  }
}

function applyPalette(palette) {
  if (!palette?.colors?.length) {
    return;
  }

  const primary = palette.colors[0];
  const secondary = palette.colors[1] || primary;
  const accent = palette.colors[2] || primary;
  const surface = palette.colors[3] || "#f8fafc";

  setRootVariable("--theme-primary", primary);
  setRootVariable("--theme-secondary", secondary);
  setRootVariable("--theme-accent", accent);
  setRootVariable("--theme-surface", surface);
  setRootVariable("--theme-text-on-primary", getContrastColor(primary));
  setStorageItem(paletteKey, palette.id);

  const source = qs("#paletteSourceLink");
  if (source) {
    source.href = palette.sourceUrl || "https://coolors.co/palettes/trending";
  }
}

function renderPaletteOptions(palettes, selectedId) {
  const select = qs("#paletteSelect");
  if (!select) {
    return;
  }

  select.innerHTML = "";
  palettes.forEach((palette) => {
    const option = document.createElement("option");
    option.value = palette.id;
    option.textContent = `${palette.name} (${palette.colors.join(" ")})`;
    option.selected = palette.id === selectedId;
    select.appendChild(option);
  });
}

export async function initializeThemeControls() {
  ensurePaletteControls();
  applyTone(getStorageItem(toneKey, "light"));
  qs("#toneToggleBtn")?.addEventListener("click", () => {
    const dark = document.body.classList.contains("theme-dark");
    applyTone(dark ? "light" : "dark");
  });

  const paletteSelect = qs("#paletteSelect");
  const paletteSearchInput = qs("#paletteSearchInput");
  const applyPaletteButton = qs("#applyPaletteBtn");

  if (!paletteSelect || !paletteSearchInput || !applyPaletteButton) {
    return;
  }

  const palettes = await loadPalettes();
  const savedPaletteId = getStorageItem(paletteKey, palettes[0]?.id);

  let filtered = [...palettes];
  renderPaletteOptions(filtered, savedPaletteId);
  applyPalette(findPaletteById(palettes, savedPaletteId) || palettes[0]);

  const updateFilter = (term) => {
    const value = term.trim().toLowerCase();
    filtered = !value
      ? [...palettes]
      : palettes.filter((palette) => `${palette.name} ${palette.id} ${palette.colors.join(" ")}`.toLowerCase().includes(value));

    renderPaletteOptions(filtered, paletteSelect.value);
    if (filtered.length > 0 && !filtered.some((palette) => palette.id === paletteSelect.value)) {
      paletteSelect.value = filtered[0].id;
    }
  };

  const applyCurrentSelection = () => {
    const selected = findPaletteById(palettes, paletteSelect.value);
    if (selected) {
      applyPalette(selected);
    }
  };

  paletteSearchInput.addEventListener("input", (event) => updateFilter(event.target.value));
  paletteSelect.addEventListener("change", applyCurrentSelection);
  paletteSelect.addEventListener("dblclick", applyCurrentSelection);
  applyPaletteButton.addEventListener("click", applyCurrentSelection);
}
