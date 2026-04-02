import { qsa } from "../core/dom.js";

export function initializeProgressFills() {
  qsa("[data-progress-value]").forEach((bar) => {
    const value = Number(bar.dataset.progressValue || 0);
    window.requestAnimationFrame(() => {
      bar.style.width = `${Math.min(100, Math.max(0, value))}%`;
    });
  });
}