/* ============================================================
   CyberSource TM — Evolved UI · content.js
   Thin loader: content scripts cannot be ES modules, so this
   dynamic-imports the real entry point (src/main.js). All src/
   files must be listed in web_accessible_resources.
   ============================================================ */

(() => {
  "use strict";
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return;
  import(chrome.runtime.getURL("src/main.js"))
    .catch(err => console.error("[cybsx] failed to load Evolved UI modules:", err));
})();
