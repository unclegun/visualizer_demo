import { qs, qsa } from "../core/dom.js";

export function initializeHtmxTableRefreshDemo() {
  const root = qs("#htmxTableRefreshDemo");
  if (!root) {
    return;
  }

  const status = qs("#rowActionStatus");
  qsa("[data-row-action]", root).forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      root.classList.add("loading");
      window.setTimeout(() => {
        row.classList.toggle("table-success");
        if (status) {
          status.textContent = `Updated ${row.dataset.user} using simulated hx-post + fragment swap.`;
        }
        root.classList.remove("loading");
      }, 240);
    });
  });
}
