import { initializeNavigation } from "./core/navigation.js";
import { initializeScrollProgress, initializeStickyNavbarState } from "./core/scroll-effects.js";
import { initializeThemeControls } from "./theme/theme-controller.js";
import { loadChartConfigs } from "./charts/chart-loader.js";
import { renderCharts } from "./charts/chart-renderer.js";
import { initializeRevealSystem } from "./components/reveal.js";
import { initializeSpotlightCards } from "./components/spotlight-cards.js";
import { initializeCounters } from "./components/counters.js";
import { initializeClipboardActions } from "./components/clipboard.js";
import { initializeProgressFills } from "./components/progress.js";
import { initializeFloatingToolbar } from "./components/floating-toolbar.js";
import { initializeDataTableModalDemo } from "./patterns/datatable-modal-demo.js";
import { initializeHtmxPartialsDemo } from "./patterns/htmx-partials-demo.js";
import { initializeHtmxModalDemo } from "./patterns/htmx-modal-demo.js";
import { initializeHtmxCascadingDemo } from "./patterns/htmx-cascading-demo.js";
import { initializeHtmxTableRefreshDemo } from "./patterns/htmx-table-refresh-demo.js";
import { initializeAdvancedHeadersDemo } from "./patterns/advanced-headers.js";
import { initializePremiumCardsDemo } from "./patterns/premium-cards.js";
import { initializeMicrointeractionsDemo } from "./patterns/microinteractions.js";
import { initializeDataDisplayDemo } from "./patterns/data-display.js";
import { initializeFormsFiltersDemo } from "./patterns/forms-filters.js";
import { initializeDashboardMotionDemo } from "./patterns/dashboard-motion.js";

async function initializeChartsIfPresent() {
  if (!document.querySelector("[data-chart-page]")) {
    return;
  }

  const configs = await loadChartConfigs();
  renderCharts(configs);
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeNavigation();
  initializeStickyNavbarState();
  initializeScrollProgress();
  await initializeThemeControls();
  initializeRevealSystem();
  initializeSpotlightCards();
  initializeCounters();
  initializeClipboardActions();
  initializeProgressFills();
  initializeFloatingToolbar();
  await initializeChartsIfPresent();
  initializeDataTableModalDemo();
  initializeHtmxPartialsDemo();
  initializeHtmxModalDemo();
  initializeHtmxCascadingDemo();
  initializeHtmxTableRefreshDemo();
  initializeAdvancedHeadersDemo();
  initializePremiumCardsDemo();
  initializeMicrointeractionsDemo();
  initializeDataDisplayDemo();
  initializeFormsFiltersDemo();
  initializeDashboardMotionDemo();
});
