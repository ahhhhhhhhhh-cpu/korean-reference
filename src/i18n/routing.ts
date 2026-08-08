import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/lib/constants/locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  /** Root `/` always redirects to `/en`; ignore Accept-Language and NEXT_LOCALE cookie. */
  localeDetection: false,
});
