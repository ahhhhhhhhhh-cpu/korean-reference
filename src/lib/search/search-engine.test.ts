import { describe, expect, it, beforeEach } from "vitest";

import {
  buildMockSearchIndex,
  resetMockSearchIndexCache,
} from "@/lib/adapters/mock/search-index";
import { mockSearchAdapter } from "@/lib/adapters/mock/search";
import { isQuerySearchable } from "@/lib/search/query-guard";
import { scoreForReason } from "@/lib/search/scoring";
import { searchDocuments } from "@/lib/search/matcher";

describe("query guard", () => {
  it("rejects empty query", () => {
    expect(isQuerySearchable("")).toBe(false);
    expect(isQuerySearchable("   ")).toBe(false);
  });

  it("allows Korean from one character", () => {
    expect(isQuerySearchable("듣")).toBe(true);
  });

  it("requires two characters for Latin", () => {
    expect(isQuerySearchable("l")).toBe(false);
    expect(isQuerySearchable("li")).toBe(true);
  });
});

describe("search engine", () => {
  beforeEach(() => {
    resetMockSearchIndexCache();
  });

  it("matches Korean headword exactly", () => {
    const results = mockSearchAdapter.searchEntries("듣다", "en");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.title).toBe("듣다");
    expect(results[0]?.matches[0]?.reason).toBe("headword_exact");
  });

  it("matches Chinese definition in zh locale", () => {
    const results = mockSearchAdapter.searchEntries("听", "zh");
    expect(results.some((item) => item.title === "듣다")).toBe(true);
    expect(
      results.find((item) => item.title === "듣다")?.matches[0]?.reason
    ).toMatch(/definition_/);
  });

  it("matches Japanese definition", () => {
    const results = mockSearchAdapter.searchEntries("聞く", "ja");
    expect(results.some((item) => item.title === "듣다")).toBe(true);
  });

  it("matches Hanja exactly", () => {
    const hanjaResults = mockSearchAdapter.searchHanja("學校", "en");
    expect(hanjaResults.some((item) => item.title.includes("學校"))).toBe(true);
    expect(hanjaResults[0]?.matches[0]?.reason).toBe("hanja_exact");
  });

  it("matches conjugated form to entry conjugation", () => {
    const results = mockSearchAdapter.searchConjugations("들어요", "en");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.matches[0]?.reason).toBe("conjugated_form_exact");
    expect(results[0]?.title).toContain("듣다");
  });

  it("excludes draft and archived entries", () => {
    const draft = mockSearchAdapter.searchEntries("draft-sample", "en");
    const archived = mockSearchAdapter.searchEntries("archived-sample", "en");
    const draftKo = mockSearchAdapter.searchEntries("초안단어", "en");
    expect(draft).toHaveLength(0);
    expect(archived).toHaveLength(0);
    expect(draftKo).toHaveLength(0);
  });

  it("returns empty for non-searchable short Latin query", () => {
    const results = mockSearchAdapter.searchAll("a", "en");
    expect(results.totalCount).toBe(0);
    expect(results.groups).toHaveLength(0);
  });

  it("returns empty groups for nonsense query", () => {
    const results = mockSearchAdapter.searchAll("zzzznotfound123", "en");
    expect(results.totalCount).toBe(0);
  });

  it("ranks headword exact match above partial definition match", () => {
    const documents = buildMockSearchIndex();
    const items = searchDocuments(documents, "가다", "en");
    const gada = items.find((item) => item.title === "가다");
    const others = items.filter((item) => item.title !== "가다");

    expect(gada).toBeDefined();
    expect(gada!.score).toBe(scoreForReason("headword_exact"));
    for (const item of others) {
      expect(gada!.score).toBeGreaterThanOrEqual(item.score);
    }
  });

  it("prefers current-locale definition match over other locale", () => {
    const documents = buildMockSearchIndex();
    const enItems = searchDocuments(documents, "friend", "en");
    const zhItems = searchDocuments(documents, "friend", "zh");

    const enMatch = enItems.find((item) => item.title === "친구");
    expect(enMatch?.matches[0]?.reason).toBe("definition_current_exact");

    const zhMatch = zhItems.find((item) => item.title === "친구");
    expect(zhMatch?.matches[0]?.reason).toBe("definition_other_exact");
  });

  it("returns at most 8 suggestions", () => {
    const suggestions = mockSearchAdapter.getSuggestions("다", "en", 8);
    expect(suggestions.length).toBeLessThanOrEqual(8);
  });

  it("groups cross-module search results", () => {
    const results = mockSearchAdapter.searchAll("학", "en");
    expect(results.totalCount).toBeGreaterThan(0);
    expect(results.groups.length).toBeGreaterThan(0);
  });
});

describe("romanization search", () => {
  beforeEach(() => {
    resetMockSearchIndexCache();
  });

  it("matches primary romanization exactly", () => {
    const results = mockSearchAdapter.searchEntries("deutda", "en");
    expect(results.some((item) => item.title === "듣다")).toBe(true);
    expect(
      results.find((item) => item.title === "듣다")?.matches[0]?.reason
    ).toBe("romanization_exact");
  });

  it("is case insensitive", () => {
    const results = mockSearchAdapter.searchEntries("MEOKDA", "en");
    expect(results.some((item) => item.title === "먹다")).toBe(true);
  });

  it("normalizes hyphens and spaces in query", () => {
    const hyphen = mockSearchAdapter.searchEntries("hak-gyo", "en");
    const spaced = mockSearchAdapter.searchEntries("sa ram", "en");
    expect(hyphen.some((item) => item.title === "학교")).toBe(true);
    expect(spaced.some((item) => item.title === "사람")).toBe(true);
  });

  it("matches audited romanization alias", () => {
    const results = mockSearchAdapter.searchEntries("deudda", "en");
    expect(results.some((item) => item.title === "듣다")).toBe(true);
    expect(
      results.find((item) => item.title === "듣다")?.matches[0]?.reason
    ).toBe("romanization_alias_exact");
  });

  it("includes romanization in autocomplete suggestions", () => {
    const suggestions = mockSearchAdapter.getSuggestions("meok", "en");
    expect(suggestions.some((item) => item.title === "먹다")).toBe(true);
  });

  it("excludes draft and archived romanization values", () => {
    expect(mockSearchAdapter.searchEntries("choan", "en")).toHaveLength(0);
    expect(mockSearchAdapter.searchEntries("draft-romanization", "en")).toHaveLength(
      0
    );
    expect(mockSearchAdapter.searchHanja("cho-an", "en")).toHaveLength(0);
  });

  it("ranks headword exact above romanization exact", () => {
    const documents = buildMockSearchIndex();
    const items = searchDocuments(documents, "deutda", "en");
    const byHeadword = items.find((item) => item.title === "듣다");
    expect(byHeadword?.matches[0]?.reason).toBe("romanization_exact");

    const headwordItems = searchDocuments(documents, "듣다", "en");
    const headword = headwordItems.find((item) => item.title === "듣다");
    expect(headword!.score).toBeGreaterThan(byHeadword!.score);
  });

  it("ranks romanization exact above definition partial", () => {
    const documents = buildMockSearchIndex();
    const romanizationItems = searchDocuments(documents, "deutda", "en");
    const deutda = romanizationItems.find((item) => item.title === "듣다");
    expect(deutda!.score).toBeGreaterThan(
      scoreForReason("definition_current_partial")
    );
  });
});
