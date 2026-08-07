"use client";

import { Suspense } from "react";

import { FilterToolbar } from "@/components/modules/filter-toolbar";
import { ModuleSearchInput } from "@/components/modules/module-search-input";
import { UrlSelectFilter } from "@/components/modules/url-select-filter";
import type { HanjaFilterOptions, HanjaFilters } from "@/lib/types/module-filters";

type HanjaFilterPanelProps = {
  options: HanjaFilterOptions;
  filters: HanjaFilters;
  count: number;
  labels: {
    search: string;
    searchPlaceholder: string;
    character: string;
    partOfSpeech: string;
    all: string;
    resultCount: string;
    clearFilters: string;
    posLabels: Record<string, string>;
  };
};

function HanjaFilterPanelInner({
  options,
  filters,
  count,
  labels,
}: HanjaFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <ModuleSearchInput
          key={filters.q ?? ""}
          label={labels.search}
          placeholder={labels.searchPlaceholder}
          defaultValue={filters.q ?? ""}
        />
        <UrlSelectFilter
          label={labels.character}
          paramKey="character"
          value={filters.character}
          allLabel={labels.all}
          options={options.characters.map((value) => ({ value, label: value }))}
        />
        <UrlSelectFilter
          label={labels.partOfSpeech}
          paramKey="partOfSpeech"
          value={filters.partOfSpeech}
          allLabel={labels.all}
          options={options.partsOfSpeech.map((value) => ({
            value,
            label: labels.posLabels[value] ?? value,
          }))}
        />
      </div>
      <FilterToolbar
        count={count}
        countLabel={labels.resultCount}
        clearLabel={labels.clearFilters}
        showClear={Boolean(
          filters.character || filters.partOfSpeech || filters.q?.trim()
        )}
        paramKeys={["q", "character", "partOfSpeech"]}
      />
    </div>
  );
}

export function HanjaFilterPanel(props: HanjaFilterPanelProps) {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
      <HanjaFilterPanelInner {...props} />
    </Suspense>
  );
}
