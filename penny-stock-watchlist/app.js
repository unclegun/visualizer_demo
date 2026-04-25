/**
 * app.js – Penny-Stock Watchlist frontend
 *
 * Fetches data/recommendations.json and renders a filterable,
 * sortable dashboard of penny-stock candidates.
 *
 * No frameworks. Vanilla HTML/CSS/JS only.
 */

"use strict";

// ============================================================
// State
// ============================================================
const state = {
  all: [],       // All recommendations from JSON
  filtered: [],  // After filters applied
};

// ============================================================
// DOM refs (populated on DOMContentLoaded)
// ============================================================
let els = {};

// ============================================================
// Data fetching
// ============================================================
async function loadData() {
  showState("loading");
  try {
    const resp = await fetch("data/recommendations.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // Populate meta
    els.generatedAt.textContent = json.generatedAt
      ? formatDateTime(json.generatedAt)
      : "—";
    els.marketDate.textContent = json.marketDate || "—";
    if (json.disclaimer) {
      els.disclaimerText.textContent = json.disclaimer;
    }

    state.all = Array.isArray(json.recommendations) ? json.recommendations : [];

    if (state.all.length === 0) {
      renderStats([]);
      showState("empty");
      return;
    }

    applyFiltersAndRender();
    showState("grid");
  } catch (err) {
    console.error("Failed to load recommendations:", err);
    els.errorMsg.textContent = `Error: ${err.message}`;
    showState("error");
  }
}

// ============================================================
// Filtering & Sorting
// ============================================================
function getFilters() {
  return {
    search:   (els.searchInput.value || "").trim().toUpperCase(),
    minScore: parseInt(els.minScore.value, 10) || 0,
    maxRisk:  els.maxRisk.value,
    sortBy:   els.sortBy.value,
    sortDir:  els.sortDir.value,
  };
}

const RISK_ORDER = {
  "Lower":     1,
  "Moderate":  2,
  "High":      3,
  "Very High": 4,
  "Unknown":   5,
};

function applyFiltersAndRender() {
  const f = getFilters();

  let list = state.all.filter((rec) => {
    if (f.search && !rec.ticker.includes(f.search)) return false;
    if (rec.score < f.minScore) return false;
    if (f.maxRisk !== "all") {
      const recRiskOrder = RISK_ORDER[rec.riskLevel] ?? 5;
      const maxRiskOrder = RISK_ORDER[f.maxRisk] ?? 5;
      if (recRiskOrder > maxRiskOrder) return false;
    }
    return true;
  });

  // Sort
  list.sort((a, b) => {
    let va = a[f.sortBy] ?? -Infinity;
    let vb = b[f.sortBy] ?? -Infinity;
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return f.sortDir === "asc" ? -1 : 1;
    if (va > vb) return f.sortDir === "asc" ? 1 : -1;
    return 0;
  });

  state.filtered = list;
  renderStats(list);
  renderCards(list);

  els.visibleCount.textContent = list.length;

  if (list.length === 0 && state.all.length > 0) {
    showState("empty");
  } else if (list.length > 0) {
    showState("grid");
  }
}

// ============================================================
// Stats row
// ============================================================
function renderStats(list) {
  if (!els.statsRow) return;

  if (!list.length) {
    els.statsRow.style.display = "none";
    return;
  }
  els.statsRow.style.display = "flex";

  els.statTotal.textContent   = state.all.length;
  els.statShowing.textContent = list.length;

  const avgScore = list.reduce((s, r) => s + (r.score ?? 0), 0) / list.length;
  els.statAvgScore.textContent = avgScore.toFixed(1);

  const topRec = list[0];
  els.statTopScore.textContent  = topRec ? (topRec.score ?? "—") : "—";
  els.statTopTicker.textContent = topRec ? topRec.ticker : "—";

  const rvols = list.map((r) => r.relativeVolume).filter((v) => v != null);
  const avgRvol = rvols.length
    ? rvols.reduce((s, v) => s + v, 0) / rvols.length
    : null;
  els.statAvgRvol.textContent = avgRvol != null ? avgRvol.toFixed(2) + "×" : "—";
}

// ============================================================
// Card rendering
// ============================================================
function renderCards(list) {
  const grid = els.grid;
  grid.innerHTML = "";

  list.forEach((rec) => {
    grid.appendChild(buildCard(rec));
  });
}

function buildCard(rec) {
  const card = document.createElement("article");
  card.className = "rec-card";

  const scoreClass = rec.score >= 60 ? "score-high" : rec.score >= 40 ? "score-mid" : "score-low";
  const changeSign  = rec.percentChange >= 0 ? "+" : "";
  const changeClass = rec.percentChange >= 0 ? "up" : "down";
  const riskClass   = riskCssClass(rec.riskLevel);

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-rank">#${rec.rank ?? "—"}</div>
        <div class="card-ticker">${esc(rec.ticker)}</div>
      </div>
      <div class="card-score-badge">
        <span class="score-num ${scoreClass}">${rec.score ?? "—"}</span>
        <span class="score-lbl">Score</span>
      </div>
    </div>

    <div class="card-body">
      <div class="card-price-row">
        <span class="price-value">$${fmt(rec.price, 4)}</span>
        <span class="price-change ${changeClass}">${changeSign}${fmt(rec.percentChange, 2)}%</span>
      </div>

      <div class="card-metrics">
        <div class="metric">
          <span class="metric-label">Volume</span>
          <span class="metric-value">${fmtVol(rec.volume)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Volume</span>
          <span class="metric-value">${fmtVol(rec.averageVolume)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Rel. Volume</span>
          <span class="metric-value">${rec.relativeVolume != null ? rec.relativeVolume.toFixed(2) + "×" : "—"}</span>
        </div>
        <div class="metric">
          <span class="metric-label">RSI (14)</span>
          <span class="metric-value">${rec.rsi != null ? rec.rsi.toFixed(1) : "—"}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Volatility</span>
          <span class="metric-value">${rec.volatility != null ? (rec.volatility * 100).toFixed(1) + "%" : "—"}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Market Date</span>
          <span class="metric-value">${esc(rec.marketDate ?? "—")}</span>
        </div>
      </div>

      <div class="card-zone">
        <div class="zone-item entry">
          <div class="zone-lbl">Entry Zone</div>
          <div class="zone-val">${esc(rec.entryZone ?? "—")}</div>
        </div>
        <div class="zone-item stop">
          <div class="zone-lbl">Stop Loss</div>
          <div class="zone-val">$${fmt(rec.stopLoss, 2)}</div>
        </div>
        <div class="zone-item target">
          <div class="zone-lbl">Target</div>
          <div class="zone-val">$${fmt(rec.target, 2)}</div>
        </div>
      </div>

      <span class="risk-badge ${riskClass}">${esc(rec.riskLevel ?? "Unknown")} Risk</span>

      ${buildScoreBars(rec)}

      ${buildCollapsible("Reasons", "✅", buildList(rec.reasons, "reasons-list"))}
      ${buildCollapsible("Warnings", "⚠️", buildList(rec.warnings, "warnings-list"))}
    </div>
  `;

  // Collapsible toggle
  card.querySelectorAll(".card-section-title").forEach((title) => {
    title.addEventListener("click", () => {
      const body = title.nextElementSibling;
      const isOpen = title.classList.toggle("open");
      body.style.display = isOpen ? "block" : "none";
    });
    // Start collapsed
    title.nextElementSibling.style.display = "none";
  });

  return card;
}

function buildScoreBars(rec) {
  const bars = [
    { label: "Momentum", key: "momentumScore", max: 30 },
    { label: "Liquidity", key: "liquidityScore", max: 30 },
    { label: "Risk",      key: "riskScore",     max: 30 },
  ];
  const rows = bars.map(({ label, key, max }) => {
    const val = rec[key] ?? 0;
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    return `
      <div class="score-bar-row">
        <span class="score-bar-label">${label}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${pct}%"></div></div>
        <span class="score-bar-val">${val}</span>
      </div>
    `;
  }).join("");
  return `<div class="score-bars">${rows}</div>`;
}

function buildCollapsible(title, icon, content) {
  return `
    <div class="card-section">
      <div class="card-section-title">
        <span class="chevron">▶</span> ${icon} ${title}
      </div>
      <div class="card-section-body">${content}</div>
    </div>
  `;
}

function buildList(items, cls) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<ul class="${cls}"><li>None</li></ul>`;
  }
  const lis = items.map((item) => `<li>${esc(item)}</li>`).join("");
  return `<ul class="${cls}">${lis}</ul>`;
}

// ============================================================
// UI state machine
// ============================================================
function showState(state) {
  els.loadingState.style.display = state === "loading" ? "block" : "none";
  els.errorState.style.display   = state === "error"   ? "block" : "none";
  els.emptyState.style.display   = state === "empty"   ? "block" : "none";
  els.grid.style.display         = state === "grid"    ? "grid"  : "none";
}

// ============================================================
// Utilities
// ============================================================
function esc(str) {
  if (str == null) return "—";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(val, decimals) {
  if (val == null || isNaN(val)) return "—";
  return Number(val).toFixed(decimals);
}

function fmtVol(val) {
  if (val == null) return "—";
  const n = Number(val);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function riskCssClass(level) {
  const map = {
    "Very High": "risk-very-high",
    "High":      "risk-high",
    "Moderate":  "risk-moderate",
    "Lower":     "risk-lower",
  };
  return map[level] ?? "risk-unknown";
}

function resetFilters() {
  els.searchInput.value = "";
  els.minScore.value    = "0";
  els.maxRisk.value     = "all";
  els.sortBy.value      = "score";
  els.sortDir.value     = "desc";
  applyFiltersAndRender();
}

// ============================================================
// Boot
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  els = {
    generatedAt:    document.getElementById("generated-at"),
    marketDate:     document.getElementById("market-date"),
    disclaimerText: document.getElementById("disclaimer-text"),
    searchInput:    document.getElementById("search-input"),
    minScore:       document.getElementById("min-score"),
    maxRisk:        document.getElementById("max-risk"),
    sortBy:         document.getElementById("sort-by"),
    sortDir:        document.getElementById("sort-dir"),
    resetBtn:       document.getElementById("reset-btn"),
    resetBtn2:      document.getElementById("reset-btn-2"),
    statsRow:       document.getElementById("stats-row"),
    statTotal:      document.getElementById("stat-total"),
    statShowing:    document.getElementById("stat-showing"),
    statAvgScore:   document.getElementById("stat-avg-score"),
    statTopScore:   document.getElementById("stat-top-score"),
    statTopTicker:  document.getElementById("stat-top-ticker"),
    statAvgRvol:    document.getElementById("stat-avg-rvol"),
    visibleCount:   document.getElementById("visible-count"),
    grid:           document.getElementById("recommendations-grid"),
    loadingState:   document.getElementById("loading-state"),
    errorState:     document.getElementById("error-state"),
    errorMsg:       document.getElementById("error-msg"),
    emptyState:     document.getElementById("empty-state"),
  };

  // Wire up controls
  ["searchInput", "minScore", "maxRisk", "sortBy", "sortDir"].forEach((key) => {
    els[key].addEventListener("input", applyFiltersAndRender);
    els[key].addEventListener("change", applyFiltersAndRender);
  });

  els.resetBtn.addEventListener("click", resetFilters);
  if (els.resetBtn2) els.resetBtn2.addEventListener("click", resetFilters);

  // Load data
  loadData();
});
