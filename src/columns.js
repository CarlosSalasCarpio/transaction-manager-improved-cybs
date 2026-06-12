/* ============================================================
   Table column definitions
   core columns are on by default; "optional" can be toggled.
   get(txn) returns innerHTML for the cell.
   ============================================================ */

import { CARD_TYPES, STATUSES } from "./constants.js";
import { esc } from "./dom.js";
import { deriveStatus, fmtDate, fmtMoney } from "./format.js";

export const COLUMNS = [
  { key: "date",     label: "Date", sort: "submitTimeUtc", on: true,
    get: t => `<span class="cybsx-cell-date">${esc(fmtDate(t.submitTimeUtc))}</span>` },
  { key: "id",       label: "Request ID", sort: "id", on: true,
    get: t => `<span class="cybsx-cell-id">${esc(t.id)}</span>` },
  { key: "merchantRef", label: "Merchant Ref", on: true,
    get: t => `<span class="cybsx-cell-ref">${esc(t.clientReferenceInformation?.code ?? "—")}</span>` },
  { key: "customer", label: "Customer", on: true,
    get: t => { const b = t.orderInformation?.billTo ?? {};
      return `<div>${esc(b.firstName ?? "")} ${esc(b.lastName ?? "")}</div><div class="cybsx-cell-email">${esc(b.email ?? "")}</div>`; } },
  { key: "card",     label: "Card", on: true,
    get: t => { const c = t.paymentInformation?.card ?? {}; const net = CARD_TYPES[c.type]?.net ?? "CARD";
      return `<span class="cybsx-card-chip"><span class="cybsx-card-net">${esc(net)}</span><span class="cybsx-card-suffix">•••• ${esc(c.suffix ?? "????")}</span></span>`; } },
  { key: "amount",   label: "Amount", sort: "amount", on: true, num: true,
    get: t => esc(fmtMoney(t.orderInformation?.amountDetails?.totalAmount ?? 0, t.orderInformation?.amountDetails?.currency)) },
  { key: "apps",     label: "Applications", on: true,
    get: t => (t.applicationInformation?.applications ?? []).map(a => `<code>${esc(a.name)}</code>`).join(" ") },
  { key: "status",   label: "Status", on: true,
    get: t => { const s = deriveStatus(t); return `<span class="cybsx-badge cybsx-badge--${s}">${esc(STATUSES.find(x => x.value === s)?.label ?? s)}</span>`; } },
  // ---- optional columns (off by default) ----
  { key: "approval", label: "Approval Code", on: false,
    get: t => `<span class="cybsx-cell-ref">${esc(t.processorInformation?.approvalCode || "—")}</span>` },
  { key: "recon",    label: "Reconciliation ID", on: false,
    get: t => `<span class="cybsx-cell-ref">${esc((t.applicationInformation?.applications ?? []).map(a => a.reconciliationId).filter(Boolean)[0] ?? "—")}</span>` },
  { key: "processorCol", label: "Processor", on: false,
    get: t => esc(t.processorInformation?.processor?.name ?? "—") },
  { key: "currency", label: "Currency", on: false,
    get: t => esc(t.orderInformation?.amountDetails?.currency ?? "—") },
  { key: "commerce", label: "Commerce", on: false,
    get: t => esc(t.processingInformation?.commerceIndicatorLabel ?? t.processingInformation?.commerceIndicator ?? "—") },
  { key: "merchantId", label: "Merchant ID", on: false,
    get: t => `<span class="cybsx-cell-ref">${esc(t.merchantId ?? "—")}</span>` },
  { key: "country",  label: "Country", on: false,
    get: t => esc(t.orderInformation?.billTo?.country ?? "—") },
  { key: "clientApp", label: "Client Application", on: false,
    get: t => `<span class="cybsx-cell-ref">${esc(t.clientReferenceInformation?.applicationName ?? "—")}</span>` },
  { key: "reasonCode", label: "Reason Code", on: false,
    get: t => `<span class="cybsx-cell-ref">${esc(t.applicationInformation?.reasonCode ?? "—")}</span>` },
];
