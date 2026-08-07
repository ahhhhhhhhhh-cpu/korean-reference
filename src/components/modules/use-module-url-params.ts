"use client";

import { useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

export function useModuleUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      replaceParams((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [replaceParams]
  );

  const clearParams = useCallback(
    (keys?: string[]) => {
      replaceParams((params) => {
        if (keys) {
          keys.forEach((key) => params.delete(key));
        } else {
          [...params.keys()].forEach((key) => params.delete(key));
        }
      });
    },
    [replaceParams]
  );

  return { setParam, clearParams, replaceParams, isPending, searchParams };
}
