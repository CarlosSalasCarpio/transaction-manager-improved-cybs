/* ============================================================
   Advanced Filter Suite: core fields, amount/date controls,
   optional search fields, editable query bar
   ============================================================ */

import { AMOUNT_SLIDER_MAX, APPLICATIONS, CARD_TYPES, DATE_PRESETS, FIELD_BY_KEY, SEARCH_FIELDS, STATUSES } from "./constants.js";
import { CHEV_SVG, PLUS_SVG, debounce, el, esc, refs } from "./dom.js";
import { MultiSelect, SearchableMenu } from "./components.js";
import { state } from "./state.js";
import { refresh, reload, resetFilters, syncQueryEditor } from "./app.js";

export function buildSuite() {
  const f = state.filters;
  const suite = el("section", { class: "cybsx-suite", "data-open": "true" });

  const headBtn = el("button", { class: "cybsx-suite-head", type: "button", "aria-expanded": "true" }, `
    <h2>Advanced Filter Suite</h2><span class="cybsx-suite-sub">every TSS query field, zero friction</span>`);
  refs.suiteCount = el("span", { class: "cybsx-suite-count", "data-zero": "true" }, "0");
  headBtn.append(refs.suiteCount, el("span", { class: "cybsx-suite-chev" }, CHEV_SVG));
  headBtn.addEventListener("click", () => {
    const open = suite.getAttribute("data-open") === "true";
    suite.setAttribute("data-open", String(!open));
    headBtn.setAttribute("aria-expanded", String(!open));
  });
  suite.append(headBtn);

  const body = el("div", { class: "cybsx-suite-body" });
  const inner = el("div");
  refs.suiteGrid = el("div", { class: "cybsx-suite-grid" });

  /* core fields */
  const fSearch = el("div", { class: "cybsx-field" });
  fSearch.append(el("label", {}, "Smart search"));
  refs.search = el("input", { class: "cybsx-input", type: "search", placeholder: "Request ID, merchant ref, email, name…" });
  refs.search.value = f.search;
  refs.search.addEventListener("input", debounce(() => { f.search = refs.search.value; refresh(); }, 180));
  fSearch.append(refs.search, el("span", { class: "cybsx-field-hint" }, `Maps to <code>id</code>, <code>clientReferenceInformation.code</code>, <code>billTo.email</code>`));
  refs.suiteGrid.append(fSearch);

  const fStatus = el("div", { class: "cybsx-field" });
  fStatus.append(el("label", {}, "Transaction status"));
  refs.statusMulti = MultiSelect({ placeholder: "Any status", options: STATUSES, selected: f.statuses, onChange: refresh });
  fStatus.append(refs.statusMulti);
  refs.suiteGrid.append(fStatus);

  const fCards = el("div", { class: "cybsx-field" });
  fCards.append(el("label", {}, "Card types"));
  refs.cardMulti = MultiSelect({ placeholder: "Any card", options: Object.entries(CARD_TYPES).map(([value, v]) => ({ value, label: v.label, meta: value })), selected: f.cardTypes, onChange: refresh });
  fCards.append(refs.cardMulti);
  refs.suiteGrid.append(fCards);

  const fApps = el("div", { class: "cybsx-field" });
  fApps.append(el("label", {}, "Applications / flags"));
  refs.appMulti = MultiSelect({ placeholder: "Any application", options: APPLICATIONS.map(a => ({ ...a, meta: a.value })), selected: f.applications, onChange: refresh });
  fApps.append(refs.appMulti);
  refs.suiteGrid.append(fApps);

  /* amount */
  const fAmt = el("div", { class: "cybsx-field cybsx-field--wide" });
  fAmt.append(el("label", {}, "Amount span (USD)"));
  const amtRow = el("div", { class: "cybsx-amount-row" });
  refs.amtMin = el("input", { class: "cybsx-input", type: "number", min: "0", step: "0.01", placeholder: "Min 0.00" });
  refs.amtMax = el("input", { class: "cybsx-input", type: "number", min: "0", step: "0.01", placeholder: "Max ∞" });
  amtRow.append(refs.amtMin, el("span", { class: "cybsx-amount-sep" }, "—"), refs.amtMax);
  const track = el("div", { class: "cybsx-range-track" });
  refs.rangeFill = el("div", { class: "cybsx-range-fill" });
  refs.sliderMin = el("input", { type: "range", min: "0", max: String(AMOUNT_SLIDER_MAX), step: "10", value: "0" });
  refs.sliderMax = el("input", { type: "range", min: "0", max: String(AMOUNT_SLIDER_MAX), step: "10", value: String(AMOUNT_SLIDER_MAX) });
  track.append(refs.rangeFill, refs.sliderMin, refs.sliderMax);
  const syncFromInputs = () => {
    f.amountMin = refs.amtMin.value === "" ? null : Math.max(0, Number(refs.amtMin.value));
    f.amountMax = refs.amtMax.value === "" ? null : Math.max(0, Number(refs.amtMax.value));
    refs.sliderMin.value = String(Math.min(f.amountMin ?? 0, AMOUNT_SLIDER_MAX));
    refs.sliderMax.value = String(Math.min(f.amountMax ?? AMOUNT_SLIDER_MAX, AMOUNT_SLIDER_MAX));
    paintRange(); refresh();
  };
  const syncFromSliders = () => {
    let lo = Number(refs.sliderMin.value), hi = Number(refs.sliderMax.value);
    if (lo > hi) [lo, hi] = [hi, lo];
    f.amountMin = lo === 0 ? null : lo; f.amountMax = hi === AMOUNT_SLIDER_MAX ? null : hi;
    refs.amtMin.value = f.amountMin ?? ""; refs.amtMax.value = f.amountMax ?? "";
    paintRange(); refresh();
  };
  refs.amtMin.addEventListener("change", syncFromInputs);
  refs.amtMax.addEventListener("change", syncFromInputs);
  refs.sliderMin.addEventListener("input", syncFromSliders);
  refs.sliderMax.addEventListener("input", syncFromSliders);
  fAmt.append(amtRow, track);
  refs.suiteGrid.append(fAmt);

  /* date */
  const fDate = el("div", { class: "cybsx-field cybsx-field--wide" });
  fDate.append(el("label", {}, "Submit time (GMT)"));
  const selWrap = el("div", { class: "cybsx-select-wrap" });
  refs.dateSel = el("select", { class: "cybsx-select" });
  DATE_PRESETS.forEach(p => refs.dateSel.append(el("option", { value: p.value }, esc(p.label))));
  refs.dateSel.value = f.datePreset;
  selWrap.append(refs.dateSel);
  refs.dateCustom = el("div", { class: "cybsx-date-custom", hidden: true });
  refs.dateFrom = el("input", { class: "cybsx-input", type: "datetime-local" });
  refs.dateTo = el("input", { class: "cybsx-input", type: "datetime-local" });
  refs.dateCustom.append(refs.dateFrom, refs.dateTo);
  refs.dateSel.addEventListener("change", () => { f.datePreset = refs.dateSel.value; refs.dateCustom.hidden = f.datePreset !== "custom"; if (f.datePreset !== "custom") reload(); else refresh(); });
  [refs.dateFrom, refs.dateTo].forEach(inp => inp.addEventListener("change", () => { f.dateFrom = refs.dateFrom.value; f.dateTo = refs.dateTo.value; reload(); }));
  fDate.append(selWrap, refs.dateCustom, el("span", { class: "cybsx-field-hint" }, `Sent as TSS date-math, e.g. <code>submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}</code>`));
  refs.suiteGrid.append(fDate);

  /* placeholder where dynamic optional fields get inserted (before this node) */
  refs.extraAnchor = el("div", { class: "cybsx-extra-anchor", hidden: true });
  refs.suiteGrid.append(refs.extraAnchor);

  inner.append(refs.suiteGrid);

  /* footer */
  const foot = el("div", { class: "cybsx-suite-foot" });
  const applyBtn = el("button", { class: "cybsx-btn cybsx-btn--primary", type: "button" }, "Apply filters");
  applyBtn.addEventListener("click", reload);
  const resetBtn = el("button", { class: "cybsx-btn cybsx-btn--ghost", type: "button" }, "Reset all");
  resetBtn.addEventListener("click", resetFilters);

  // Add field control
  const addWrap = el("div", { class: "cybsx-add-anchor" });
  const addBtn = el("button", { class: "cybsx-btn cybsx-btn--soft", type: "button" }, `${PLUS_SVG}<span>Add search field</span>`);
  refs.fieldMenu = SearchableMenu({
    placeholder: "Search 38 fields…",
    items: () => SEARCH_FIELDS.filter(fd => !state.extraFields.includes(fd.key)).sort((a, b) => a.label.localeCompare(b.label)),
    onPick: fd => addExtraField(fd.key),
  });
  addBtn.addEventListener("click", e => { e.stopPropagation(); refs.fieldMenu._open(); });
  addWrap.append(addBtn, refs.fieldMenu);

  foot.append(applyBtn, resetBtn, addWrap, buildQueryEditor());
  inner.append(foot);

  body.append(inner);
  suite.append(body);
  return suite;
}

