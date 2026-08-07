"use client";

import { Suspense } from "react";

import { FilterToolbar } from "@/components/modules/filter-toolbar";
import { ModuleSearchInput } from "@/components/modules/module-search-input";
import { UrlSelectFilter } from "@/components/modules/url-select-filter";
import type { IdiomFilterOptions, IdiomFilters } from "@/lib/types/module-filters";

type IdiomFilterPanelProps = {
  options: IdiomFilterOptions;
  filters: IdiomFilters;
  count: number;
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    register: string;
    all: string;
    resultCount: string;
    clearFilters: string;
    categoryLabels: Record<string, string>;
    registerLabels: Record<string, string>;
  };
};

function IdiomFilterPanelInner({
  options,
  filters,
  count,
  labels,
}: IdiomFilterPanelProps) {
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
          label={labels.register}
          paramKey="register"
          value={filters.register}
          allLabel={labels.all}
          options={options.registers.map((value) => ({
            value,
            label: labels.registerLabels[value] ?? value,
          }))}
        />
      </div>
      <FilterToolbar
        count={count}
        countLabel={labels.resultCount}
        clearLabel={labels.clearFilters}
        showClear={Boolean(
          filters.category || filters.register || filters.q?.trim()
        )}
        paramKeys={["q", "category", "register"]}
      />
    </div>
  );
}

export function IdiomFilterPanel(props: IdiomFilterPanelProps) {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
      <IdiomFilterPanelInner {...props} />
    </Suspense>
  );
}
