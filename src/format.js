/* ============================================================
   Derivations & formatters (pure functions over txn data)
   ============================================================ */

import { CONFIG } from "./constants.js";

export function deriveStatus(txn) {
  const ev = txn.processorInformation?.eventStatus;
  const apps = txn.applicationInformation?.applications ?? [];
  const declined = apps.some(a => a.rCode === "0" || /DECLINE|ERROR/i.test(a.rFlag || ""));
  if (declined || ev === "Declined") return "declined";
  const hasBill = apps.some(a => a.name === "ics_bill");
  if (hasBill) return ev === "Pending" ? "pending" : "settled";
  return "authorized";
}

export const fmtMoney = (v, ccy) => new Intl.NumberFormat(CONFIG.currencyLocale, { style: "currency", currency: ccy || "USD" }).format(Number(v));

export const fmtDate = iso => new Date(iso).toLocaleString(CONFIG.currencyLocale, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "GMT" }) + " GMT";

export function detailsUrl(txn) {
  const params = new URLSearchParams({
    requestId: txn.id,
    merchantId: txn.merchantId || "",
    dmTransaction: "false",
    fromSimilarSearch: "false",
    parentPage: "transactions",
  });
  const origin = (typeof location !== "undefined" && location.origin && location.origin.includes("cybersource"))
    ? location.origin : "https://ebc2test.cybersource.com";
  return `${origin}/ebc2/app/TransactionManagement/details?${params.toString()}`;
}

/* Resolve a dotted TSS path against a txn; arrays are flattened. */
export function valueByPath(obj, path) {
  return path.split(".").reduce((o, k) => {
    if (o == null) return undefined;
    if (Array.isArray(o)) return o.map(x => x?.[k]).filter(v => v != null).join(" ");
    return o[k];
  }, obj);
}