/* ----------------------------------------------------------
   Editable query bar.
   Auto-generated from the filter controls until the user types
   in it; from then on the manual text wins ("edited" badge) and
   the reset button restores syncing from the controls.
---------------------------------------------------------- */
function buildQueryEditor() {
  refs.queryEditWrap = el("div", { class: "cybsx-query-edit", "data-edited": "false" });
  refs.queryEditWrap.append(el("span", { class: "cybsx-query-edit-label" }, "query"));
  refs.queryInput = el("input", {
    class: "cybsx-query-input", type: "text", spellcheck: false, autocomplete: "off",
    placeholder: "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}",
    title: "TSS query — type to override the query generated by the filters",
  });
  refs.queryInput.addEventListener("input", () => {
    state.queryOverride = refs.queryInput.value;
    refs.queryEditWrap.setAttribute("data-edited", "true");
  });
  refs.queryInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); reload(); } });
  const badge = el("span", { class: "cybsx-query-edit-badge", title: "Press Enter to run this query" }, "edited");
  const reset = el("button", {
    class: "cybsx-query-reset", type: "button",
    title: "Discard manual edits and rebuild the query from the filters",
  }, "↺");
  reset.addEventListener("click", () => { state.queryOverride = null; syncQueryEditor(); reload(); });
  refs.queryEditWrap.append(refs.queryInput, badge, reset);
  return refs.queryEditWrap;
}

