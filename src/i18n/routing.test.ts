import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";

describe("routing", () => {
  it("defaults to English and disables automatic locale detection", () => {
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localeDetection).toBe(false);
  });
});
