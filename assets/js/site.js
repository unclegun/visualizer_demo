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
import { initializeFocusPullHeroDemo } from "./patterns/focus-pull-hero.js";

async function initializeChartsIfPresent() {
  if (!document.querySelector("[data-chart-page]")) {
    return;
  }

  const configs = await loadChartConfigs();
  renderCharts(configs);
}

function normalizePageShell() {
  document.body.classList.add("site-shell");

  const path = window.location.pathname;
  if (path.endsWith("/index.html") || path === "/" || path.endsWith("/visualizer_demo/")) {
    document.body.classList.add("page-home");
  } else if (path.includes("/docs/")) {
    document.body.classList.add("page-doc");
  } else if (path.includes("css-visual-elements") || path.includes("llm-context-generator")) {
    document.body.classList.add("page-tool");
  } else if (path.includes("/patterns/")) {
    document.body.classList.add("page-pattern");
  }

  if (document.body.dataset.navSection === "advanced-ui") {
    document.body.classList.add("page-advanced");
  }

  const main = document.querySelector("main.page-shell, main.container-xl");
  if (main) {
    main.classList.add("site-main", "site-container");
    [...main.children].forEach((child) => {
      if (child.tagName === "SECTION") {
        child.classList.add("site-section");
      }
    });
  }

  const nav = document.querySelector(".site-navbar");
  if (nav) {
    nav.setAttribute("data-nav-rail", "");
  }

  if (!document.querySelector(".scroll-progress")) {
    const indicator = document.createElement("div");
    indicator.className = "scroll-progress";
    indicator.innerHTML = '<span data-scroll-progress></span>';
    document.body.prepend(indicator);
  }
}

function normalizePrimitiveClasses() {
  document.querySelectorAll(".site-hero").forEach((hero) => {
    hero.classList.add("page-hero");

    let eyebrow = hero.querySelector(".pattern-hero-kicker, .text-uppercase.small, .text-uppercase.small.fw-semibold");
    if (!eyebrow) {
      eyebrow = document.createElement("p");
      eyebrow.className = "pattern-hero-kicker mb-2 page-hero__eyebrow";
      if (document.body.classList.contains("page-doc")) {
        eyebrow.textContent = "Documentation";
      } else if (document.body.classList.contains("page-home")) {
        eyebrow.textContent = "Razor UI Patterns";
      } else if (document.body.classList.contains("page-tool")) {
        eyebrow.textContent = "Tooling Reference";
      } else {
        eyebrow.textContent = "Pattern Category";
      }
      hero.prepend(eyebrow);
    } else {
      eyebrow.classList.add("page-hero__eyebrow");
    }

    const title = hero.querySelector("h1, h2");
    title?.classList.add("page-hero__title");

    const lede = hero.querySelector(".lead, p.text-muted");
    lede?.classList.add("page-hero__lede");

    const actions = hero.querySelector(".d-flex");
    if (actions?.querySelector(".btn")) {
      actions.classList.add("page-hero__actions");
    }
  });

  document.querySelectorAll(".spike-toc").forEach((toc) => {
    toc.classList.add("page-toc", "is-sticky");
    const title = toc.querySelector("h2");
    title?.classList.add("page-toc__title");
    toc.querySelectorAll("a").forEach((link) => link.classList.add("page-toc__link"));
  });

  document.querySelectorAll(".badge-soft").forEach((badge) => {
    badge.classList.add("tag", "tag--primary");
  });

  document.querySelectorAll(".demo-shell").forEach((panel) => panel.classList.add("demo-panel"));
}

document.addEventListener("DOMContentLoaded", async () => {
  normalizePageShell();
  normalizePrimitiveClasses();
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
  initializeFocusPullHeroDemo();
});
