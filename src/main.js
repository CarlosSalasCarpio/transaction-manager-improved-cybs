/* ============================================================
   Entry point: overlay mounting, boot, master on/off toggle
   ============================================================ */

import { PLUGIN_OFF_KEY } from "./constants.js";
import { el, setShadowRoot } from "./dom.js";
import { reload, syncControls } from "./app.js";
import { mountShell } from "./shell.js";

async function injectStyles(root) {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      const css = await fetch(chrome.runtime.getURL("styles.css")).then(r => r.text());
      root.appendChild(el("style", {}, "")).textContent = css;
    }
  } catch (err) { console.warn("[cybsx] styles.css fetch failed; check web_accessible_resources", err); }
}

function mountOverlay() {
  const host = document.createElement("div");
  host.id = "cybs-evolved-host";
  host.style.cssText = [
    "all: initial !important", "position: fixed !important", "inset: 0 !important",
    "width: 100% !important", "height: 100% !important", "margin: 0 !important",
    "padding: 0 !important", "border: 0 !important", "display: block !important",
    "box-sizing: border-box !important", "overflow: auto !important",
    "z-index: 2147483647 !important", "background: #f3f5fa !important",
  ].join("; ");
  (document.body || document.documentElement).appendChild(host);
  return host;
}

function enablePlugin() {
  if (document.getElementById("cybs-evolved-host")) return;
  try { document.documentElement.style.setProperty("overflow", "hidden", "important"); } catch (e) {}
  const host = mountOverlay();
  const shadowRoot = host.attachShadow({ mode: "open" });
  setShadowRoot(shadowRoot);
  mountShell(shadowRoot, { onDisable: disablePlugin });
  injectStyles(shadowRoot).then(() => { syncControls(); reload(); });
  addFloatingReenable(false);
}

function disablePlugin() {
  try { localStorage.setItem(PLUGIN_OFF_KEY, "1"); } catch (e) {}
  const host = document.getElementById("cybs-evolved-host");
  if (host) host.remove();
  try { document.documentElement.style.removeProperty("overflow"); } catch (e) {}
  setShadowRoot(null);
  addFloatingReenable(true);
}

// Small floating chip on the native page to bring the Evolved UI back.
function addFloatingReenable(show) {
  let chip = document.getElementById("cybs-evolved-reenable");
  if (!show) { if (chip) chip.remove(); return; }
  if (chip) return;
  chip = document.createElement("button");
  chip.id = "cybs-evolved-reenable";
  chip.textContent = "✦ Evolved UI";
  chip.title = "Re-enable the Evolved Transaction Manager";
  chip.style.cssText = [
    "all: initial", "position: fixed", "right: 18px", "bottom: 18px",
    "z-index: 2147483646", "cursor: pointer",
    "font-family: -apple-system, Segoe UI, Roboto, sans-serif",
    "font-size: 13px", "font-weight: 600", "color: #fff",
    "background: linear-gradient(180deg,#2a5bee,#1e4fe0)", "padding: 10px 16px",
    "border-radius: 999px", "box-shadow: 0 6px 20px rgba(30,79,224,.45)",
  ].join("; ");
  chip.addEventListener("click", () => {
    try { localStorage.removeItem(PLUGIN_OFF_KEY); } catch (e) {}
    chip.remove();
    enablePlugin();
  });
  (document.body || document.documentElement).appendChild(chip);
}

function init() {
  let off = false;
  try { off = localStorage.getItem(PLUGIN_OFF_KEY) === "1"; } catch (e) {}
  if (off) { addFloatingReenable(true); return; }
  enablePlugin();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
