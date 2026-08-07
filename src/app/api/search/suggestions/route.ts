import { NextRequest, NextResponse } from "next/server";

import { isLocale } from "@/lib/constants/locales";
import { getSearchSuggestions } from "@/lib/repositories/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!isLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const suggestions = await getSearchSuggestions(q, localeParam);
  return NextResponse.json({ suggestions });
}
