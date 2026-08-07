import type { LocalizedContent } from "@/lib/types/common";

import { FallbackBanner } from "./fallback-banner";

type LocalizedTextProps = {
  content: LocalizedContent<string | null>;
  inProgressLabel: string;
  className?: string;
};

export function LocalizedText({
  content,
  inProgressLabel,
  className,
}: LocalizedTextProps) {
  if (!content.value) {
    return (
      <p className={`text-sm italic text-muted-foreground ${className ?? ""}`}>
        {inProgressLabel}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {content.usedFallback ? <FallbackBanner /> : null}
      <p className="text-sm leading-relaxed text-foreground">{content.value}</p>
    </div>
  );
}
