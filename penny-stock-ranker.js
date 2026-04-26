/**
 * penny-stock-ranker.js – Market Signal Dashboard frontend
 *
 * Fetches data/market-signal-summary.json and renders:
 *   1. Best Move card
 *   2. Top Penny Stocks table (sortable, filterable, detail drawer)
 *   3. Top Prediction Markets table (sortable, filterable, detail drawer)
 *   4. Combined Signals panel
 *
 * No frameworks. Vanilla HTML/CSS/JS only.
 */

"use strict";

// ============================================================
// State
// ============================================================
const STATE = {
  data:              null,   // Parsed summary JSON
  stocks:            [],     // All penny stocks from JSON
  markets:           [],     // All prediction markets from JSON
  filteredStocks:    [],
  filteredMarkets:   [],
  stockSortKey:      "score",
  stockSortDir:      "desc",
  marketSortKey:     "score",
  marketSortDir:     "desc",
  openStockRow:      null,   // Ticker of open detail drawer
  openMarketRow:     null,   // marketId of open detail drawer
};

// ============================================================
// DOM refs
// ============================================================
let E = {};

// ============================================================
// Bootstrap
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  E = {
    // Header
    generatedAt:    document.getElementById("generated-at"),
    marketDate:     document.getElementById("market-date"),
    stalenessNote:  document.getElementById("staleness-note"),

    // Loading / error
    loadingPanel:   document.getElementById("loading-panel"),
    errorPanel:     document.getElementById("error-panel"),
    errorMsg:       document.getElementById("error-msg"),
    dashboardRoot:  document.getElementById("dashboard-root"),

    // Best move

    biasScore:      document.getElementById("bias-score"),
    biasText:       document.getElementById("bias-text"),
    bestAction:     document.getElementById("best-action"),
    bestSummary:    document.getElementById("best-summary"),
    biasReasonList: document.getElementById("bias-reason-list"),

    // Controls
    viewFilter:     document.getElementById("view-filter"),
    stockMinScore:  document.getElementById("stock-min-score"),
    confFilter:     document.getElementById("conf-filter"),
    stockSortBy:    document.getElementById("stock-sort-by"),
    marketSortBy:   document.getElementById("market-sort-by"),
    resetBtn:       document.getElementById("reset-btn"),

    // Penny stocks
    stockSection:   document.getElementById("stock-section"),
    stockCountBadge:document.getElementById("stock-count-badge"),
    stockTbody:     document.getElementById("stock-tbody"),

    // Prediction markets
    marketSection:  document.getElementById("market-section"),
    marketCountBadge:document.getElementById("market-count-badge"),
    marketTbody:    document.getElementById("market-tbody"),

    // Signals
    signalsGrid:    document.getElementById("signals-grid"),
  };

  // Wire controls
  E.viewFilter.addEventListener("change", applyFiltersAndRender);
  E.stockMinScore.addEventListener("input", applyFiltersAndRender);
  E.confFilter.addEventListener("change", applyFiltersAndRender);
  E.stockSortBy.addEventListener("change", (e) => {
    const [key, dir] = e.target.value.split("|");
    STATE.stockSortKey = key;
    STATE.stockSortDir = dir;
    renderStockTable();
  });
  E.marketSortBy.addEventListener("change", (e) => {
    const [key, dir] = e.target.value.split("|");
    STATE.marketSortKey = key;
    STATE.marketSortDir = dir;
    renderMarketTable();
  });
  E.resetBtn.addEventListener("click", resetFilters);

  // Column header sort (penny stocks)
  document.querySelectorAll("th[data-stock-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.stockSort;
      if (STATE.stockSortKey === key) {
        STATE.stockSortDir = STATE.stockSortDir === "desc" ? "asc" : "desc";
      } else {
        STATE.stockSortKey = key;
        STATE.stockSortDir = "desc";
      }
      renderStockTable();
    });
  });

  // Column header sort (markets)
  document.querySelectorAll("th[data-market-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.marketSort;
      if (STATE.marketSortKey === key) {
        STATE.marketSortDir = STATE.marketSortDir === "desc" ? "asc" : "desc";
      } else {
        STATE.marketSortKey = key;
        STATE.marketSortDir = "desc";
      }
      renderMarketTable();
    });
  });

  loadData();
});

