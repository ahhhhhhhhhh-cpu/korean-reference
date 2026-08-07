import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/lib/constants/locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
