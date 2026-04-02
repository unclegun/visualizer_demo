import { qs } from "./dom.js";

export function initializeScrollProgress() {
  const indicator = qs("[data-scroll-progress]");
  if (!indicator) {
    return;
  }

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    indicator.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

export function initializeStickyNavbarState() {
  const nav = qs(".site-navbar");
  if (!nav) {
    return;
  }

  const update = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}