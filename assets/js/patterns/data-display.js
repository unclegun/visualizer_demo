import { qsa, qs } from "../core/dom.js";

function setState(state) {
  qsa("[data-table-state]").forEach((node) => {
    node.hidden = node.dataset.tableState !== state;
  });
}

export function initializeDataDisplayDemo() {
  const loadButton = qs("[data-load-table]");
  if (loadButton) {
    loadButton.addEventListener("click", () => {
      setState("loading");
      window.setTimeout(() => setState("ready"), 900);
    });
  }

  qsa("[data-toggle-row]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.toggleRow;
      const row = targetId ? document.getElementById(targetId) : null;
      if (!row) {
        return;
      }
      row.classList.toggle("is-open");
    });
  });
}