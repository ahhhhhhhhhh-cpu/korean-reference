-- Phase 6D remote synthetic seed verification (read-only)
SELECT 'entries' AS entity, count(*)::int AS total FROM public.entries;
SELECT 'entries_published' AS entity, count(*)::int AS total FROM public.entries WHERE status = 'published';
SELECT 'entries_draft' AS entity, count(*)::int AS total FROM public.entries WHERE status = 'draft';
SELECT 'entries_in_review' AS entity, count(*)::int AS total FROM public.entries WHERE status = 'in_review';
SELECT 'examples' AS entity, count(*)::int AS total FROM public.examples;
SELECT 'sound_change_rules' AS entity, count(*)::int AS total FROM public.sound_change_rules;
SELECT 'conjugation_forms' AS entity, count(*)::int AS total FROM public.conjugation_forms;
SELECT 'conjugation_rules' AS entity, count(*)::int AS total FROM public.conjugation_rules;
SELECT 'conjugation_results' AS entity, count(*)::int AS total FROM public.conjugation_results;
SELECT 'hanja_characters' AS entity, count(*)::int AS total FROM public.hanja_characters;
SELECT 'hanja_terms' AS entity, count(*)::int AS total FROM public.hanja_terms;
SELECT 'idioms' AS entity, count(*)::int AS total FROM public.idioms;
SELECT 'sources' AS entity, count(*)::int AS total FROM public.sources;
