/* ============================================================
   TSS query builder
   ============================================================ */

import { FIELD_BY_KEY } from "./constants.js";
import { state } from "./state.js";

export function buildTssQuery() {
  const f = state.filters, parts = [];
  if (f.datePreset === "custom" && f.dateFrom && f.dateTo)
    parts.push(`submitTimeUtc:[${new Date(f.dateFrom).getTime()} TO ${new Date(f.dateTo).getTime()}]`);
  else if (f.datePreset && f.datePreset !== "custom")
    parts.push(`submitTimeUtc:${f.datePreset}`);

  if (f.search.trim()) {
    const s = f.search.trim();
    if (/^\d{16,}$/.test(s)) parts.push(`id:${s}`);
    else if (s.includes("@")) parts.push(`orderInformation.billTo.email:${s}`);
    else parts.push(`clientReferenceInformation.code:${s}`);
  }
  if (f.cardTypes.length) parts.push(`paymentInformation.card.type:(${f.cardTypes.join(" OR ")})`);
  if (f.applications.length) parts.push(`applicationInformation.applications.name:(${f.applications.map(a => `\\"${a}\\"`).join(" OR ")})`);
  if (f.amountMin != null) parts.push(`orderInformation.amountDetails.totalAmount:>=${f.amountMin}`);
  if (f.amountMax != null) parts.push(`orderInformation.amountDetails.totalAmount:<=${f.amountMax}`);

  // optional fields
  for (const key of state.extraFields) {
    const v = (f.extra[key] ?? "").trim?.() ?? f.extra[key];
    if (v) parts.push(`${FIELD_BY_KEY[key].tss}:${/\s/.test(v) ? `"${v}"` : v}`);
  }
  return parts.join(" AND ");
}

/* The query actually sent to the API: a manual override wins. */
export const getTssQuery = () => state.queryOverride ?? buildTssQuery();
