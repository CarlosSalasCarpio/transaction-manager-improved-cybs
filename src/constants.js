/* ============================================================
   Reference data & configuration (no logic, no DOM)
   ============================================================ */

export const PLUGIN_OFF_KEY = "cybsx_disabled";

export const CONFIG = { rootId: "cybs-evolved-root", currencyLocale: "en-US" };

export const CARD_TYPES = {
  "001": { label: "Visa", net: "VISA" },
  "002": { label: "Mastercard", net: "MC" },
  "003": { label: "Amex", net: "AMEX" },
  "004": { label: "Discover", net: "DISC" },
};

export const APPLICATIONS = [
  { value: "ics_auth", label: "Authorization" },
  { value: "ics_bill", label: "Settlement" },
  { value: "ics_credit", label: "Credit / Refund" },
  { value: "ics_auth_reversal", label: "Auth Reversal" },
  { value: "tms_token_create", label: "Token Create" },
];

export const STATUSES = [
  { value: "settled", label: "Settled" },
  { value: "authorized", label: "Authorized" },
  { value: "pending", label: "Pending Settlement" },
  { value: "declined", label: "Declined" },
];

export const DATE_PRESETS = [
  { value: "[NOW/HOUR-1HOUR TO NOW/HOUR}", label: "Last hour" },
  { value: "[NOW/DAY TO NOW/DAY+1DAY}", label: "Today" },
  { value: "[NOW/DAY-1DAY TO NOW/DAY}", label: "Yesterday" },
  { value: "[NOW/DAY-7DAYS TO NOW/DAY+1DAY}", label: "Last 7 days" },
  { value: "[NOW/MONTH TO NOW/DAY+1DAY}", label: "Month to date" },
  { value: "[NOW/DAY-6MONTHS TO NOW/DAY+1DAY}", label: "Last 6 months" },
  { value: "custom", label: "Custom range…" },
];

export const QUICK_PILLS = [
  { id: "allSuccess", label: "All Success", apply: f => { f.statuses = ["settled", "authorized", "pending"]; } },
  { id: "highValue",  label: "High Value > $5k", apply: f => { f.amountMin = 5000; } },
  { id: "declined",   label: "Declined", apply: f => { f.statuses = ["declined"]; } },
  { id: "visaOnly",   label: "Visa Only", apply: f => { f.cardTypes = ["001"]; } },
  { id: "settledToday", label: "Settled Today", apply: f => { f.statuses = ["settled"]; f.datePreset = "[NOW/DAY TO NOW/DAY+1DAY}"; } },
];

export const AMOUNT_SLIDER_MAX = 10000;

/* --- The 38 optional EBC search fields ---------------------
   key:   internal id
   label: as shown in EBC
   tss:   TSS query field (for buildTssQuery)
   type:  "text" | "select"
   options: for selects
----------------------------------------------------------- */
export const SEARCH_FIELDS = [
  { key: "merchantRef",    label: "Merchant Reference Number", tss: "clientReferenceInformation.code" },
  { key: "requestId",      label: "Request ID", tss: "id" },
  { key: "tokenId",        label: "Token ID", tss: "paymentInformation.customer.customerId" },
  { key: "txnRefNum",      label: "Transaction Reference Number", tss: "applicationInformation.applications.reconciliationId" },
  { key: "application",    label: "Application", tss: "applicationInformation.applications.name" },
  { key: "email",          label: "Email Address", tss: "orderInformation.billTo.email" },
  { key: "firstName",      label: "First Name", tss: "orderInformation.billTo.firstName" },
  { key: "lastName",       label: "Last Name", tss: "orderInformation.billTo.lastName" },
  { key: "acctSuffix",     label: "Account Suffix", tss: "paymentInformation.card.suffix" },
  { key: "acctPrefix",     label: "Account Prefix", tss: "paymentInformation.card.prefix" },
  { key: "acctNumber",     label: "Account Number", tss: "paymentInformation.card.number" },
  { key: "billPhone",      label: "Billing Phone Number", tss: "orderInformation.billTo.phoneNumber" },
  { key: "shipPhone",      label: "Shipping Phone Number", tss: "orderInformation.shipTo.phoneNumber" },
  { key: "billAddr1",      label: "Billing Address1 (Exact Match)", tss: "orderInformation.billTo.address1" },
  { key: "shipAddr1",      label: "Shipping Address1 (Exact Match)", tss: "orderInformation.shipTo.address1" },
  { key: "deviceId",       label: "Device ID", tss: "deviceInformation.ipAddress" },
  { key: "customerId",     label: "Customer ID", tss: "buyerInformation.merchantCustomerId" },
  { key: "reply",          label: "Reply", tss: "applicationInformation.applications.reasonCode" },
  { key: "paymentCategory",label: "Payment Category", tss: "paymentInformation.paymentType.type" },
  { key: "paymentSolution",label: "Payment Solution", tss: "paymentInformation.paymentType.method" },
  { key: "clientApp",      label: "Client Application", tss: "clientReferenceInformation.applicationName" },
  { key: "partnerOrigTxn", label: "Partner Original Transaction ID", tss: "clientReferenceInformation.partner.originalTransactionId" },
  { key: "terminalSerial", label: "Terminal Serial Number", tss: "pointOfSaleInformation.terminalSerialNumber" },
  { key: "businessAppId",  label: "Business Application ID", tss: "processingInformation.businessApplicationId" },
  { key: "terminalId",     label: "Terminal ID", tss: "pointOfSaleInformation.terminalId" },
  { key: "xid",            label: "XID", tss: "consumerAuthenticationInformation.xid" },
  { key: "paTxnId",        label: "PA Transaction ID", tss: "consumerAuthenticationInformation.authenticationTransactionId" },
  { key: "providerTxnId",  label: "Provider Transaction Id", tss: "processorInformation.providerTransactionId" },
  { key: "salesSlip",      label: "Sales Slip Number", tss: "processorInformation.salesSlipNumber" },
  { key: "authCode",       label: "Authorization Code", tss: "processorInformation.approvalCode" },
  { key: "jccaTerminal",   label: "JCCA Terminal Id", tss: "processorInformation.jccaTerminalId" },
  { key: "acquirerAcctId", label: "Acquirer Account ID", tss: "processorInformation.acquirerMerchantId" },
  { key: "retrievalRef",   label: "Retrieval Reference Number", tss: "processorInformation.retrievalReferenceNumber" },
  { key: "installmentId",  label: "Installment Identifier", tss: "installmentInformation.identifier" },
  { key: "partnerSolution",label: "Partner Solution ID", tss: "clientReferenceInformation.partner.solutionId" },
  { key: "commerceInd",    label: "Commerce Indicator", tss: "processingInformation.commerceIndicator" },
  { key: "reason",         label: "Reason", tss: "applicationInformation.reasonCode" },
  { key: "status",         label: "Status", tss: "processorInformation.eventStatus", type: "select",
    options: ["Settled", "Authorized", "Pending", "Declined", "Voided", "Reversed"] },
  { key: "processor",      label: "Processor", tss: "processorInformation.processor.name", type: "select",
    options: ["gpn", "vpc", "smartpay", "barclays", "chase_paymentech"] },
];

export const FIELD_BY_KEY = Object.fromEntries(SEARCH_FIELDS.map(f => [f.key, f]));

/* TSS path -> field, used to map payload leaves to search fields */
export const TSS_TO_FIELD = Object.fromEntries(SEARCH_FIELDS.map(f => [f.tss, f]));
