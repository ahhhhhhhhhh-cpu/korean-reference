import { describe, expect, it } from "vitest";

import {
  IRREGULAR_TYPES,
  isIrregularType,
} from "@/lib/constants/irregular-type";

describe("irregular_type taxonomy (Phase 7C-3A)", () => {
  it("lists the eight canonical irregular types", () => {
    expect(IRREGULAR_TYPES).toEqual([
      "ㄷ",
      "ㅂ",
      "ㅅ",
      "ㅎ",
      "르",
      "러",
      "여",
      "우",
    ]);
  });

  it("accepts all canonical irregular types", () => {
    for (const type of IRREGULAR_TYPES) {
      expect(isIrregularType(type)).toBe(true);
    }
  });

  it("rejects deprecated ㅡ and ㄹ as irregular metadata", () => {
    expect(isIrregularType("ㅡ")).toBe(false);
    expect(isIrregularType("ㄹ")).toBe(false);
  });

  it("does not treat ㅡ deletion or ㄹ deletion as irregular_type values", () => {
    expect(IRREGULAR_TYPES).not.toContain("ㅡ");
    expect(IRREGULAR_TYPES).not.toContain("ㄹ");
  });
});
