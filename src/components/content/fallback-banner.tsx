import { useTranslations } from "next-intl";

export function FallbackBanner() {
  const t = useTranslations("content");

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {t("fallbackToEnglish")}
    </div>
  );
}
