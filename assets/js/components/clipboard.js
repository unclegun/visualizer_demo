import { qsa } from "../core/dom.js";

export function initializeClipboardActions() {
  const copyButtons = qsa("[data-copy-target]");
  if (!copyButtons.length) {
    return;
  }

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const selector = button.dataset.copyTarget;
      const source = selector ? document.querySelector(selector) : null;
      if (!source) {
        return;
      }
      const text = source.textContent || "";
      try {
        await navigator.clipboard.writeText(text.trim());
        const original = button.textContent;
        button.textContent = "Copied";
        button.classList.add("btn-success");
        setTimeout(() => {
          button.textContent = original;
          button.classList.remove("btn-success");
        }, 1400);
      } catch {
        button.textContent = "Copy failed";
      }
    });
  });
}