import { qs, qsa } from "../core/dom.js";

export function initializeDataTableModalDemo() {
  const table = qs("#patternUsersTable");
  const modalElement = qs("#patternDemoModal");
  if (!table || !modalElement) {
    return;
  }

  const search = qs("#patternGlobalSearch");
  const summary = qs("#patternDemoSummary");
  const rows = qsa("tbody tr", table);
  const modal = typeof bootstrap !== "undefined" ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;

  const setSummary = (count) => {
    if (summary) {
      summary.textContent = `Showing ${count} of ${rows.length} rows`;
    }
  };

  const applyFilter = () => {
    const term = (search?.value || "").toLowerCase().trim();
    let visible = 0;

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const matches = !term || text.includes(term);
      row.classList.toggle("d-none", !matches);
      if (matches) {
        visible += 1;
      }
    });

    setSummary(visible);
  };

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      qs("#patternModalUsername").value = row.dataset.username || "";
      qs("#patternModalEmail").value = row.dataset.email || "";
      qs("#patternModalRole").value = row.dataset.role || "";
      modal?.show();
    });
  });

  search?.addEventListener("input", applyFilter);
  qs("#patternDemoSaveButton")?.addEventListener("click", () => modal?.hide());
  applyFilter();
}
