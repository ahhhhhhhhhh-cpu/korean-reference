"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { useModuleUrlParams } from "@/components/modules/use-module-url-params";

type ModuleSearchInputProps = {
  label: string;
  placeholder: string;
  defaultValue?: string;
  paramKey?: string;
};

export function ModuleSearchInput({
  label,
  placeholder,
  defaultValue = "",
  paramKey = "q",
}: ModuleSearchInputProps) {
  const { setParam, isPending } = useModuleUrlParams();
  const [value, setValue] = useState(defaultValue);

  function commit(next: string) {
    setParam(paramKey, next.trim() || null);
  }

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={`module-search-${paramKey}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={`module-search-${paramKey}`}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(value);
          }
        }}
        onBlur={() => commit(value)}
        placeholder={placeholder}
        aria-busy={isPending}
        className="h-10"
      />
    </div>
  );
}
