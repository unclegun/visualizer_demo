import { qs, qsa } from "../core/dom.js";

export function initializeHtmxPartialsDemo() {
  const root = qs("#htmxPartialsDemo");
  if (!root) {
    return;
  }

  const input = qs("#htmxSearchInput", root);
  const results = qs("#htmxSearchResults", root);
  const items = qsa("li", results);

  input?.addEventListener("input", () => {
    root.classList.add("loading");
    const term = input.value.toLowerCase().trim();
    window.setTimeout(() => {
      items.forEach((item) => {
        item.classList.toggle("d-none", term && !item.textContent.toLowerCase().includes(term));
      });
      root.classList.remove("loading");
    }, 220);
  });
}