// ============================================================
// Data loading
// ============================================================
async function loadData() {
  showLoading(true);
  try {
    const url = "data/market-signal-summary.json";
    const resp = await fetch(url + "?t=" + Date.now());
    if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
    const json = await resp.json();
    STATE.data = json;
    populateHeader(json);
    populateBestMove(json);
    STATE.stocks  = Array.isArray(json.topPennyStocks)      ? json.topPennyStocks      : [];
    STATE.markets = Array.isArray(json.topPredictionMarkets) ? json.topPredictionMarkets : [];
    applyFiltersAndRender();
    renderSignals(json.combinedSignals || []);
    showLoading(false);
  } catch (err) {
    console.error("Failed to load market signal data:", err);
    E.errorMsg.textContent = "Error: " + err.message;
    showError(true);
    showLoading(false);
  }
}

// ============================================================
// Header / meta
// ============================================================
function populateHeader(json) {
  const genAt = json.generatedAt ? new Date(json.generatedAt) : null;
  E.generatedAt.textContent = genAt ? formatDateTime(genAt) : "—";
  E.marketDate.textContent  = json.marketDate || "—";

  if (genAt) {
    const ageHours = (Date.now() - genAt.getTime()) / 3_600_000;
    if (ageHours > 30) {
      E.stalenessNote.textContent = "⚠ Data is more than 30 hours old";
      E.stalenessNote.style.display = "inline";
    }
  }
}

// ============================================================
// Best Move card
// ============================================================
function populateBestMove(json) {
  const bias = json.marketBias || {};
  const move = json.bestMove   || {};

  const label = bias.label || "—";
  const score = bias.score != null ? bias.score : "—";
  const biasClass = label === "Risk-On"  ? "bias-risk-on"
                  : label === "Risk-Off" ? "bias-risk-off"
                  : "bias-neutral";

  E.biasScore.textContent = score;
  E.biasText.textContent  = label;
  E.biasText.className = "bias-text " + biasClass;

  E.bestAction.textContent  = move.action  || "—";
  E.bestSummary.textContent = move.summary || "—";

  const reasons = Array.isArray(bias.reasoning) ? bias.reasoning : [];
  E.biasReasonList.innerHTML = reasons.map((r) => `<li>${esc(r)}</li>`).join("");
}

// ============================================================
// Filters
// ============================================================
function getFilters() {
  return {
    view:      E.viewFilter.value,     // "all" | "stocks" | "markets"
    minScore:  parseInt(E.stockMinScore.value, 10) || 0,
    conf:      E.confFilter.value,     // "all" | "Strong Candidate" | etc.
  };
}

function applyFiltersAndRender() {
  const f = getFilters();
  const view = f.view;

  // Penny stock section visibility
  E.stockSection.style.display  = (view === "markets")  ? "none" : "";
  // Prediction market section visibility
  E.marketSection.style.display = (view === "stocks")   ? "none" : "";

  // Filter stocks
  STATE.filteredStocks = STATE.stocks.filter((s) => {
    if ((s.score ?? 0) < f.minScore) return false;
    if (f.conf !== "all" && s.confidence !== f.conf) return false;
    return true;
  });
  E.stockCountBadge.textContent = STATE.filteredStocks.length;

  // Filter markets (min score applies here too)
  STATE.filteredMarkets = STATE.markets.filter((m) => {
    if ((m.score ?? 0) < f.minScore) return false;
    return true;
  });
  E.marketCountBadge.textContent = STATE.filteredMarkets.length;

  renderStockTable();
  renderMarketTable();
}

