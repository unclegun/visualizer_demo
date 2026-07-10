/**
 * FocusPullHero — camera rack-focus hero background effect
 *
 * Renders a background image in multiple CSS layers and crossfades
 * between masked "focus regions", simulating a camera shifting depth
 * of field from one area of the image to another.
 *
 * Named exports for copy-paste reuse:
 *   focusMarks          — default focus region definitions
 *   setFocusRegion()    — apply a mask to a focus layer element
 *   animateFocusPull()  — start the animation loop
 *   pauseFocusMotion()  — pause/resume the active demo instance
 *   initializeFocusPullHeroDemo() — wired into site.js
 */

import { prefersReducedMotion } from "../core/motion.js";

// ── Timings ────────────────────────────────────────────────────────
const HOLD_MS = 3200;       // Time each focus region is held
const TRANSITION_MS = 1800; // Crossfade duration (must match CSS transition)
const LABEL_FADE_MS = 280;  // Label text crossfade speed

// ── Default focus marks ────────────────────────────────────────────
/**
 * Each mark defines a focus region over the background image.
 *   x, y  — center of the elliptical focus mask (% of hero element)
 *   w, h  — horizontal and vertical radii of the mask ellipse
 *   label — human-readable name for debug / UI display
 */
export const focusMarks = [
  { id: "alpha", x: "22%", y: "44%", w: "44%", h: "54%", label: "\u03b1-Helix Cluster" },
  { id: "beta",  x: "62%", y: "30%", w: "40%", h: "50%", label: "\u03b2-Sheet Network" },
  { id: "gamma", x: "76%", y: "58%", w: "38%", h: "48%", label: "\u03b3-Node Junction" },
  { id: "delta", x: "44%", y: "58%", w: "36%", h: "46%", label: "\u03b4-Bridge Cluster" },
];

// ── Utility: build a mask-image gradient for a focus mark ─────────
function buildMaskGradient(mark) {
  return (
    `radial-gradient(ellipse ${mark.w} ${mark.h} at ${mark.x} ${mark.y}, ` +
    `black 42%, rgba(0,0,0,0.32) 70%, transparent 100%)`
  );
}

/**
 * Apply a focus mark mask to a layer element.
 * @param {HTMLElement} layerEl  - A .fph-focus-a or .fph-focus-b element
 * @param {object}      mark     - A focus mark from focusMarks
 */
export function setFocusRegion(layerEl, mark) {
  const gradient = buildMaskGradient(mark);
  layerEl.style.maskImage = gradient;
  layerEl.style.webkitMaskImage = gradient;
}

// ── FocusPullHero class ────────────────────────────────────────────
class FocusPullHero {
  constructor(container, marks) {
    this._container = container;
    this._marks = marks || focusMarks;
    this._layerA = container.querySelector("[data-fph-layer-a]");
    this._layerB = container.querySelector("[data-fph-layer-b]");
    this._labelEl = container.querySelector("[data-fph-active-label]");
    this._debugLabels = container.querySelector("[data-fph-debug-labels]");

    this._markIndex = 0;
    this._activeSlot = "a"; // 'a' or 'b' — which layer is currently visible
    this._paused = false;
    this._holdTimer = null;
    this._transitionTimer = null;
    this._destroyed = false;

    this._reduced = prefersReducedMotion();
  }

  get isPaused() {
    return this._paused;
  }

  /** Start the animation loop. */
  init() {
    if (!this._layerA || !this._layerB) return;

    // Wire up pause button(s)
    this._container.querySelectorAll("[data-fph-pause]").forEach((btn) => {
      btn.addEventListener("click", () => this.togglePause(btn));
    });

    // Wire up debug button(s)
    this._container.querySelectorAll("[data-fph-debug]").forEach((btn) => {
      btn.addEventListener("click", () => this.toggleDebug(btn));
    });

    // Set initial state: layer A visible at mark[0], layer B at mark[1]
    const first = this._marks[0];
    const second = this._marks[1] || this._marks[0];

    setFocusRegion(this._layerA, first);
    setFocusRegion(this._layerB, second);

    this._layerA.style.opacity = "1";
    this._layerB.style.opacity = "0";

    this._updateLabel(first.label);
    this._buildDebugLabels();

    // Reduced-motion: skip animation, just show the first focus region
    if (this._reduced) {
      this._container.classList.add("is-paused");
      return;
    }

    this._scheduleNext();
  }

  /** Schedule the next hold-then-transition cycle. */
  _scheduleNext() {
    if (this._paused || this._destroyed) return;

    this._holdTimer = setTimeout(() => {
      if (this._paused || this._destroyed) return;
      this._crossfade();
    }, HOLD_MS);
  }

