import { describe, expect, it } from "vitest";

import {
  PARTS_OF_SPEECH,
  isPartOfSpeech,
} from "@/lib/constants/part-of-speech";

describe("part_of_speech taxonomy (Phase 7C-4B-1R-A2)", () => {
  it("includes bound_noun in the canonical list", () => {
    expect(PARTS_OF_SPEECH).toContain("bound_noun");
  });

  it("accepts bound_noun and existing canonical values", () => {
    expect(isPartOfSpeech("bound_noun")).toBe(true);
    expect(isPartOfSpeech("noun")).toBe(true);
    expect(isPartOfSpeech("verb")).toBe(true);
    expect(isPartOfSpeech("adjective")).toBe(true);
  });

  it("rejects invalid part_of_speech values", () => {
    expect(isPartOfSpeech("interjection")).toBe(false);
    expect(isPartOfSpeech("bound noun")).toBe(false);
  });
});
