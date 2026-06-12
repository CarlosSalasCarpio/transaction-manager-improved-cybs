/* ============================================================
   Refresh pipeline & filter actions (refresh, tags, pills,
   reset, control sync, CSV export)
   ============================================================ */

import { CARD_TYPES, DATE_PRESETS, FIELD_BY_KEY, QUICK_PILLS, STATUSES, AMOUNT_SLIDER_MAX } from "./constants.js";
import { searchTransactions } from "./api.js";
import { el, esc, getShadowRoot, refs } from "./dom.js";
import { applyFilters, countActiveFilters } from "./filters.js";
import { buildTssQuery } from "./query.js";
import { defaultFilters, state } from "./state.js";
import { paintRange } from "./suite.js";
import { activeColumns, renderTable } from "./table.js";

export function refresh() {
  const filtered = applyFilters();
  renderTable(filtered);
  renderTags();
  const n = countActiveFilters();
  refs.suiteCount.textContent = String(n);
  refs.suiteCount.setAttribute("data-zero", String(n === 0));
  refs.resultCount.innerHTML = `Showing <b>${filtered.length}</b> of <b>${state.data.length}</b> transactions`;
  syncQueryEditor();
}

/* Server round-trip: run the current TSS query against EBC2, then
   re-render. The query/date filters are applied server-side; the
   remaining controls refine the returned rows client-side. */
export async function reload() {
  state.loading = true;
  state.error = null;
  renderStatus();
  try {
    state.data = await searchTransactions();
  } catch (err) {
    state.data = [];
    state.error = err.message || String(err);
    console.error("[cybsx] search failed:", err);
  } finally {
    state.loading = false;
  }
  refresh();
}

/* Reflect loading/error immediately in the table + counter. */
function renderStatus() {
  if (state.loading) {
    refs.resultCount.innerHTML = "Loading transactions…";
    renderTable([]);
  }
}

/* Keep the query editor in sync with the filters unless the user
   has manually overridden it. */
export function syncQueryEditor() {
  if (!refs.queryInput) return;
  const overridden = state.queryOverride != null;
  if (!overridden) refs.queryInput.value = buildTssQuery();
  refs.queryEditWrap.setAttribute("data-edited", String(overridden));
}

function renderTags() {
  const f = state.filters;
  refs.tags.innerHTML = "";
  const tag = (label, value, onRemove) => {
    const t = el("span", { class: "cybsx-tag" }, `<b>${esc(label)}:</b> ${esc(value)}`);
    const x = el("button", { class: "cybsx-tag-x", type: "button", "aria-label": `Remove ${label} filter` }, "×");
    x.addEventListener("click", () => { onRemove(); syncControls(); refresh(); });
    t.append(x); refs.tags.append(t);
  };
  if (f.search.trim()) tag("Search", f.search.trim(), () => { f.search = ""; });
  if (f.statuses.length) tag("Status", f.statuses.map(s => STATUSES.find(x => x.value === s)?.label).join(", "), () => { f.statuses.length = 0; });
  if (f.cardTypes.length) tag("Cards", f.cardTypes.map(c => CARD_TYPES[c]?.label ?? c).join(", "), () => { f.cardTypes.length = 0; });
  if (f.applications.length) tag("Apps", f.applications.join(", "), () => { f.applications.length = 0; });
  if (f.amountMin != null || f.amountMax != null) tag("Amount", `${f.amountMin ?? 0} – ${f.amountMax ?? "∞"}`, () => { f.amountMin = f.amountMax = null; });
  if (f.datePreset !== defaultFilters().datePreset) tag("Date", DATE_PRESETS.find(p => p.value === f.datePreset)?.label ?? "Custom", () => { f.datePreset = defaultFilters().datePreset; f.dateFrom = f.dateTo = ""; });
  for (const key of state.extraFields) {
    const v = String(f.extra[key] ?? "").trim();
    if (v) tag(FIELD_BY_KEY[key].label, v, () => { f.extra[key] = ""; });
  }
  if (refs.tags.children.length) {
    const clear = el("button", { class: "cybsx-tags-clear", type: "button" }, "Clear all");
    clear.addEventListener("click", resetFilters);
    refs.tags.append(clear);
  }
}

export function togglePill(pill) {
  const f = state.filters, i = f.activePills.indexOf(pill.id);
  if (i > -1) {
    f.activePills.splice(i, 1);
    const search = f.search, extra = f.extra, extraFields = state.extraFields;
    Object.assign(f, defaultFilters(), { search, activePills: f.activePills, extra });
    state.extraFields = extraFields;
    f.activePills.forEach(id => QUICK_PILLS.find(p => p.id === id)?.apply(f));
  } else { f.activePills.push(pill.id); pill.apply(f); }
  syncControls(); refresh();
}

export function resetFilters() {
  const keepExtra = {};
  state.extraFields.forEach(k => keepExtra[k] = "");
  Object.assign(state.filters, defaultFilters(), { extra: keepExtra });
  state.queryOverride = null;
  syncControls();
  state.extraFields.forEach(k => {
    const node = refs.suiteGrid.querySelector(`.cybsx-field--added[data-key="${k}"]`);
    const ctrl = node?.querySelector("input, select");
    if (ctrl) ctrl.value = "";
  });
  refresh();
}

export function syncControls() {
  const f = state.filters;
  refs.search.value = f.search;
  refs.statusMulti._sync(); refs.cardMulti._sync(); refs.appMulti._sync();
  refs.amtMin.value = f.amountMin ?? ""; refs.amtMax.value = f.amountMax ?? "";
  refs.sliderMin.value = String(Math.min(f.amountMin ?? 0, AMOUNT_SLIDER_MAX));
  refs.sliderMax.value = String(Math.min(f.amountMax ?? AMOUNT_SLIDER_MAX, AMOUNT_SLIDER_MAX));
  paintRange();
  refs.dateSel.value = f.datePreset;
  refs.dateCustom.hidden = f.datePreset !== "custom";
  (getShadowRoot() || document).querySelectorAll(".cybsx-pill").forEach(p => p.setAttribute("aria-pressed", String(f.activePills.includes(p.getAttribute("data-pill")))));
}

export function exportCsv() {
  const rows = applyFilters();
  const cols = activeColumns();
  const tmp = document.createElement("div");
  const cellText = html => { tmp.innerHTML = html; return tmp.textContent.replace(/\s+/g, " ").trim(); };
  const lines = [cols.map(c => `"${c.label}"`).join(",")];
  rows.forEach(t => lines.push(cols.map(c => `"${cellText(c.get(t)).replace(/"/g, '""')}"`).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `transactions-${Date.now()}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}
