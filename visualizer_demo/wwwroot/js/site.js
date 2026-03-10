const paletteState = {
	all: [],
	filtered: []
};

function getToneStorageKey() {
	return "toneMode";
}

function getPaletteStorageKey() {
	return "selectedThemePalette";
}

function setRootVariable(name, value) {
	document.documentElement.style.setProperty(name, value);
}

function getContrastColor(hexColor) {
	const color = hexColor.replace("#", "");
	const red = parseInt(color.substring(0, 2), 16);
	const green = parseInt(color.substring(2, 4), 16);
	const blue = parseInt(color.substring(4, 6), 16);
	const luma = (0.299 * red) + (0.587 * green) + (0.114 * blue);
	return luma >= 150 ? "#1f2937" : "#ffffff";
}

function applyPalette(palette) {
	if (!palette || !Array.isArray(palette.colors) || palette.colors.length < 4) {
		return;
	}

	const primary = palette.colors[0];
	const secondary = palette.colors[1] ?? palette.colors[0];
	const accent = palette.colors[2] ?? palette.colors[0];
	const surface = palette.colors[3] ?? "#f8f9fa";

	setRootVariable("--theme-primary", primary);
	setRootVariable("--theme-secondary", secondary);
	setRootVariable("--theme-accent", accent);
	setRootVariable("--theme-surface", surface);
	setRootVariable("--theme-text-on-primary", getContrastColor(primary));

	localStorage.setItem(getPaletteStorageKey(), palette.id);

	const sourceLink = document.getElementById("paletteSourceLink");
	if (sourceLink) {
		sourceLink.href = palette.sourceUrl || "https://coolors.co/palettes/trending";
	}
}

function applyTone(mode) {
	const normalized = mode === "dark" ? "dark" : "light";
	document.body.classList.toggle("theme-dark", normalized === "dark");
	localStorage.setItem(getToneStorageKey(), normalized);

	const toggleButton = document.getElementById("toneToggleBtn");
	if (toggleButton) {
		toggleButton.innerHTML = normalized === "dark"
			? '<i class="fas fa-sun me-1"></i>Light'
			: '<i class="fas fa-moon me-1"></i>Dark';
	}
}

function initializeToneToggle() {
	const toggleButton = document.getElementById("toneToggleBtn");
	const savedTone = localStorage.getItem(getToneStorageKey()) || "light";
	applyTone(savedTone);

	if (!toggleButton) {
		return;
	}

	toggleButton.addEventListener("click", () => {
		const isDark = document.body.classList.contains("theme-dark");
		applyTone(isDark ? "light" : "dark");
	});
}

function renderPaletteOptions(palettes, selectedId) {
	const select = document.getElementById("paletteSelect");
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

function filterPalettes(searchText) {
	const value = (searchText || "").trim().toLowerCase();
	if (!value) {
		paletteState.filtered = [...paletteState.all];
		return;
	}

	paletteState.filtered = paletteState.all.filter((palette) => {
		const haystack = `${palette.name} ${palette.id} ${palette.colors.join(" ")}`.toLowerCase();
		return haystack.includes(value);
	});
}

async function loadPalettes() {
	const response = await fetch("/Sandbox/Palettes", { method: "GET" });
	if (!response.ok) {
		throw new Error("Failed to load palettes");
	}

	const palettes = await response.json();
	if (!Array.isArray(palettes)) {
		throw new Error("Palette response format was invalid");
	}

	paletteState.all = palettes;
	paletteState.filtered = [...palettes];
	return palettes;
}

function applySelectedPalette() {
	const select = document.getElementById("paletteSelect");
	if (!select) {
		return;
	}

	const selected = paletteState.all.find((p) => p.id === select.value);
	if (selected) {
		applyPalette(selected);
	}
}

async function initializePalettePicker() {
	const select = document.getElementById("paletteSelect");
	const search = document.getElementById("paletteSearchInput");
	const applyButton = document.getElementById("applyPaletteBtn");

	if (!select || !search || !applyButton) {
		return;
	}

	try {
		await loadPalettes();

		const savedId = localStorage.getItem(getPaletteStorageKey());
		const initialId = savedId && paletteState.all.some((p) => p.id === savedId)
			? savedId
			: paletteState.all[0]?.id;

		renderPaletteOptions(paletteState.filtered, initialId);

		const initialPalette = paletteState.all.find((p) => p.id === initialId);
		if (initialPalette) {
			applyPalette(initialPalette);
		}

		search.addEventListener("input", (event) => {
			filterPalettes(event.target.value);
			const selectedId = select.value;
			renderPaletteOptions(paletteState.filtered, selectedId);
			if (select.options.length > 0 && !Array.from(select.options).some((o) => o.value === selectedId)) {
				select.selectedIndex = 0;
			}
		});

		applyButton.addEventListener("click", applySelectedPalette);
		select.addEventListener("dblclick", applySelectedPalette);
		select.addEventListener("change", applySelectedPalette);
	} catch (error) {
		const sourceLink = document.getElementById("paletteSourceLink");
		if (sourceLink) {
			sourceLink.textContent = "Palette feed unavailable";
		}
	}
}

document.addEventListener("DOMContentLoaded", initializePalettePicker);
document.addEventListener("DOMContentLoaded", initializeToneToggle);
