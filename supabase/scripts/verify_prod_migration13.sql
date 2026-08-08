-- Phase 7C-4B-1R-A4 Production pre/post verification
SELECT check_name, value, detail FROM (
  SELECT 'entries' AS check_name, count(*)::int AS value, NULL::text AS detail FROM public.entries
  UNION ALL SELECT 'examples', count(*)::int, NULL FROM public.examples
  UNION ALL SELECT 'sound_change_rules', count(*)::int, NULL FROM public.sound_change_rules
  UNION ALL SELECT 'conjugation_results', count(*)::int, NULL FROM public.conjugation_results
  UNION ALL SELECT 'hanja_characters', count(*)::int, NULL FROM public.hanja_characters
  UNION ALL SELECT 'hanja_terms', count(*)::int, NULL FROM public.hanja_terms
  UNION ALL SELECT 'idioms', count(*)::int, NULL FROM public.idioms
  UNION ALL SELECT 'conjugation_forms', count(*)::int, NULL FROM public.conjugation_forms
  UNION ALL SELECT 'synthetic_test_draft', count(*)::int, NULL FROM public.entries WHERE slug = 'test-draft'
  UNION ALL SELECT 'synthetic_test_review', count(*)::int, NULL FROM public.entries WHERE slug = 'test-review'
  UNION ALL SELECT 'synthetic_hakgyo', count(*)::int, NULL FROM public.entries WHERE slug = 'hakgyo'
  UNION ALL SELECT 'formal_sigan_time', count(*)::int, NULL FROM public.entries WHERE slug IN ('sigan-time', 'entry-sigan-time')
  UNION ALL SELECT 'formal_sigan_hour', count(*)::int, NULL FROM public.entries WHERE slug IN ('sigan-hour', 'entry-sigan-hour')
  UNION ALL SELECT 'pos_constraint', 1,
    pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'entries' AND c.conname = 'entries_part_of_speech_check'
) AS checks
ORDER BY check_name;
