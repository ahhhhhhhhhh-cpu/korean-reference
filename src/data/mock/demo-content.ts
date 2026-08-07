import type { LocalizedRecord } from "@/lib/i18n/locale-fallback";

/** Japanese translation intentionally missing — tests English fallback. */
export const demoFallbackNote: LocalizedRecord<string> = {
  en: "This extended note explains how liaison (연음) works in compound words. It is shown when the Japanese translation is not yet available.",
  zh: "这段扩展说明解释连音（연음）在复合词中的用法。日文翻译尚未完成时将回退显示英文。",
};

/** All locales missing — tests "content in progress" state. */
export const demoMissingNote: LocalizedRecord<string> = {
  en: null,
  zh: null,
  ja: null,
};