function resetFilters() {
  E.viewFilter.value    = "all";
  E.stockMinScore.value = "0";
  E.confFilter.value    = "all";
  E.stockSortBy.value   = "score|desc";
  E.marketSortBy.value  = "score|desc";
  STATE.stockSortKey    = "score";
  STATE.stockSortDir    = "desc";
  STATE.marketSortKey   = "score";
  STATE.marketSortDir   = "desc";
  applyFiltersAndRender();
}

// ============================================================
// Penny stock table
// ============================================================
function renderStockTable() {
  const list = sortList(STATE.filteredStocks, STATE.stockSortKey, STATE.stockSortDir);
  updateSortHeaders("data-stock-sort", STATE.stockSortKey, STATE.stockSortDir);

  E.stockTbody.innerHTML = "";

  if (list.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    tr.innerHTML = `<td colspan="13">No penny stocks match the current filters.</td>`;
    E.stockTbody.appendChild(tr);
    return;
  }

  list.forEach((s) => {
    const dataRow = buildStockRow(s);
    const drawerRow = buildStockDrawer(s);
    E.stockTbody.appendChild(dataRow);
    E.stockTbody.appendChild(drawerRow);

    dataRow.addEventListener("click", () => {
      const isOpen = drawerRow.classList.contains("open");
      // Close all open drawers
      E.stockTbody.querySelectorAll(".detail-drawer").forEach((d) => d.classList.remove("open"));
      if (!isOpen) drawerRow.classList.add("open");
    });
  });
}

function buildStockRow(s) {
  const tr = document.createElement("tr");

  const scoreClass = scoreCssClass(s.score);
  const confClass  = confCssClass(s.confidence);
  const chgSign    = s.percentChange >= 0 ? "+" : "";
  const chgClass   = s.percentChange >= 0 ? "up" : "down";

  tr.innerHTML = `
    <td><strong>${esc(s.rank ?? "—")}</strong></td>
    <td>
      <div class="cell-ticker">${esc(s.ticker)}</div>
      <div class="cell-company">${esc(s.companyName || "—")}</div>
    </td>
    <td><span class="score-badge ${scoreClass}">${s.score ?? "—"}</span></td>
    <td><span class="conf-badge ${confClass}">${esc(s.confidence ?? "—")}</span></td>
    <td>$${fmt(s.latestPrice, 4)}</td>
    <td class="${chgClass}">${chgSign}${fmt(s.percentChange, 2)}%</td>
    <td>${fmt(s.relativeVolume, 2) !== "—" ? fmt(s.relativeVolume, 2) + "×" : "—"}</td>
    <td>${fmt(s.rsi, 1)}</td>
    <td class="zone-entry">${fmtZone(s.entryZone)}</td>
    <td class="zone-stop">$${fmt(s.stopLoss, 4)}</td>
    <td class="zone-target">$${fmt(s.target, 4)}</td>
    <td>${esc(s.suggestedAction ?? "—")}</td>
    <td>${fmt(s.fiveDayChange, 1) !== "—" ? fmt(s.fiveDayChange, 1) + "%" : "—"}</td>
  `;
  return tr;
}

