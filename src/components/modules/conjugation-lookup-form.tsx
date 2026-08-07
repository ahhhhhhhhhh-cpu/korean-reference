"use client";

import type { ConjugationFormKey } from "@/lib/types/conjugation";
import type { ConjugationModuleOptions } from "@/lib/types/module-filters";
import { Button } from "@/components/ui/button";
import { useModuleUrlParams } from "@/components/modules/use-module-url-params";
import { cn } from "@/lib/utils";

type ConjugationLookupFormProps = {
  options: ConjugationModuleOptions;
  selectedEntry?: string;
  selectedForm?: ConjugationFormKey;
  labels: {
    entry: string;
    form: string;
    allEntries: string;
    allForms: string;
    reset: string;
    formLabels: Record<ConjugationFormKey, string>;
  };
};

export function ConjugationLookupForm({
  options,
  selectedEntry,
  selectedForm,
  labels,
}: ConjugationLookupFormProps) {
  const { setParam, clearParams, replaceParams, isPending } = useModuleUrlParams();
  const forms = selectedEntry ? options.formsByEntry[selectedEntry] ?? [] : [];

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="conj-entry" className="mb-1.5 block text-sm font-medium">
            {labels.entry}
          </label>
          <select
            id="conj-entry"
            value={selectedEntry ?? ""}
            disabled={isPending}
            onChange={(event) => {
              const entry = event.target.value;
              replaceParams((params) => {
                if (entry) params.set("entry", entry);
                else params.delete("entry");
                params.delete("form");
              });
            }}
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <option value="">{labels.allEntries}</option>
            {options.entries.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.headwordKo}
                {entry.romanization ? ` (${entry.romanization})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="conj-form" className="mb-1.5 block text-sm font-medium">
            {labels.form}
          </label>
          <select
            id="conj-form"
            value={selectedForm ?? ""}
            disabled={isPending || !selectedEntry || forms.length === 0}
            onChange={(event) =>
              setParam("form", event.target.value || null)
            }
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              (!selectedEntry || forms.length === 0) && "opacity-60"
            )}
          >
            <option value="">{labels.allForms}</option>
            {forms.map((form) => (
              <option key={form.targetForm} value={form.targetForm}>
                {labels.formLabels[form.targetForm]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => clearParams(["entry", "form"])}
      >
        {labels.reset}
      </Button>
    </div>
  );
}
