/* ============================================================
   Build a single, self-contained artifact from the ES modules:

     dist/transaction-manager-improved-cybs.js
        IIFE bundle with the CSS inlined. Paste into a DevTools
        console / Snippet, or host it; runs with no extension.

     dist/bookmarklet.txt
        The same bundle as a ready-to-paste `javascript:` URL for
        a browser bookmark.

   No Chrome APIs are used by this build; the live data still comes
   from POST /ebc2/tss/v2/searches via the page's own session.
   ============================================================ */

import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

const result = await build({
  entryPoints: [join(root, "src/bookmarklet.js")],
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: true,
  legalComments: "none",
  write: false,
});

const bundle = result.outputFiles[0].text.trim();
const css = readFileSync(join(root, "styles.css"), "utf8");

// CSS is handed to the runtime on a global before the bundle runs.
const prelude = `window.__CYBSX_INLINE_CSS__=${JSON.stringify(css)};`;
const standalone = `/* Evolved CyberSource Transaction Manager — self-contained build. */\n(function(){${prelude}${bundle}})();\n`;

const standalonePath = join(dist, "transaction-manager-improved-cybs.js");
writeFileSync(standalonePath, standalone);

const bookmarklet = "javascript:" + encodeURIComponent(`(function(){${prelude}${bundle}})();`);
const bookmarkletPath = join(dist, "bookmarklet.txt");
writeFileSync(bookmarkletPath, bookmarklet + "\n");

const kb = n => (n / 1024).toFixed(1) + " KB";
console.log("Built:");
console.log("  " + standalonePath + "  (" + kb(standalone.length) + ")");
console.log("  " + bookmarkletPath + "  (" + kb(bookmarklet.length) + ")");
