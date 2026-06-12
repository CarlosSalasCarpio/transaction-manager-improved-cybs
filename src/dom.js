/* ============================================================
   DOM helpers, SVG icons, and shared element refs
   ============================================================ */

export const el = (tag, attrs = {}, html = "") => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "hidden") { if (v) node.setAttribute("hidden", ""); }
    else if (k.startsWith("data-") || k.startsWith("aria-")) node.setAttribute(k, v);
    else node[k] = v;
  }
  if (html) node.innerHTML = html;
  return node;
};

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export const CHECK_SVG = `<svg width="9" height="8" viewBox="0 0 9 8" fill="none"><path d="M1 4.2 3.4 6.6 8 1.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const CHEV_SVG  = `<svg width="11" height="7" viewBox="0 0 11 7" fill="none"><path d="M1 1l4.5 4.5L10 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
export const PLUS_SVG  = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
export const COLS_SVG  = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="11" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 1v11M9 1v11" stroke="currentColor" stroke-width="1.3"/></svg>`;
export const LINK_SVG  = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M6 8l5-5M11 3H7.5M11 3v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 8.5V11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* Shared references to live DOM nodes, populated while mounting. */
export const refs = {};

let shadowRoot = null;
export const setShadowRoot = root => { shadowRoot = root; };
export const getShadowRoot = () => shadowRoot;

export function closeAllPopovers(except) {
  (shadowRoot || document).querySelectorAll(`.cybsx-multi[data-open="true"], .cybsx-menu[data-open="true"]`)
    .forEach(m => { if (m !== except) m.setAttribute("data-open", "false"); });
}
