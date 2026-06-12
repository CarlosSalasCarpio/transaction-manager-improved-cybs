/* ============================================================
   Table rendering: head, body, row detail, payload tree,
   column manager
   ============================================================ */

import { CARD_TYPES, TSS_TO_FIELD } from "./constants.js";
import { CHECK_SVG, LINK_SVG, PLUS_SVG, el, esc, refs } from "./dom.js";
import { COLUMNS } from "./columns.js";
import { applyFilters } from "./filters.js";
import { detailsUrl } from "./format.js";
import { state } from "./state.js";
import { setExtraFieldValue } from "./suite.js";

export function activeColumns() { return state.columns.map(k => COLUMNS.find(c => c.key === k)).filter(Boolean); }

export function renderHead() {
  const cols = activeColumns();
  const tr = el("tr");
  cols.forEach(col => {
    const th = el("th", col.num ? { class: "cybsx-num" } : {});
    if (col.sort) {
      th.setAttribute("data-sort", col.sort);
      th.innerHTML = `${esc(col.label)} <span class="cybsx-sort-arrow">${state.sort.key === col.sort ? (state.sort.dir === "asc" ? "▲" : "▼") : ""}</span>`;
      th.addEventListener("click", () => {
        if (state.sort.key === col.sort) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
        else state.sort = { key: col.sort, dir: "desc" };
        renderHead(); renderTable(applyFilters());
      });
    } else th.textContent = col.label;
    tr.append(th);
  });
  refs.thead.innerHTML = "";
  refs.thead.append(tr);
}

export function renderTable(rows) {
  const cols = activeColumns();
  refs.tbody.innerHTML = "";
  if (state.loading) {
    const tr = el("tr");
    tr.append(el("td", { colSpan: cols.length }, `<div class="cybsx-empty"><strong>Loading transactions…</strong>Querying the Transaction Search API.</div>`));
    refs.tbody.append(tr);
    return;
  }
  if (state.error) {
    const tr = el("tr");
    tr.append(el("td", { colSpan: cols.length }, `<div class="cybsx-empty cybsx-empty--error"><strong>Couldn't load transactions</strong>${esc(state.error)}</div>`));
    refs.tbody.append(tr);
    return;
  }
  if (!rows.length) {
    const tr = el("tr");
    tr.append(el("td", { colSpan: cols.length }, `<div class="cybsx-empty"><strong>No transactions match these filters</strong>Loosen a filter or clear the active tags above to widen the search.</div>`));
    refs.tbody.append(tr);
    return;
  }
  rows.forEach(txn => {
    const tr = el("tr", { class: "cybsx-row", "data-expanded": String(state.expandedId === txn.id), tabIndex: 0 });
    cols.forEach(col => {
      const td = el("td", col.num ? { class: "cybsx-num" } : {});
      td.innerHTML = col.get(txn);
      tr.append(td);
    });

    const detailTr = el("tr", { class: "cybsx-detail-row" });
    const detailTd = el("td", { colSpan: cols.length });
    const detail = el("div", { class: "cybsx-detail", "data-open": String(state.expandedId === txn.id) });
    const dInner = el("div");
    dInner.append(buildDetail(txn));
    detail.append(dInner);
    detailTd.append(detail);
    detailTr.append(detailTd);

    const toggle = () => {
      const willOpen = state.expandedId !== txn.id;
      state.expandedId = willOpen ? txn.id : null;
      refs.tbody.querySelectorAll(".cybsx-row").forEach(r => r.setAttribute("data-expanded", "false"));
      refs.tbody.querySelectorAll(".cybsx-detail").forEach(d => d.setAttribute("data-open", "false"));
      if (willOpen) { tr.setAttribute("data-expanded", "true"); detail.setAttribute("data-open", "true"); }
    };
    tr.addEventListener("click", toggle);
    tr.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    refs.tbody.append(tr, detailTr);
  });
}

