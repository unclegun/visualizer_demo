import { qsa } from "../core/dom.js";
import { rafThrottle, prefersReducedMotion } from "../core/motion.js";

export function initializeAdvancedHeadersDemo() {
  const layers = qsa("[data-parallax-layer]");
  if (!layers.length || prefersReducedMotion()) {
    return;
  }

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallaxLayer || 0.08);
      layer.style.transform = `translateY(${Math.round(y * depth)}px)`;
    });
  });

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}