function buildStockDrawer(s) {
  const tr = document.createElement("tr");
  tr.className = "detail-drawer";
  const justification = Array.isArray(s.justification) ? s.justification : [];
  const warnings      = Array.isArray(s.warnings)      ? s.warnings      : [];

  tr.innerHTML = `
    <td colspan="13">
      <div class="detail-inner">
        <div class="detail-block">
          <h4>Justification</h4>
          <ul class="detail-list justification">
            ${justification.map((j) => `<li>${esc(j)}</li>`).join("") || "<li>None</li>"}
          </ul>
        </div>
        <div class="detail-block">
          <h4>Warnings</h4>
          <ul class="detail-list warnings">
            ${warnings.map((w) => `<li>${esc(w)}</li>`).join("") || "<li>None</li>"}
          </ul>
        </div>
        <div class="detail-block">
          <h4>Additional metrics</h4>
          <ul class="detail-list justification">
            <li>SMA5: $${fmt(s.sma5, 4)}</li>
            <li>SMA20: $${fmt(s.sma20, 4)}</li>
            <li>5-day change: ${fmt(s.fiveDayChange, 2)}%</li>
            <li>20-day change: ${fmt(s.twentyDayChange, 2)}%</li>
            <li>Volatility (ann.): ${s.volatility != null ? (s.volatility * 100).toFixed(1) + "%" : "—"}</li>
            <li>Avg volume: ${fmtVol(s.averageVolume)}</li>
            <li>Volume: ${fmtVol(s.volume)}</li>
          </ul>
        </div>
        <div class="detail-block">
          <h4>Trade levels</h4>
          <ul class="detail-list justification">
            <li>Entry zone: ${fmtZone(s.entryZone)}</li>
            <li>Stop loss: $${fmt(s.stopLoss, 4)}</li>
            <li>Target: $${fmt(s.target, 4)}</li>
            <li>Risk level: ${esc(s.riskLevel ?? "Unknown")}</li>
            <li>Market date: ${esc(s.marketDate ?? "—")}</li>
          </ul>
        </div>
      </div>
    </td>
  `;
  return tr;
}

// ============================================================
// Prediction market table
// ============================================================
function renderMarketTable() {
  const list = sortList(STATE.filteredMarkets, STATE.marketSortKey, STATE.marketSortDir);
  updateSortHeaders("data-market-sort", STATE.marketSortKey, STATE.marketSortDir);

  E.marketTbody.innerHTML = "";

  if (list.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    tr.innerHTML = `<td colspan="9">No prediction markets match the current filters.</td>`;
    E.marketTbody.appendChild(tr);
    return;
  }

  list.forEach((m) => {
    const dataRow   = buildMarketRow(m);
    const drawerRow = buildMarketDrawer(m);
    E.marketTbody.appendChild(dataRow);
    E.marketTbody.appendChild(drawerRow);

    dataRow.addEventListener("click", () => {
      const isOpen = drawerRow.classList.contains("open");
      E.marketTbody.querySelectorAll(".detail-drawer").forEach((d) => d.classList.remove("open"));
      if (!isOpen) drawerRow.classList.add("open");
    });
  });
}

function buildMarketRow(m) {
  const tr = document.createElement("tr");
  const scoreClass = scoreCssClass(m.score);
  const prob = m.probability != null ? (m.probability * 100).toFixed(1) + "%" : "—";
  const probChg = m.probabilityChange;
  let probChgStr = "—";
  let probChgClass = "prob-change-flat";
  if (probChg != null) {
    probChgStr  = (probChg >= 0 ? "+" : "") + (probChg * 100).toFixed(1) + "%";
    probChgClass = probChg > 0.001 ? "prob-change-up" : probChg < -0.001 ? "prob-change-down" : "prob-change-flat";
  }

  const platform = m.platform || "Unknown";
  const platClass = platform.toLowerCase() === "kalshi"     ? "platform-kalshi"
                  : platform.toLowerCase() === "polymarket" ? "platform-polymarket"
                  : "platform-unknown";

  tr.innerHTML = `
    <td><strong>${esc(m.rank ?? "—")}</strong></td>
    <td><span class="platform-badge ${platClass}">${esc(platform)}</span></td>
    <td style="white-space:normal;max-width:280px">${esc(m.marketTitle ?? "—")}</td>
    <td>${esc(m.side ?? "YES")}</td>
    <td class="prob-chip">${prob} <span class="${probChgClass}">${probChgStr}</span></td>
    <td>${fmtVol(m.liquidity)}</td>
    <td>${fmtVol(m.volume)}</td>
    <td><span class="score-badge ${scoreClass}">${m.score ?? "—"}</span></td>
    <td style="white-space:normal;max-width:200px">${esc(m.suggestedAction ?? "—")}</td>
  `;
  return tr;
}

