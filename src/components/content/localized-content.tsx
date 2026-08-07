import type { LocalizedContent } from "@/lib/types/common";
import type { LocalizedRecord } from "@/lib/i18n/locale-fallback";
import { localize } from "@/lib/i18n/localize";

import { LocalizedText } from "./localized-text";

type LocalizedContentProps = {
  locale: import("@/lib/constants/locales").Locale;
  translations: LocalizedRecord<string>;
  inProgressLabel: string;
};

/** @deprecated Prefer LocalizedText with pre-resolved LocalizedContent from repositories. */
export function LocalizedContentBlock({
  locale,
  translations,
  inProgressLabel,
}: LocalizedContentProps) {
  const content = localize(translations, locale);
  return <LocalizedText content={content} inProgressLabel={inProgressLabel} />;
}

export { LocalizedText };
export type { LocalizedContent };
