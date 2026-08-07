"use client";

import { Suspense } from "react";

import { FilterToolbar } from "@/components/modules/filter-toolbar";
import { ModuleSearchInput } from "@/components/modules/module-search-input";
import { UrlSelectFilter } from "@/components/modules/url-select-filter";
import type { SoundChangeFilterOptions, SoundChangeFilters } from "@/lib/types/module-filters";

type SoundChangeFilterPanelProps = {
  options: SoundChangeFilterOptions;
  filters: SoundChangeFilters;
  count: number;
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    difficulty: string;
    all: string;
    resultCount: string;
    clearFilters: string;
    categoryLabels: Record<string, string>;
    difficultyLabels: Record<string, string>;
  };
};

function SoundChangeFilterPanelInner({
  options,
  filters,
  count,
  labels,
}: SoundChangeFilterPanelProps) {
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
          label={labels.category}
          paramKey="category"
          value={filters.category}
          allLabel={labels.all}
          options={options.categories.map((value) => ({
            value,
            label: labels.categoryLabels[value] ?? value,
          }))}
        />
        <UrlSelectFilter
          label={labels.difficulty}
          paramKey="difficulty"
          value={filters.difficulty}
          allLabel={labels.all}
          options={options.difficultyTiers.map((value) => ({
            value,
            label: labels.difficultyLabels[value] ?? value,
          }))}
        />
      </div>
      <FilterToolbar
        count={count}
        countLabel={labels.resultCount}
        clearLabel={labels.clearFilters}
        showClear={Boolean(filters.category || filters.difficulty || filters.q?.trim())}
        paramKeys={["q", "category", "difficulty"]}
      />
    </div>
  );
}

export function SoundChangeFilterPanel(props: SoundChangeFilterPanelProps) {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
      <SoundChangeFilterPanelInner {...props} />
    </Suspense>
  );
}
