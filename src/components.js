/* ============================================================
   Reusable UI components: MultiSelect & SearchableMenu
   ============================================================ */

import { CHECK_SVG, closeAllPopovers, el, esc } from "./dom.js";

export function MultiSelect({ placeholder, options, selected, onChange }) {
  const root = el("div", { class: "cybsx-multi", "data-open": "false" });
  const trigger = el("button", { class: "cybsx-multi-trigger", type: "button", "aria-haspopup": "listbox" });
  const pop = el("div", { class: "cybsx-multi-pop", role: "listbox" });
  const renderTrigger = () => {
    if (!selected.length) trigger.innerHTML = `<span class="cybsx-multi-placeholder">${esc(placeholder)}</span>`;
    else {
      const labels = options.filter(o => selected.includes(o.value)).map(o => o.label).join(", ");
      trigger.innerHTML = `<span class="cybsx-multi-value">${esc(labels)}</span><span class="cybsx-multi-badge">${selected.length}</span>`;
    }
  };
  options.forEach(opt => {
    const lab = el("label", { class: "cybsx-multi-opt" });
    const cb = el("input", { type: "checkbox", value: opt.value });
    cb.checked = selected.includes(opt.value);
    cb.addEventListener("change", () => {
      const idx = selected.indexOf(opt.value);
      if (cb.checked && idx === -1) selected.push(opt.value);
      if (!cb.checked && idx > -1) selected.splice(idx, 1);
      renderTrigger(); onChange();
    });
    lab.append(cb, el("span", { class: "cybsx-check" }, CHECK_SVG), el("span", {}, esc(opt.label)));
    if (opt.meta) lab.append(el("small", {}, esc(opt.meta)));
    pop.append(lab);
  });
  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const open = root.getAttribute("data-open") === "true";
    closeAllPopovers(root);
    root.setAttribute("data-open", String(!open));
  });
  root.append(trigger, pop);
  renderTrigger();
  root._sync = () => { pop.querySelectorAll("input").forEach(cb => { cb.checked = selected.includes(cb.value); }); renderTrigger(); };
  return root;
}

export function SearchableMenu({ items, onPick, placeholder }) {
  const root = el("div", { class: "cybsx-menu", "data-open": "false" });
  const pop = el("div", { class: "cybsx-menu-pop", role: "menu" });
  const search = el("input", { class: "cybsx-menu-search", type: "search", placeholder });
  const list = el("div", { class: "cybsx-menu-list" });

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = "";
    const visible = items().filter(it => !q || it.label.toLowerCase().includes(q));
    if (!visible.length) { list.append(el("div", { class: "cybsx-menu-empty" }, "No fields left to add")); return; }
    visible.forEach(it => {
      const row = el("button", { class: "cybsx-menu-item", type: "button" }, `<span>${esc(it.label)}</span>`);
      row.addEventListener("click", e => { e.stopPropagation(); onPick(it); root.setAttribute("data-open", "false"); });
      list.append(row);
    });
  };
  search.addEventListener("input", draw);
  search.addEventListener("click", e => e.stopPropagation());
  pop.append(search, list);
  root.append(pop);
  root._open = () => { closeAllPopovers(root); root.setAttribute("data-open", "true"); search.value = ""; draw(); setTimeout(() => search.focus(), 30); };
  root._draw = draw;
  return root;
}