export function paintRange() {
  const lo = Number(refs.sliderMin.value), hi = Number(refs.sliderMax.value);
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
  refs.rangeFill.style.left = `${(a / AMOUNT_SLIDER_MAX) * 100}%`;
  refs.rangeFill.style.width = `${((b - a) / AMOUNT_SLIDER_MAX) * 100}%`;
}

/* ----------------------------------------------------------
   Optional search fields (add/remove/set)
---------------------------------------------------------- */
export function addExtraField(key) {
  if (state.extraFields.includes(key)) return;
  const fd = FIELD_BY_KEY[key];
  state.extraFields.push(key);
  if (!(key in state.filters.extra)) state.filters.extra[key] = "";

  const field = el("div", { class: "cybsx-field cybsx-field--added", "data-key": key });
  const labelRow = el("div", { class: "cybsx-field-labelrow" });
  labelRow.append(el("label", {}, esc(fd.label)));
  const rm = el("button", { class: "cybsx-field-remove", type: "button", title: "Remove field", "aria-label": `Remove ${fd.label}` }, "×");
  rm.addEventListener("click", () => removeExtraField(key));
  labelRow.append(rm);
  field.append(labelRow);

  let control;
  if (fd.type === "select") {
    const sw = el("div", { class: "cybsx-select-wrap" });
    control = el("select", { class: "cybsx-select" });
    control.append(el("option", { value: "" }, "Any"));
    fd.options.forEach(o => control.append(el("option", { value: o }, esc(o))));
    control.value = state.filters.extra[key] || "";
    control.addEventListener("change", () => { state.filters.extra[key] = control.value; refresh(); });
    sw.append(control); field.append(sw);
  } else {
    control = el("input", { class: "cybsx-input", type: "text", placeholder: `Filter by ${fd.label.toLowerCase()}` });
    control.value = state.filters.extra[key] || "";
    control.addEventListener("input", debounce(() => { state.filters.extra[key] = control.value; refresh(); }, 180));
    field.append(control);
  }
  field.append(el("span", { class: "cybsx-field-hint" }, `<code>${esc(fd.tss)}</code>`));

  refs.suiteGrid.insertBefore(field, refs.extraAnchor);
  refs.fieldMenu._draw();
  setTimeout(() => control.focus(), 30);
  refresh();
}

export function removeExtraField(key) {
  state.extraFields = state.extraFields.filter(k => k !== key);
  delete state.filters.extra[key];
  const node = refs.suiteGrid.querySelector(`.cybsx-field--added[data-key="${key}"]`);
  if (node) node.remove();
  refs.fieldMenu._draw();
  refresh();
}

/* Used by the payload "+" buttons: ensure the field is active in
   the suite and set its value, adding the control if needed. */
export function setExtraFieldValue(key, value) {
  state.filters.extra[key] = value;
  if (!state.extraFields.includes(key)) {
    addExtraField(key);  // picks up the value set above, then refreshes
    return;
  }
  const ctrl = refs.suiteGrid.querySelector(`.cybsx-field--added[data-key="${key}"] input, .cybsx-field--added[data-key="${key}"] select`);
  if (ctrl) ctrl.value = value;
  refresh();
}
