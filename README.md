# Transaction Manager Improved — CyberSource

A Chrome extension (Manifest V3) that replaces the legacy CyberSource EBC2
Transaction Management UI with a faster, more granular search dashboard. It
renders a fully isolated Shadow-DOM overlay on top of the native page and
queries the live Transaction Search API (`POST /ebc2/tss/v2/searches`) using
your existing EBC2 session.

## Features

- **Advanced Filter Suite** — quick-filter pills plus on-demand access to all 38
  TSS search fields, card-type / status / application multi-selects, an amount
  range slider, and TSS date-math presets.
- **Editable query bar** — the generated TSS `query` string is shown live and can
  be edited by hand; manual edits take over (with an "edited" badge) until you
  reset back to the filter-driven query. Press Enter to run it.
- **Add filters straight from the payload** — every leaf in a transaction's "Full
  payload" that maps to a searchable field shows a hover `+` button that adds it
  to the filters with one click.
- **Configurable table** — toggle columns on/off, sort, expand rows for key facts
  and the application trail, deep-link to the native details page, and export the
  current view to CSV.
- **Master on/off toggle** — instantly restore the original EBC2 UI; a floating
  chip brings the Evolved UI back.

## Project structure

```
content.js        Thin loader: dynamic-imports src/main.js (content scripts
                  cannot be ES modules directly).
manifest.json     MV3 manifest; exposes src/*.js and styles.css as
                  web_accessible_resources.
styles.css        All styling, injected into the shadow root.
src/
  main.js         Entry point: overlay mount, boot, enable/disable.
  shell.js        Page shell (top bar, header, quick pills, table card).
  suite.js        Advanced Filter Suite + optional fields + query editor.
  table.js        Table head/body, row detail, payload tree, column manager.
  app.js          Refresh + server-reload pipeline, tags, pills, CSV export.
  api.js          Live data access (POST /ebc2/tss/v2/searches).
  filters.js      Client-side filtering & sorting.
  query.js        TSS query builder.
  columns.js      Table column definitions.
  components.js   Reusable MultiSelect & SearchableMenu.
  format.js       Derivations & formatters.
  constants.js    Reference data & configuration.
  dom.js          DOM helpers, icons, shared refs.
  state.js        Application state.
```

## Install (Load unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Navigate to a CyberSource EBC2 Transaction Management page; the Evolved UI
   mounts automatically.

The extension only runs on:

- `https://ebc2test.cybersource.com/ebc2/app/TransactionManagement/*`
- `https://ebc2.cybersource.com/ebc2/app/TransactionManagement/*`

## Notes

- No build step and no dependencies — it ships as plain ES modules loaded via a
  dynamic import from the content script.
- All data is fetched live from the Transaction Search API using your logged-in
  session cookies. There is no mock or bundled data.
