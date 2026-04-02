import { qsa, qs } from "../core/dom.js";

export function initializeFormsFiltersDemo() {
  const toggle = qs("[data-advanced-filter-toggle]");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const target = document.querySelector(toggle.dataset.advancedFilterToggle || "");
      if (!target) {
        return;
      }
      target.classList.toggle("d-none");
    });
  }

  qsa("[data-chip-toggle]").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("is-active"));
  });

  qsa("[data-choice-card]").forEach((card) => {
    card.addEventListener("click", () => {
      qsa("[data-choice-card]").forEach((other) => other.classList.remove("is-selected"));
      card.classList.add("is-selected");
    });
  });

  const passwordInput = qs("[data-password-strength]");
  const meter = qs("[data-password-meter]");
  if (passwordInput && meter) {
    passwordInput.addEventListener("input", () => {
      const value = passwordInput.value;
      let score = 0;
      if (value.length >= 8) score += 30;
      if (/[A-Z]/.test(value)) score += 20;
      if (/[0-9]/.test(value)) score += 20;
      if (/[^A-Za-z0-9]/.test(value)) score += 30;
      meter.style.width = `${Math.min(100, score)}%`;
    });
  }
}