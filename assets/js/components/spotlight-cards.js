import { qsa } from "../core/dom.js";
import { rafThrottle } from "../core/motion.js";

export function initializeSpotlightCards() {
  const cards = qsa("[data-spotlight-card]");
  if (!cards.length) {
    return;
  }

  cards.forEach((card) => {
    const update = rafThrottle((event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--spotlight-x", `${x}px`);
      card.style.setProperty("--spotlight-y", `${y}px`);
    });

    card.addEventListener("pointermove", update);
  });
}