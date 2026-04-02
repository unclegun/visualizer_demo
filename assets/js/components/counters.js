import { qsa } from "../core/dom.js";
import { prefersReducedMotion } from "../core/motion.js";

function animateCounter(node) {
  const target = Number(node.dataset.counterTarget || 0);
  const duration = Number(node.dataset.counterDuration || 900);
  const start = performance.now();

  const format = (value) => new Intl.NumberFormat().format(Math.round(value));

  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = format(target * eased);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

export function initializeCounters() {
  const counters = qsa("[data-counter-target]");
  if (!counters.length) {
    return;
  }

  if (prefersReducedMotion()) {
    counters.forEach((counter) => {
      counter.textContent = new Intl.NumberFormat().format(Number(counter.dataset.counterTarget || 0));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}