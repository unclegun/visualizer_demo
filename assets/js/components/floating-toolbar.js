import { qs } from "../core/dom.js";

export function initializeFloatingToolbar() {
  const rail = qs("[data-floating-rail]");
  if (!rail) {
    return;
  }

  const update = () => {
    const hide = window.scrollY < 120;
    rail.classList.toggle("is-hidden", hide);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}