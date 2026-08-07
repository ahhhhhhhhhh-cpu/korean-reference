"use client";

import { useModuleUrlParams } from "@/components/modules/use-module-url-params";
import { cn } from "@/lib/utils";

type UrlSelectFilterProps = {
  label: string;
  paramKey: string;
  value?: string;
  options: { value: string; label: string }[];
  allLabel: string;
};

export function UrlSelectFilter({
  label,
  paramKey,
  value,
  options,
  allLabel,
}: UrlSelectFilterProps) {
  const { setParam, isPending } = useModuleUrlParams();

  return (
    <div className="min-w-0">
      <label htmlFor={`filter-${paramKey}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={`filter-${paramKey}`}
        value={value ?? ""}
        disabled={isPending}
        onChange={(event) =>
          setParam(paramKey, event.target.value || null)
        }
        className={cn(
          "h-10 w-full min-w-[8rem] rounded-md border border-input bg-background px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
