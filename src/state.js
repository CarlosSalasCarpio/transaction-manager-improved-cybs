/* ============================================================
   Application state
   ============================================================ */

import { COLUMNS } from "./columns.js";

export const defaultFilters = () => ({
  search: "", statuses: [], cardTypes: [], applications: [],
  amountMin: null, amountMax: null,
  datePreset: "[NOW/DAY-7DAYS TO NOW/DAY+1DAY}", dateFrom: "", dateTo: "",
  activePills: [],
  extra: {},        // key -> value for any added SEARCH_FIELDS
});

export const state = {
  filters: defaultFilters(),
  extraFields: [],  // ordered list of active optional-field keys
  columns: COLUMNS.filter(c => c.on).map(c => c.key),
  data: [],
  sort: { key: "submitTimeUtc", dir: "desc" },
  expandedId: null,
  queryOverride: null,  // manually edited TSS query; null = generated from filters
  loading: false,
  error: null,
};
