import { qs } from "../core/dom.js";

const data = {
  US: ["Seattle", "Austin", "Boston"],
  CA: ["Toronto", "Calgary", "Vancouver"],
  DE: ["Berlin", "Munich", "Hamburg"]
};

export function initializeHtmxCascadingDemo() {
  const root = qs("#htmxCascadingDemo");
  if (!root) {
    return;
  }

  const parent = qs("#countrySelect");
  const child = qs("#citySelect");

  parent?.addEventListener("change", () => {
    root.classList.add("loading");
    const options = data[parent.value] || [];
    window.setTimeout(() => {
      child.innerHTML = options.length
        ? options.map((option) => `<option>${option}</option>`).join("")
        : '<option value="">Select a country first</option>';
      root.classList.remove("loading");
    }, 220);
  });
}
