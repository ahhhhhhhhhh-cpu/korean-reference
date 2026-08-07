"use client";

import { Button } from "@/components/ui/button";
import { useModuleUrlParams } from "@/components/modules/use-module-url-params";

type FilterToolbarProps = {
  count: number;
  countLabel: string;
  clearLabel: string;
  showClear: boolean;
  paramKeys?: string[];
};

export function FilterToolbar({
  count,
  countLabel,
  clearLabel,
  showClear,
  paramKeys,
}: FilterToolbarProps) {
  const { clearParams, isPending } = useModuleUrlParams();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {countLabel.replace("{count}", String(count))}
      </p>
      {showClear ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => clearParams(paramKeys)}
        >
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
