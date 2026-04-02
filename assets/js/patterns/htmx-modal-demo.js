import { qs } from "../core/dom.js";

export function initializeHtmxModalDemo() {
  const root = qs("#htmxModalDemo");
  if (!root) {
    return;
  }

  const openButton = qs("#openHtmxModal");
  const modalElement = qs("#htmxDemoModal");
  const modalBody = qs("#htmxModalBody");
  const modal = typeof bootstrap !== "undefined" ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;

  openButton?.addEventListener("click", () => {
    modalBody.innerHTML = '<div class="text-muted">Loading partial...</div>';
    modal?.show();
    window.setTimeout(() => {
      modalBody.innerHTML = `
        <form>
          <div class="mb-3"><label class="form-label">Display Name</label><input class="form-control" value="Maya Nguyen" /></div>
          <div class="mb-3"><label class="form-label">Email</label><input class="form-control" value="maya.nguyen@contoso.test" /></div>
          <button type="button" class="btn btn-primary" id="submitHtmxModal">Save</button>
        </form>`;
      qs("#submitHtmxModal")?.addEventListener("click", () => modal?.hide());
    }, 260);
  });
}
