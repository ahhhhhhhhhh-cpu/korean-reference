import { describe, expect, it } from "vitest";

import {
  sanitizeSearchQuery,
  searchResultsHref,
  withPreservedSearchQuery,
} from "@/lib/search/search-query";

describe("sanitizeSearchQuery", () => {
  it("trims and NFC-normalizes", () => {
    expect(sanitizeSearchQuery("  hakgyo  ")).toBe("hakgyo");
  });

  it("returns empty for missing or blank values", () => {
    expect(sanitizeSearchQuery(undefined)).toBe("");
    expect(sanitizeSearchQuery("   ")).toBe("");
    expect(sanitizeSearchQuery(null)).toBe("");
  });

  it("uses the first string when Next.js passes an array", () => {
    expect(sanitizeSearchQuery(["saram", "other"])).toBe("saram");
  });

  it("does not treat a URL-like value as a redirect target", () => {
    expect(sanitizeSearchQuery("https://evil.example/path")).toBe(
      "https://evil.example/path",
    );
    expect(searchResultsHref("https://evil.example/path")).toBe(
      "/search?q=https%3A%2F%2Fevil.example%2Fpath",
    );
  });
});

describe("searchResultsHref", () => {
  it("falls back to /search when there is no query", () => {
    expect(searchResultsHref("")).toBe("/search");
    expect(searchResultsHref(undefined)).toBe("/search");
  });

  it("encodes the query on /search", () => {
    expect(searchResultsHref("hakgyo")).toBe("/search?q=hakgyo");
    expect(searchResultsHref("학 교")).toBe("/search?q=%ED%95%99%20%EA%B5%90");
  });

  it("does not emit duplicate q parameters", () => {
    expect(searchResultsHref("saram")).toBe("/search?q=saram");
    expect(searchResultsHref("saram")).not.toContain("q=saram&q=");
  });
});

describe("withPreservedSearchQuery", () => {
  it("appends q to Entry Detail hrefs", () => {
    expect(withPreservedSearchQuery("/entries/hakgyo", "hakgyo")).toBe(
      "/entries/hakgyo?q=hakgyo",
    );
    expect(withPreservedSearchQuery("/entries/saram", "saram")).toBe(
      "/entries/saram?q=saram",
    );
  });

  it("leaves non-entry hrefs unchanged", () => {
    expect(withPreservedSearchQuery("/hanja/hakgyo-hanja", "hakgyo")).toBe(
      "/hanja/hakgyo-hanja",
    );
    expect(withPreservedSearchQuery("/search?q=hakgyo", "hakgyo")).toBe(
      "/search?q=hakgyo",
    );
  });

  it("rejects protocol-relative and absolute hrefs", () => {
    expect(withPreservedSearchQuery("//evil.example/entries/hakgyo", "hakgyo")).toBe(
      "//evil.example/entries/hakgyo",
    );
    expect(
      withPreservedSearchQuery("https://evil.example/entries/hakgyo", "hakgyo"),
    ).toBe("https://evil.example/entries/hakgyo");
  });

  it("does not duplicate q when already present", () => {
    expect(withPreservedSearchQuery("/entries/hakgyo?q=old", "hakgyo")).toBe(
      "/entries/hakgyo?q=hakgyo",
    );
  });
});
