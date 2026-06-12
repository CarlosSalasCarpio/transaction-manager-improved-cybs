/* ============================================================
   Client-side filtering & sorting
   ============================================================ */

import { FIELD_BY_KEY } from "./constants.js";
import { deriveStatus, valueByPath } from "./format.js";
import { defaultFilters, state } from "./state.js";

export function applyFilters() {
  const f = state.filters, q = f.search.trim().toLowerCase();
  let rows = state.data.filter(txn => {
    if (q) {
      const hay = [txn.id, txn.clientReferenceInformation?.code, txn.orderInformation?.billTo?.email,
        txn.orderInformation?.billTo?.firstName, txn.orderInformation?.billTo?.lastName].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.statuses.length && !f.statuses.includes(deriveStatus(txn))) return false;
    if (f.cardTypes.length && !f.cardTypes.includes(txn.paymentInformation?.card?.type)) return false;
    if (f.applications.length) {
      const names = (txn.applicationInformation?.applications ?? []).map(a => a.name);
      if (!f.applications.some(a => names.includes(a))) return false;
    }
    const amt = Number(txn.orderInformation?.amountDetails?.totalAmount ?? 0);
    if (f.amountMin != null && amt < f.amountMin) return false;
    if (f.amountMax != null && amt > f.amountMax) return false;
    if (f.datePreset === "custom" && f.dateFrom && f.dateTo) {
      const t = new Date(txn.submitTimeUtc).getTime();
      if (t < new Date(f.dateFrom).getTime() || t > new Date(f.dateTo).getTime()) return false;
    }
    for (const key of state.extraFields) {
      const want = String(f.extra[key] ?? "").trim().toLowerCase();
      if (!want) continue;
      const got = String(valueByPath(txn, FIELD_BY_KEY[key].tss) ?? "").toLowerCase();
      if (!got.includes(want)) return false;
    }
    return true;
  });

  const { key, dir } = state.sort, mul = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let va, vb;
    if (key === "amount") { va = Number(a.orderInformation?.amountDetails?.totalAmount ?? 0); vb = Number(b.orderInformation?.amountDetails?.totalAmount ?? 0); }
    else if (key === "submitTimeUtc") { va = a.submitTimeUtc; vb = b.submitTimeUtc; }
    else { va = a[key] ?? ""; vb = b[key] ?? ""; }
    return va < vb ? -mul : va > vb ? mul : 0;
  });
  return rows;
}

export function countActiveFilters() {
  const f = state.filters; let n = 0;
  if (f.search.trim()) n++;
  if (f.statuses.length) n++;
  if (f.cardTypes.length) n++;
  if (f.applications.length) n++;
  if (f.amountMin != null || f.amountMax != null) n++;
  if (f.datePreset !== defaultFilters().datePreset) n++;
  for (const key of state.extraFields) if (String(f.extra[key] ?? "").trim()) n++;
  return n;
}