function buildDetail(txn) {
  const wrap = el("div", { class: "cybsx-detail-inner" });
  const apps = txn.applicationInformation?.applications ?? [];

  const left = el("div");
  const headRow = el("div", { class: "cybsx-detail-head" });
  headRow.append(el("h3", {}, "Key facts"));
  const openBtn = el("a", { class: "cybsx-btn cybsx-btn--primary cybsx-btn--sm", href: detailsUrl(txn), target: "_blank", rel: "noopener" }, `${LINK_SVG}<span>Open details</span>`);
  openBtn.addEventListener("click", e => e.stopPropagation());
  headRow.append(openBtn);
  left.append(headRow);

  const kv = el("dl", { class: "cybsx-kv" });
  [["Request ID", txn.id], ["Merchant", txn.merchantId], ["Merchant ref", txn.clientReferenceInformation?.code],
   ["Processor", txn.processorInformation?.processor?.name], ["Approval code", txn.processorInformation?.approvalCode || "—"],
   ["Event status", txn.processorInformation?.eventStatus], ["Commerce", txn.processingInformation?.commerceIndicatorLabel],
   ["Card", `${CARD_TYPES[txn.paymentInformation?.card?.type]?.label ?? "?"} ${txn.paymentInformation?.card?.prefix ?? ""}…${txn.paymentInformation?.card?.suffix ?? ""}`]]
    .forEach(([k, v]) => kv.append(el("dt", {}, esc(k)), el("dd", {}, esc(v ?? "—"))));
  left.append(kv);

  left.append(el("h3", { style: "margin-top:14px" }, "Application trail"));
  const appsBox = el("div", { class: "cybsx-apps" });
  apps.forEach(a => {
    const ok = a.rCode === "1";
    appsBox.append(el("div", { class: "cybsx-app-line" }, `<code>${esc(a.name)}</code><span>${esc(a.rMessage ?? "")}</span><span class="cybsx-rflag ${ok ? "cybsx-rflag--ok" : "cybsx-rflag--bad"}">${esc(a.rFlag ?? "?")}</span>`));
  });
  left.append(appsBox);

  const right = el("div");
  right.append(el("h3", {}, "Full payload"));
  right.append(buildPayloadTree(txn));
  wrap.append(left, right);
  return wrap;
}

/* ----------------------------------------------------------
   Payload tree: JSON rendered line-by-line so each leaf whose
   path maps to a search field gets a hover "+" filter button.
   Array indices are skipped when building paths, so e.g.
   applications[2].name matches the TSS path
   "applicationInformation.applications.name".
---------------------------------------------------------- */
const PAYLOAD_INDENT_PX = 14;

function buildPayloadTree(txn) {
  const box = el("div", { class: "cybsx-payload cybsx-payload--tree" });
  appendJsonNode(box, null, txn, "", 0, false);
  return box;
}

function jsonLine(indent) {
  const d = el("div", { class: "cybsx-payload-line" });
  d.style.paddingLeft = `${indent * PAYLOAD_INDENT_PX}px`;
  return d;
}

function appendJsonNode(parent, key, value, path, indent, comma) {
  const keyHtml = key == null ? "" : `<span class="cybsx-payload-key">"${esc(key)}"</span>: `;
  const tail = comma ? "," : "";
  if (value !== null && typeof value === "object") {
    const isArr = Array.isArray(value);
    const open = isArr ? "[" : "{", close = isArr ? "]" : "}";
    const entries = isArr
      ? value.map(v => [null, v, path])
      : Object.keys(value).map(k => [k, value[k], path ? `${path}.${k}` : k]);
    const line = jsonLine(indent);
    if (!entries.length) { line.innerHTML = keyHtml + open + close + tail; parent.append(line); return; }
    line.innerHTML = keyHtml + open;
    parent.append(line);
    entries.forEach(([k, v, p], i) => appendJsonNode(parent, k, v, p, indent + 1, i < entries.length - 1));
    const closer = jsonLine(indent);
    closer.textContent = close + tail;
    parent.append(closer);
  } else {
    const line = jsonLine(indent);
    const valHtml = typeof value === "string"
      ? `<span class="cybsx-payload-str">"${esc(value)}"</span>`
      : `<span class="cybsx-payload-num">${esc(String(value))}</span>`;
    line.innerHTML = keyHtml + valHtml + tail;
    const field = TSS_TO_FIELD[path];
    if (field && value != null && value !== "") {
      line.classList.add("cybsx-payload-line--filterable");
      const btn = el("button", {
        class: "cybsx-payload-add", type: "button",
        title: `Add filter — ${field.label}: ${value}`,
        "aria-label": `Filter by ${field.label} = ${value}`,
      }, PLUS_SVG);
      btn.addEventListener("click", e => { e.stopPropagation(); setExtraFieldValue(field.key, String(value)); });
      line.append(btn);
    }
    parent.append(line);
  }
}

/* ----------------------------------------------------------
   Column manager
---------------------------------------------------------- */
export function buildColumnMenu() {
  const menu = el("div", { class: "cybsx-menu cybsx-col-menu", "data-open": "false" });
  const pop = el("div", { class: "cybsx-menu-pop", role: "menu" });
  pop.append(el("div", { class: "cybsx-menu-title" }, "Visible columns"));
  const list = el("div", { class: "cybsx-menu-list" });
  COLUMNS.forEach(col => {
    const row = el("label", { class: "cybsx-menu-check" });
    const cb = el("input", { type: "checkbox", value: col.key });
    cb.checked = state.columns.includes(col.key);
    cb.addEventListener("change", e => {
      e.stopPropagation();
      if (cb.checked && !state.columns.includes(col.key)) state.columns.push(col.key);
      if (!cb.checked) state.columns = state.columns.filter(k => k !== col.key);
      renderHead(); renderTable(applyFilters());
    });
    row.append(cb, el("span", { class: "cybsx-check" }, CHECK_SVG), el("span", {}, esc(col.label)));
    list.append(row);
  });
  pop.append(list);
  pop.addEventListener("click", e => e.stopPropagation());
  menu.append(pop);
  return menu;
}
