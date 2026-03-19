const paletteState = {
	all: [],
	filtered: []
};

const chartState = {
	all: {}
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
	try {
		console.log("Fetching palettes from ./data/palettes.json...");
		const response = await fetch("./data/palettes.json", { method: "GET" });
		
		if (!response.ok) {
			console.error("Failed to fetch palettes.json:", response.status, response.statusText);
			throw new Error("Failed to load palettes");
		}

		const palettes = await response.json();
		console.log("Palettes loaded:", palettes.length, "palettes found");
		
		if (!Array.isArray(palettes)) {
			throw new Error("Palette response format was invalid");
		}

		paletteState.all = palettes;
		paletteState.filtered = [...palettes];
		return palettes;
	} catch (error) {
		console.error("Error loading palettes:", error);
		throw error;
	}
}

async function loadCharts() {
	try {
		console.log("Loading chart data from ./data/charts.json...");
		const response = await fetch("./data/charts.json", { method: "GET" });
		
		if (!response.ok) {
			console.error("Failed to fetch charts.json:", response.status, response.statusText);
			return {};
		}

		const charts = await response.json();
		console.log("Chart data loaded successfully:", Object.keys(charts).length, "charts found");
		
		if (typeof charts !== "object") {
			console.warn("Charts response format was invalid");
			return {};
		}

		chartState.all = charts;
		
		// Render charts (with automatic retry if Chart.js not ready yet)
		console.log("Rendering charts...");
		renderAllCharts();
		
		return charts;
	} catch (error) {
		console.error("Failed to load charts:", error);
		return {};
	}
}

function renderAllCharts() {
	// Wait for Chart.js to be available
	if (typeof Chart === "undefined") {
		console.warn("Chart.js library not loaded yet, retrying in 1s...");
		setTimeout(renderAllCharts, 1000);
		return;
	}

	const chartIds = Object.keys(chartState.all);
	console.log("Rendering", chartIds.length, "charts...");
	
	chartIds.forEach((chartId) => {
		const chartConfig = chartState.all[chartId];
		const canvasId = `chart-${chartId}`;
		const canvas = document.getElementById(canvasId);
		
		if (canvas) {
			try {
				const ctx = canvas.getContext("2d");
				new Chart(ctx, {
					type: chartConfig.type,
					data: {
						labels: chartConfig.labels,
						datasets: chartConfig.datasets
					},
					options: {
						responsive: true,
						maintainAspectRatio: true,
						plugins: {
							legend: {
								display: true,
								position: "top"
							}
						}
					}
				});
				console.log("✓ Rendered chart:", chartId);
			} catch (error) {
				console.error(`✗ Failed to render chart ${chartId}:`, error);
			}
		} else {
			console.warn(`✗ Canvas element not found for chart: ${canvasId}`);
		}
	});
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
		console.warn("Palette picker elements not found");
		return;
	}

	try {
		console.log("Loading palettes from ./data/palettes.json...");
		await loadPalettes();
		console.log("Palettes loaded successfully:", paletteState.all.length, "palettes found");

		const savedId = localStorage.getItem(getPaletteStorageKey());
		const initialId = savedId && paletteState.all.some((p) => p.id === savedId)
			? savedId
			: paletteState.all[0]?.id;

		console.log("Rendering palette options with initial palette:", initialId);
		renderPaletteOptions(paletteState.filtered, initialId);

		const initialPalette = paletteState.all.find((p) => p.id === initialId);
		if (initialPalette) {
			console.log("Applying initial palette:", initialPalette.name);
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

		applyButton.addEventListener("click", () => {
			console.log("Apply button clicked");
			applySelectedPalette();
		});
		select.addEventListener("dblclick", applySelectedPalette);
		select.addEventListener("change", applySelectedPalette);
		
		console.log("Palette picker initialized successfully");
	} catch (error) {
		console.error("Palette picker initialization failed:", error);
		const sourceLink = document.getElementById("paletteSourceLink");
		if (sourceLink) {
			sourceLink.textContent = "Palette feed unavailable";
		}
	}
}

