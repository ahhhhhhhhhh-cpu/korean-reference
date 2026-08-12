const MAX_SEARCH_QUERY_LENGTH = 200;
const ENTRY_PATH_RE = /^\/entries\/[^/]+$/;

function firstString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

/** Trim, NFC-normalize, and bound a user search query. Never treat it as a URL. */
export function sanitizeSearchQuery(raw: unknown): string {
  const query = firstString(raw)
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

  if (!query) return "";
  return query.length > MAX_SEARCH_QUERY_LENGTH
    ? query.slice(0, MAX_SEARCH_QUERY_LENGTH).trim()
    : query;
}

function isSafeInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.includes("://");
}

function isEntryDetailPath(pathname: string): boolean {
  return ENTRY_PATH_RE.test(pathname);
}

/** `/search` or `/search?q=…` for the current locale-aware Link href. */
export function searchResultsHref(query: unknown): string {
  const q = sanitizeSearchQuery(query);
  if (!q) return "/search";
  return `/search?q=${encodeURIComponent(q)}`;
}

/**
 * Append a preserved `q` only onto internal Entry Detail paths.
 * Other hrefs (Hanja, idioms, search itself) are left unchanged.
 */
export function withPreservedSearchQuery(href: string, query: unknown): string {
  const q = sanitizeSearchQuery(query);
  if (!q || !isSafeInternalPath(href)) return href;

  const url = new URL(href, "https://korean-reference.invalid");
  if (!isEntryDetailPath(url.pathname)) return href;

  url.searchParams.set("q", q);
  return `${url.pathname}${url.search}`;
}
