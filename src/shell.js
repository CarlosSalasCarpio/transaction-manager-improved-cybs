/* ============================================================
   Page shell: top bar, header, quick pills, table card
   ============================================================ */

import { CONFIG, QUICK_PILLS } from "./constants.js";
import { COLS_SVG, closeAllPopovers, el, esc, refs } from "./dom.js";
import { exportCsv, togglePill } from "./app.js";
import { buildSuite } from "./suite.js";
import { buildColumnMenu, renderHead } from "./table.js";

export function mountShell(host, { onDisable }) {
  host.querySelectorAll("#" + CONFIG.rootId).forEach(n => n.remove());
  const root = el("div", { id: CONFIG.rootId });

  /* top bar */
  const topbar = el("header", { class: "cybsx-topbar" }, `
    <div class="cybsx-brand"><strong>cybersource</strong><span>Evolved TM</span></div>`);
  const meta = el("div", { class: "cybsx-topbar-meta" });
  meta.innerHTML = `<span>Merchant</span><code>cesc_gpn_1772116982</code><span class="cybsx-env-badge">Test server</span>`;
  // master toggle
  const toggleWrap = el("button", { class: "cybsx-toggle", type: "button", "aria-pressed": "true", title: "Toggle Evolved UI" });
  toggleWrap.innerHTML = `<span class="cybsx-toggle-track"><span class="cybsx-toggle-knob"></span></span><span class="cybsx-toggle-label">Evolved UI</span>`;
  toggleWrap.addEventListener("click", onDisable);
  meta.append(toggleWrap);
  topbar.append(meta);
  root.append(topbar);

  const shell = el("div", { class: "cybsx-shell" });

  /* page head */
  const head = el("div", { class: "cybsx-page-head" }, `
    <div><h1>Transactions</h1>
    <p>Granular search across every field the TSS API exposes — no more hidden values.</p></div>`);
  const headActions = el("div", { class: "cybsx-head-actions" });
  const exportBtn = el("button", { class: "cybsx-btn", type: "button" }, "Export CSV");
  exportBtn.addEventListener("click", exportCsv);
  headActions.append(exportBtn);
  head.append(headActions);
  shell.append(head);

  /* quick pills */
  const quick = el("div", { class: "cybsx-quick-row" });
  quick.append(el("span", { class: "cybsx-quick-label" }, "Quick filters"));
  QUICK_PILLS.forEach(p => {
    const btn = el("button", { class: "cybsx-pill", type: "button", "aria-pressed": "false", "data-pill": p.id }, `<span class="cybsx-pill-dot"></span>${esc(p.label)}`);
    btn.addEventListener("click", () => togglePill(p));
    quick.append(btn);
  });
  shell.append(quick);

  /* filter suite */
  shell.append(buildSuite());

  /* active tags */
  refs.tags = el("div", { class: "cybsx-tags" });
  shell.append(refs.tags);

  /* table card */
  const card = el("div", { class: "cybsx-table-card" });
  const toolbar = el("div", { class: "cybsx-table-toolbar" });
  refs.resultCount = el("span", { class: "cybsx-result-count" });
  toolbar.append(refs.resultCount);

  const toolbarRight = el("div", { class: "cybsx-toolbar-right" });
  // column manager
  const colBtn = el("button", { class: "cybsx-btn cybsx-btn--soft", type: "button" }, `${COLS_SVG}<span>Columns</span>`);
  refs.colMenu = buildColumnMenu();
  const colWrap = el("div", { class: "cybsx-col-anchor" });
  colWrap.append(colBtn, refs.colMenu);
  colBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = refs.colMenu.getAttribute("data-open") === "true";
    closeAllPopovers(refs.colMenu);
    refs.colMenu.setAttribute("data-open", String(!open));
  });
  toolbarRight.append(colWrap);
  toolbar.append(toolbarRight);
  card.append(toolbar);

  const wrap = el("div", { class: "cybsx-table-wrap" });
  refs.table = el("table", { class: "cybsx-table" });
  refs.thead = el("thead");
  refs.tbody = el("tbody");
  refs.table.append(refs.thead, refs.tbody);
  wrap.append(refs.table);
  card.append(wrap);
  shell.append(card);

  root.append(shell);
  host.append(root);

  renderHead();
  document.addEventListener("click", () => closeAllPopovers());
}
