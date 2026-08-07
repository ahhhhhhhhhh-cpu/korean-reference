import { describe, expect, it, beforeEach } from "vitest";

import { resetMockSearchIndexCache } from "@/lib/adapters/mock/search-index";
import { mockConjugationAdapter } from "@/lib/adapters/mock/conjugation";
import { mockHanjaAdapter } from "@/lib/adapters/mock/hanja";
import { mockIdiomsAdapter } from "@/lib/adapters/mock/idioms";
import { mockSearchAdapter } from "@/lib/adapters/mock/search";
import { mockSoundChangeAdapter } from "@/lib/adapters/mock/sound-change";
import {
  parseConjugationParams,
  parseHanjaParams,
  parseIdiomParams,
  parseSoundChangeParams,
} from "@/lib/url/parse-module-params";

describe("module filters", () => {
  beforeEach(() => {
    resetMockSearchIndexCache();
  });

  it("filters sound change rules by category", () => {
    const results = mockSoundChangeAdapter.filterRules(
      { category: "batchim" },
      "en"
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.category === "batchim")).toBe(true);
  });

  it("returns empty sound change list for impossible filter combo", () => {
    const results = mockSoundChangeAdapter.filterRules(
      { category: "batchim", q: "zzzznotfound" },
      "en"
    );
    expect(results).toHaveLength(0);
  });

  it("generates conjugation options from published data only", () => {
    const options = mockConjugationAdapter.listOptions("en");
    expect(options.entries.length).toBeGreaterThan(0);
    for (const entry of options.entries) {
      expect(options.formsByEntry[entry.slug]?.length).toBeGreaterThan(0);
    }
    expect(options.formsByEntry["draft-sample"]).toBeUndefined();
  });

  it("finds recorded conjugation combination", () => {
    const result = mockConjugationAdapter.findResult(
      { entrySlug: "deutda", form: "present_polite" },
      "en"
    );
    expect(result?.resultKo).toBe("들어요");
  });

  it("returns null for unrecorded conjugation combination", () => {
    const result = mockConjugationAdapter.findResult(
      { entrySlug: "gada", form: "present_polite" },
      "en"
    );
    expect(result).toBeNull();
  });

  it("filters hanja by single character lookup", () => {
    const results = mockHanjaAdapter.searchWithinModule({ character: "人" }, "en");
    expect(results.some((item) => item.hanjaText.includes("人"))).toBe(true);
    expect(results.every((item) => item.slug !== "draft-hanja")).toBe(true);
  });

  it("returns empty hanja results for nonsense query", () => {
    const results = mockHanjaAdapter.searchWithinModule(
      { q: "zzzznotfound" },
      "en"
    );
    expect(results).toHaveLength(0);
  });

  it("filters idioms by category", () => {
    const results = mockIdiomsAdapter.filterIdioms(
      { category: "daily" },
      "en"
    );
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((item) => item.categories.includes("daily"))
    ).toBe(true);
  });

  it("module hanja search does not return other modules", () => {
    const hanja = mockHanjaAdapter.searchWithinModule({ q: "school" }, "en");
    const global = mockSearchAdapter.searchAll("school", "en");
    expect(hanja.length).toBeGreaterThanOrEqual(0);
    expect(global.groups.some((g) => g.module === "entries")).toBe(true);
    expect(hanja.length).toBeLessThanOrEqual(
      global.groups.find((g) => g.module === "hanja")?.count ?? 0
    );
  });

  it("excludes draft and archived from idiom filters", () => {
    const results = mockIdiomsAdapter.filterIdioms({}, "en");
    expect(results.some((item) => item.slug === "draft-idiom")).toBe(false);
    expect(results.some((item) => item.slug === "archived-idiom")).toBe(false);
  });

  it("parses URL params for modules", () => {
    expect(parseSoundChangeParams({ category: "liaison", q: "연" })).toEqual({
      category: "liaison",
      difficulty: undefined,
      q: "연",
    });
    expect(parseHanjaParams({ character: "人" })).toEqual({
      character: "人",
      partOfSpeech: undefined,
      q: undefined,
    });
    expect(parseIdiomParams({ register: "informal" })).toEqual({
      category: undefined,
      register: "informal",
      q: undefined,
    });
    expect(parseConjugationParams({ entry: "gada", form: "past_polite" })).toEqual({
      entrySlug: "gada",
      form: "past_polite",
    });
  });
});

describe("content fallback in module data", () => {
  it("returns localized idiom detail with fallback fields", () => {
    const detail = mockIdiomsAdapter.getBySlug("son-jal-botda", "ja");
    expect(detail).not.toBeNull();
    expect(detail!.actualMeaning.requestedLocale).toBe("ja");
  });
});
