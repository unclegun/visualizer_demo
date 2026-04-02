import { qsa } from "../core/dom.js";

export function initializePremiumCardsDemo() {
  qsa("[data-expand-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-expand-toggle");
      const card = targetId ? document.getElementById(targetId) : null;
      if (!card) {
        return;
      }
      const isOpen = card.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
}