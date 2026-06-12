/* ============================================================
   Live data access — POST /ebc2/tss/v2/searches
   Uses the logged-in EBC2 session (cookies) the same way the
   native page does. The public contract is documented at
   developer.cybersource.com (Transaction Search API); the EBC2
   endpoint is the same-origin proxy in front of it.
   ============================================================ */

import { getTssQuery } from "./query.js";
import { state } from "./state.js";

const SEARCH_PATH = "/ebc2/tss/v2/searches";
const PAGE_LIMIT = 200;

/* The EBC2 origin to call. Prefer the page we're running on so the
   session cookies match; fall back to the test host for dev. */
function searchUrl() {
  const origin = (typeof location !== "undefined" && location.origin && location.origin.includes("cybersource"))
    ? location.origin : "https://ebc2test.cybersource.com";
  return origin + SEARCH_PATH;
}

/* Angular/Spring backends echo a CSRF cookie that must be sent back
   as a header. Pick up the common names if present. */
function csrfHeaders() {
  const headers = {};
  const jar = Object.fromEntries(
    document.cookie.split(";").map(c => c.trim().split("=").map(decodeURIComponent)).filter(p => p[0])
  );
  if (jar["XSRF-TOKEN"]) headers["X-XSRF-TOKEN"] = jar["XSRF-TOKEN"];
  else if (jar["CSRF-TOKEN"]) headers["X-CSRF-TOKEN"] = jar["CSRF-TOKEN"];
  return headers;
}

function sortParam() {
  const dir = state.sort.dir === "asc" ? "asc" : "desc";
  const field = state.sort.key === "amount" ? "orderInformation.amountDetails.totalAmount"
    : state.sort.key === "id" ? "id"
    : "submitTimeUtc";
  return `${field}:${dir}`;
}

function extractSummaries(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data._embedded?.transactionSummaries
    ?? data.transactionSummaries
    ?? data.summaries
    ?? [];
}

/* Fetch a page of transactions for the current query. Resolves with
   an array; rejects with an Error whose message is user-presentable. */
export async function searchTransactions() {
  const body = {
    save: false,
    name: "Evolved TM search",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    query: getTssQuery(),
    offset: 0,
    limit: PAGE_LIMIT,
    sort: sortParam(),
  };

  let res;
  try {
    res = await fetch(searchUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json",
        ...csrfHeaders(),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Network error contacting ${SEARCH_PATH} (${err.message})`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Search request failed: ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ""}`);
  }

  const data = await res.json().catch(() => null);
  return extractSummaries(data);
}
