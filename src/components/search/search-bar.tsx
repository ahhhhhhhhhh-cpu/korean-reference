"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { isQuerySuggestable } from "@/lib/search/query-guard";
import { withPreservedSearchQuery } from "@/lib/search/search-query";
import type { SearchMatchReason, SearchModule, SearchSuggestion } from "@/lib/types/search";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 8;

type SearchBarProps = {
  initialQuery?: string;
  autoFocus?: boolean;
  className?: string;
  inputId?: string;
};

type SuggestionsResponse = {
  suggestions: SearchSuggestion[];
};

export function SearchBar({
  initialQuery = "",
  autoFocus = false,
  className,
  inputId,
}: SearchBarProps) {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const generatedId = useId();
  const resolvedInputId = inputId ?? generatedId;
  const listboxId = `${resolvedInputId}-listbox`;

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(
    async (value: string) => {
      if (!isQuerySuggestable(value)) {
        setSuggestions([]);
        closeSuggestions();
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: value,
          locale,
        });
        const response = await fetch(
          `/api/search/suggestions?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as SuggestionsResponse;
        setSuggestions(data.suggestions.slice(0, SUGGESTION_LIMIT));
        setIsOpen(data.suggestions.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [closeSuggestions, locale]
  );

  const scheduleFetch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!isComposingRef.current) {
          void fetchSuggestions(value);
        }
      }, DEBOUNCE_MS);
    },
    [fetchSuggestions]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeSuggestions();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeSuggestions]);

  function navigateToSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    closeSuggestions();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isComposingRef.current) return;

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      closeSuggestions();
      router.push(
        withPreservedSearchQuery(suggestions[activeIndex].href, query)
      );
      return;
    }

    navigateToSearch(query);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);

    if (isComposingRef.current) return;
    scheduleFetch(value);
  }

  function handleCompositionStart() {
    isComposingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function handleCompositionEnd(
    event: React.CompositionEvent<HTMLInputElement>
  ) {
    isComposingRef.current = false;
    const value = event.currentTarget.value;
    scheduleFetch(value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "Escape") closeSuggestions();
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        if (isComposingRef.current) return;
        if (activeIndex >= 0) {
          event.preventDefault();
          closeSuggestions();
          router.push(
            withPreservedSearchQuery(suggestions[activeIndex]!.href, query)
          );
        }
        break;
      case "Escape":
        event.preventDefault();
        closeSuggestions();
        break;
    }
  }

  function moduleLabel(module: SearchModule): string {
    const labels: Record<SearchModule, string> = {
      entries: t("groupEntries"),
      soundChange: t("groupSoundChange"),
      conjugation: t("groupConjugation"),
      hanja: t("groupHanja"),
      idioms: t("groupIdioms"),
    };
    return labels[module];
  }

  function matchLabel(reason: SearchMatchReason): string {
    return t(`match.${reason}`);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={resolvedInputId}
            type="search"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0
                ? `${resolvedInputId}-option-${activeIndex}`
                : undefined
            }
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={tCommon("searchPlaceholder")}
            autoFocus={autoFocus}
            autoComplete="off"
            className="h-11 pl-9 text-base"
          />
        </div>
        <Button type="submit" size="lg" disabled={!query.trim()}>
          {tCommon("search")}
        </Button>
      </form>

      {isOpen && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-popover shadow-md"
        >
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              id={`${resolvedInputId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <Link
                href={withPreservedSearchQuery(item.href, query)}
                onClick={closeSuggestions}
                className={cn(
                  "block px-4 py-3 transition-colors hover:bg-muted/60",
                  index === activeIndex && "bg-muted/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.subtitle ? (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {item.subtitle}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-primary">
                      {matchLabel(item.matchReason)} · {item.matchedText}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {moduleLabel(item.module)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
          {isLoading ? (
            <li className="border-t px-4 py-2 text-xs text-muted-foreground">
              {t("loadingSuggestions")}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
