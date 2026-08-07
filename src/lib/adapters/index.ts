import { getDataSource } from "@/lib/config/data-source";
import { mockConjugationAdapter } from "@/lib/adapters/mock/conjugation";
import { mockEntriesAdapter } from "@/lib/adapters/mock/entries";
import { mockHanjaAdapter } from "@/lib/adapters/mock/hanja";
import { mockIdiomsAdapter } from "@/lib/adapters/mock/idioms";
import { mockSearchAdapter } from "@/lib/adapters/mock/search";
import { mockSoundChangeAdapter } from "@/lib/adapters/mock/sound-change";
import { supabaseConjugationAdapter } from "@/lib/adapters/supabase/conjugation";
import { supabaseEntriesAdapter } from "@/lib/adapters/supabase/entries";
import { supabaseHanjaAdapter } from "@/lib/adapters/supabase/hanja";
import { supabaseIdiomsAdapter } from "@/lib/adapters/supabase/idioms";
import { supabaseSearchAdapter } from "@/lib/adapters/supabase/search";
import { supabaseSoundChangeAdapter } from "@/lib/adapters/supabase/sound-change";

export function getEntriesAdapter() {
  return getDataSource() === "supabase"
    ? supabaseEntriesAdapter
    : mockEntriesAdapter;
}

export function getSearchAdapter() {
  return getDataSource() === "supabase"
    ? supabaseSearchAdapter
    : mockSearchAdapter;
}

export function getHanjaAdapter() {
  return getDataSource() === "supabase" ? supabaseHanjaAdapter : mockHanjaAdapter;
}

export function getIdiomsAdapter() {
  return getDataSource() === "supabase"
    ? supabaseIdiomsAdapter
    : mockIdiomsAdapter;
}

export function getSoundChangeAdapter() {
  return getDataSource() === "supabase"
    ? supabaseSoundChangeAdapter
    : mockSoundChangeAdapter;
}

export function getConjugationAdapter() {
  return getDataSource() === "supabase"
    ? supabaseConjugationAdapter
    : mockConjugationAdapter;
}