  /** Crossfade from the current focus region to the next. */
  _crossfade() {
    const nextIndex = (this._markIndex + 1) % this._marks.length;
    const nextMark = this._marks[nextIndex];

    const incoming = this._activeSlot === "a" ? "b" : "a";
    const incomingEl = incoming === "a" ? this._layerA : this._layerB;
    const activeEl = this._activeSlot === "a" ? this._layerA : this._layerB;

    // Position the incoming layer at the next mark before fading it in
    setFocusRegion(incomingEl, nextMark);

    // Trigger CSS transition
    requestAnimationFrame(() => {
      activeEl.style.opacity = "0";
      incomingEl.style.opacity = "1";
    });

    // Fade label
    this._fadeLabel(nextMark.label);

    // Update debug active indicator
    this._updateDebugActive(nextIndex);

    // After transition completes, advance state
    this._transitionTimer = setTimeout(() => {
      if (this._destroyed) return;
      this._markIndex = nextIndex;
      this._activeSlot = incoming;
      this._scheduleNext();
    }, TRANSITION_MS + 150);
  }

  /** Fade the active-label text to the new value. */
  _fadeLabel(newLabel) {
    if (!this._labelEl) return;
    this._labelEl.classList.add("is-fading");
    setTimeout(() => {
      if (this._destroyed) return;
      this._labelEl.textContent = newLabel;
      this._labelEl.classList.remove("is-fading");
    }, LABEL_FADE_MS);
  }

  /** Directly update the label without fade (used on init). */
  _updateLabel(label) {
    if (!this._labelEl) return;
    this._labelEl.textContent = label;
  }

  /** Build absolutely-positioned debug label elements. */
  _buildDebugLabels() {
    if (!this._debugLabels) return;
    this._debugLabels.innerHTML = "";

    this._marks.forEach((mark, i) => {
      const el = document.createElement("div");
      el.className = "fph-debug-label";
      el.dataset.markIndex = String(i);

      // Use mark percentage values to size and position the indicator
      const xPct = parseFloat(mark.x);
      const yPct = parseFloat(mark.y);
      const wPct = parseFloat(mark.w) * 0.8;
      const hPct = parseFloat(mark.h) * 0.8;

      el.style.left = `${xPct}%`;
      el.style.top = `${yPct}%`;
      el.style.width = `${wPct}%`;
      el.style.paddingBottom = `${hPct}%`;

      const text = document.createElement("span");
      text.className = "fph-debug-label-text";
      text.textContent = mark.label;
      el.appendChild(text);

      this._debugLabels.appendChild(el);
    });

    this._updateDebugActive(this._markIndex);
  }

  /** Highlight the currently active focus region in debug view. */
  _updateDebugActive(activeIndex) {
    if (!this._debugLabels) return;
    this._debugLabels.querySelectorAll(".fph-debug-label").forEach((el, i) => {
      el.classList.toggle("is-active-region", i === activeIndex);
    });
  }

  /** Toggle animation pause. */
  togglePause(buttonEl) {
    this._paused = !this._paused;

    if (buttonEl) {
      buttonEl.setAttribute("aria-pressed", String(this._paused));
      buttonEl.textContent = this._paused ? "Resume motion" : "Pause motion";
    }

    this._container.classList.toggle("is-paused", this._paused);

    if (!this._paused) {
      this._scheduleNext();
    } else {
      clearTimeout(this._holdTimer);
      clearTimeout(this._transitionTimer);
    }
  }

  /** Toggle debug overlay showing focus region boundaries. */
  toggleDebug(buttonEl) {
    const isDebug = this._container.classList.toggle("is-debug");
    if (buttonEl) {
      buttonEl.setAttribute("aria-pressed", String(isDebug));
      buttonEl.classList.toggle("is-active", isDebug);
    }
  }

  /** Pause / resume from outside the instance. */
  pause() {
    if (!this._paused) {
      const btn = this._container.querySelector("[data-fph-pause]");
      this.togglePause(btn);
    }
  }

  resume() {
    if (this._paused) {
      const btn = this._container.querySelector("[data-fph-pause]");
      this.togglePause(btn);
    }
  }

  /** Tear down timers. */
  destroy() {
    this._destroyed = true;
    clearTimeout(this._holdTimer);
    clearTimeout(this._transitionTimer);
  }
}

// ── Module-level instance reference ───────────────────────────────
let _activeInstance = null;

/**
 * Convenience export — pause (or resume) the active demo.
 * Safe to call before the demo is initialized.
 */
export function pauseFocusMotion() {
  _activeInstance?.pause();
}

/**
 * Start the rack-focus animation on a container element.
 * Returns a cancel function.
 * @param {HTMLElement} container
 * @param {object[]}    [marks]  - override focusMarks
 * @returns {function}  cancel()
 */
export function animateFocusPull(container, marks) {
  const instance = new FocusPullHero(container, marks);
  instance.init();
  return () => instance.destroy();
}

/**
 * Initialize the focus-pull hero demo found on the current page.
 * Called by site.js on DOMContentLoaded.
 */
export function initializeFocusPullHeroDemo() {
  const container = document.querySelector("[data-focus-pull-hero]");
  if (!container) return;

  _activeInstance = new FocusPullHero(container, focusMarks);
  _activeInstance.init();
}