function showSection(sectionName, linkElement) {
	// Hide all sections
	const sections = document.querySelectorAll(".content-section");
	sections.forEach((section) => section.classList.add("d-none"));

	// Show selected section
	const targetSection = document.getElementById(`${sectionName}-section`);
	if (targetSection) {
		targetSection.classList.remove("d-none");
	}

	// Update active nav link
	if (linkElement) {
		const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
		navLinks.forEach((link) => link.classList.remove("active"));
		linkElement.classList.add("active");
	}
}

function filterCharts(type) {
	const cards = document.querySelectorAll(".draggable-card");
	cards.forEach((card) => {
		if (type === "all") {
			card.classList.remove("d-none");
		} else {
			const hasType = card.classList.contains(`chart-type-${type}`);
			card.classList.toggle("d-none", !hasType);
		}
	});
}

function navigateToFeature(featureId, linkElement) {
	showSection("documentation", document.querySelector('a[href="#documentation"]'));

	const target = document.getElementById(featureId);
	if (target) {
		target.scrollIntoView({ behavior: "smooth", block: "start" });
		target.classList.add("shadow");
		window.setTimeout(() => target.classList.remove("shadow"), 900);
	}

	return false;
}

function toggleGrid() {
	const container = document.getElementById("dashboardContainer");
	if (container) {
		container.classList.toggle("show-grid");
	}
}

