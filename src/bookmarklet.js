/* ============================================================
   Bookmarklet entry point.
   Bundled (with the CSS inlined onto window.__CYBSX_INLINE_CSS__
   by the build) into a single self-contained file. Clicking the
   bookmark always opens the Evolved UI; if it's already open we
   bring it to a clean state instead of stacking overlays.
   ============================================================ */

import { PLUGIN_OFF_KEY } from "./constants.js";
import { enablePlugin } from "./main.js";

// A manual launch should never be suppressed by a previous "disable".
try { localStorage.removeItem(PLUGIN_OFF_KEY); } catch (e) {}

if (!document.getElementById("cybs-evolved-host")) enablePlugin();
