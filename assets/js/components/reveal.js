import { qsa } from "../core/dom.js";
import { prefersReducedMotion } from "../core/motion.js";

export function initializeRevealSystem() {
  const nodes = qsa("[data-reveal]");
  if (!nodes.length) {
    return;
  }

  nodes.forEach((node) => {
    const delay = Number(node.dataset.revealDelay || 0);
    node.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (prefersReducedMotion()) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  nodes.forEach((node) => observer.observe(node));
}