function exportLayout() {
	const cards = Array.from(document.querySelectorAll(".draggable-card"));
	const layout = {
		timestamp: new Date().toISOString(),
		order: cards.map((card) => card.id)
	};

	const dataStr = JSON.stringify(layout, null, 2);
	const dataBlob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `dashboard-layout-${Date.now()}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

function resetLayout() {
	localStorage.removeItem("dashboardOrder");
	location.reload();
}

function initDashboard() {
	const resetBtn = document.getElementById("resetLayout");
	if (resetBtn) {
		resetBtn.addEventListener("click", resetLayout);
	}
}

function createChartCanvas(chartId, chartType, chartTitle) {
	const chartData = chartState.all[chartId];
	if (!chartData || typeof Chart === "undefined") {
		return `<p class="text-muted">Chart data not available</p>`;
	}

	const canvasHtml = `<canvas id="chart-${chartId}"></canvas>`;

	setTimeout(() => {
		const ctx = document.getElementById(`chart-${chartId}`);
		if (ctx && chartData) {
			new Chart(ctx, {
				type: chartData.type,
				data: {
					labels: chartData.labels,
					datasets: chartData.datasets
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					plugins: {
						legend: {
							display: true,
							position: "top"
						}
					}
				}
			});
		}
	}, 100);

	return canvasHtml;
}

function initializePatternDocsPage() {
	if (!document.body.classList.contains("pattern-docs-page")) {
		return;
	}

	initializePatternDocsNavigation();
	initializePatternDocsDemo();
}

function initializePatternDocsNavigation() {
	const navLinks = Array.from(document.querySelectorAll(".pattern-docs-page .navbar .nav-link[href^='#']"));
	if (navLinks.length === 0) {
		return;
	}

	const sections = navLinks
		.map((link) => document.querySelector(link.getAttribute("href")))
		.filter(Boolean);

	const setActiveLink = (activeId) => {
		navLinks.forEach((link) => {
			const targetId = link.getAttribute("href").replace("#", "");
			link.classList.toggle("active", targetId === activeId);
		});
	};

	navLinks.forEach((link) => {
		link.addEventListener("click", () => {
			const targetId = link.getAttribute("href").replace("#", "");
			setActiveLink(targetId);
		});
	});

	const observer = new IntersectionObserver((entries) => {
		const visibleSection = entries
			.filter((entry) => entry.isIntersecting)
			.sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

		if (visibleSection?.target?.id) {
			setActiveLink(visibleSection.target.id);
		}
	}, {
		rootMargin: "-30% 0px -55% 0px",
		threshold: [0.1, 0.3, 0.6]
	});

	sections.forEach((section) => observer.observe(section));
}

function initializePatternDocsDemo() {
	const table = document.getElementById("patternUsersTable");
	const modalElement = document.getElementById("patternDemoModal");
	const searchInput = document.getElementById("patternGlobalSearch");
	const pageSizeSelect = document.getElementById("patternPageSize");
	const summary = document.getElementById("patternDemoSummary");
	const saveButton = document.getElementById("patternDemoSaveButton");

	if (!table || !modalElement || !searchInput || !pageSizeSelect || !summary || !saveButton) {
		return;
	}

	const modal = typeof bootstrap !== "undefined"
		? bootstrap.Modal.getOrCreateInstance(modalElement)
		: null;
	const rows = Array.from(table.querySelectorAll("tbody tr"));
	const filters = Array.from(document.querySelectorAll(".pattern-filter"));
	const modalFields = {
		title: document.getElementById("patternDemoModalTitle"),
		username: document.getElementById("patternModalUsername"),
		email: document.getElementById("patternModalEmail"),
		role: document.getElementById("patternModalRole"),
		active: document.getElementById("patternModalActive"),
		created: document.getElementById("patternModalCreated")
	};

	function getRowValues(row) {
		return [
			row.dataset.username || "",
			row.dataset.email || "",
			row.dataset.role || "",
			row.dataset.active || "",
			row.dataset.created || ""
		];
	}

	function applyDemoFilters() {
		const globalTerm = searchInput.value.trim().toLowerCase();
		const pageSize = Number.parseInt(pageSizeSelect.value, 10) || 10;
		let visibleCount = 0;

		rows.forEach((row) => {
			const values = getRowValues(row);
			const matchesGlobal = !globalTerm || values.some((value) => value.toLowerCase().includes(globalTerm));
			const matchesColumns = filters.every((filter) => {
				const value = filter.value.trim().toLowerCase();
				if (!value) {
					return true;
				}

				const columnIndex = Number.parseInt(filter.dataset.column || "0", 10);
				return (values[columnIndex] || "").toLowerCase().includes(value);
			});

			const isVisible = matchesGlobal && matchesColumns;
			row.dataset.matches = isVisible ? "true" : "false";
			row.classList.toggle("d-none", !isVisible);
		});

		rows
			.filter((row) => row.dataset.matches === "true")
			.forEach((row, index) => {
				const withinPage = index < pageSize;
				row.classList.toggle("d-none", !withinPage);
				if (withinPage) {
					visibleCount += 1;
				}
			});

		const totalMatches = rows.filter((row) => row.dataset.matches === "true").length;
		const start = totalMatches === 0 ? 0 : 1;
		const end = visibleCount;
		summary.textContent = `Showing ${start} to ${end} of ${totalMatches} entries`;
	}

	rows.forEach((row) => {
		row.addEventListener("click", () => {
			modalFields.title.textContent = `Edit ${row.dataset.username}`;
			modalFields.username.value = row.dataset.username || "";
			modalFields.email.value = row.dataset.email || "";
			modalFields.role.value = row.dataset.role || "Admin";
			modalFields.active.value = row.dataset.active || "Yes";
			modalFields.created.value = row.dataset.created || "";
			modal?.show();
		});
	});

	searchInput.addEventListener("input", applyDemoFilters);
	pageSizeSelect.addEventListener("change", applyDemoFilters);
	filters.forEach((filter) => {
		const eventName = filter.tagName === "SELECT" ? "change" : "input";
		filter.addEventListener(eventName, applyDemoFilters);
	});

	saveButton.addEventListener("click", () => {
		saveButton.textContent = "Saved";
		saveButton.disabled = true;
		window.setTimeout(() => {
			saveButton.textContent = "Save changes";
			saveButton.disabled = false;
			modal?.hide();
		}, 650);
	});

	applyDemoFilters();
}

document.addEventListener("DOMContentLoaded", () => {
	console.log("Document loaded, initializing...");
	initializeToneToggle();
	initializePatternDocsPage();

	if (!document.body.classList.contains("pattern-docs-page")) {
		initializePalettePicker();
		initDashboard();
		loadCharts().catch((error) => console.error("Chart loading error:", error));
	}

	console.log("Initialization complete");
});
