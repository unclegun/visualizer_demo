import { qs } from "../core/dom.js";

function spawnToast(message) {
  const stack = qs("[data-toast-stack]");
  if (!stack) {
    return;
  }

  const item = document.createElement("div");
  item.className = "demo-toast toast-enter p-3";
  item.setAttribute("role", "status");
  item.innerHTML = `<strong class="d-block">Action completed</strong><span class="text-subtle">${message}</span>`;
  stack.appendChild(item);
  window.setTimeout(() => {
    item.remove();
  }, 2400);
}

export function initializeMicrointeractionsDemo() {
  const toastButton = qs("[data-toast-demo]");
  if (toastButton) {
    toastButton.addEventListener("click", () => spawnToast("Configuration has been updated."));
  }

  const input = qs("[data-inline-validate]");
  if (!input) {
    return;
  }

  const hint = document.querySelector(input.dataset.inlineValidate || "");
  if (!hint) {
    return;
  }

  input.addEventListener("input", () => {
    hint.classList.toggle("is-visible", input.value.length > 0 && input.value.length < 4);
  });
}