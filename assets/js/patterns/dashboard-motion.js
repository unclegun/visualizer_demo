import { qsa } from "../core/dom.js";

export function initializeDashboardMotionDemo() {
  const items = qsa("[data-status-item]");
  if (!items.length) {
    return;
  }

  let index = 0;
  window.setInterval(() => {
    items.forEach((item) => item.classList.remove("is-active"));
    items[index].classList.add("is-active");
    index = (index + 1) % items.length;
  }, 1800);
}