function buildMarketDrawer(m) {
  const tr = document.createElement("tr");
  tr.className = "detail-drawer";
  const justification = Array.isArray(m.justification) ? m.justification : [];

  tr.innerHTML = `
    <td colspan="9">
      <div class="detail-inner">
        <div class="detail-block">
          <h4>Justification</h4>
          <ul class="detail-list justification">
            ${justification.map((j) => `<li>${esc(j)}</li>`).join("") || "<li>None</li>"}
          </ul>
        </div>
        <div class="detail-block">
          <h4>Market details</h4>
          <ul class="detail-list justification">
            <li>Platform: ${esc(m.platform ?? "—")}</li>
            <li>Market ID: ${esc(m.marketId ?? "—")}</li>
            <li>Side: ${esc(m.side ?? "YES")}</li>
            <li>Probability: ${m.probability != null ? (m.probability * 100).toFixed(2) + "%" : "—"}</li>
            <li>Prev probability: ${m.previousProbability != null ? (m.previousProbability * 100).toFixed(2) + "%" : "N/A"}</li>
            <li>Volume: ${fmtVol(m.volume)}</li>
            <li>Liquidity: ${fmtVol(m.liquidity)}</li>
          </ul>
        </div>
      </div>
    </td>
  `;
  return tr;
}

// ============================================================
// Combined signals
// ============================================================
function renderSignals(signals) {
  if (!E.signalsGrid) return;
  E.signalsGrid.innerHTML = "";

  if (!signals.length) {
    E.signalsGrid.innerHTML = `<p style="color:var(--text-muted)">No signal data available.</p>`;
    return;
  }

  signals.forEach((sig) => {
    const score = sig.score ?? 0;
    const card = document.createElement("div");
    card.className = "signal-card";
    card.innerHTML = `
      <div class="sig-label">${esc(sig.label ?? "Signal")}</div>
      <div class="sig-score">${score}</div>
      <div class="signal-bar-track">
        <div class="signal-bar-fill" style="width:${clamp(score, 0, 100)}%"></div>
      </div>
      <div class="sig-interp">${esc(sig.interpretation ?? "")}</div>
    `;
    E.signalsGrid.appendChild(card);
  });
}

// ============================================================
// Sorting helpers
// ============================================================
function sortList(list, key, dir) {
  return [...list].sort((a, b) => {
    let va = a[key] ?? (dir === "desc" ? -Infinity : Infinity);
    let vb = b[key] ?? (dir === "desc" ? -Infinity : Infinity);
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function updateSortHeaders(dataAttr, activeKey, activeDir) {
  document.querySelectorAll(`th[${dataAttr}]`).forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset[dataAttr.replace("data-", "").replace(/-(\w)/g, (_, c) => c.toUpperCase())] === activeKey) {
      th.classList.add(activeDir === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

// ============================================================
// UI state
// ============================================================
function showLoading(on) {
  E.loadingPanel.style.display  = on    ? "block" : "none";
  E.dashboardRoot.style.display = on    ? "none"  : "block";
}
function showError(on) {
  E.errorPanel.style.display    = on    ? "block" : "none";
  E.dashboardRoot.style.display = on    ? "none"  : "block";
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

function fmtZone(zone) {
  if (!zone || zone.low == null) return "—";
  return `$${fmt(zone.low, 4)} – $${fmt(zone.high, 4)}`;
}

function formatDateTime(d) {
  try {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d.toISOString();
  }
}

function scoreCssClass(score) {
  if (score == null) return "score-low";
  if (score >= 60) return "score-high";
  if (score >= 40) return "score-mid";
  return "score-low";
}

function confCssClass(conf) {
  if (!conf) return "conf-none";
  const c = conf.toLowerCase();
  if (c.includes("strong"))   return "conf-strong";
  if (c.includes("moderate")) return "conf-moderate";
  if (c.includes("weak"))     return "conf-weak";
  return "conf-none";
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
