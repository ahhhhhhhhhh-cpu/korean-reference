-- Phase 7C-3B remote dev verification (read-only)
SELECT check_name, value FROM (
  SELECT 'migration_count' AS check_name, count(*)::int AS value
  FROM supabase_migrations.schema_migrations
  UNION ALL
  SELECT 'conjugation_forms_count', count(*)::int FROM public.conjugation_forms
  UNION ALL
  SELECT 'conjugation_forms_published', count(*)::int
  FROM public.conjugation_forms WHERE status = 'published'
  UNION ALL
  SELECT 'conjugation_form_translations_published', count(*)::int
  FROM public.conjugation_form_translations WHERE status = 'published'
  UNION ALL
  SELECT 'entries_published', count(*)::int FROM public.entries WHERE status = 'published'
  UNION ALL
  SELECT 'entries_draft_test_draft', count(*)::int FROM public.entries WHERE slug = 'test-draft'
  UNION ALL
  SELECT 'entries_in_review_test_review', count(*)::int FROM public.entries WHERE slug = 'test-review'
  UNION ALL
  SELECT 'entries_irregular_eu_remaining', count(*)::int FROM public.entries WHERE irregular_type = 'ㅡ'
  UNION ALL
  SELECT 'entries_irregular_rieul_remaining', count(*)::int FROM public.entries WHERE irregular_type = 'ㄹ'
  UNION ALL
  SELECT 'entries_hada_yeo', count(*)::int FROM public.entries
  WHERE (headword ~ '하다$' OR headword_normalized ~ '하다$') AND irregular_type = '여'
) AS checks
ORDER BY check_name;

SELECT code, status, sort_order FROM public.conjugation_forms ORDER BY sort_order;

SELECT f.code, t.locale, t.name, t.status
FROM public.conjugation_form_translations t
JOIN public.conjugation_forms f ON f.id = t.form_id
ORDER BY f.sort_order, t.locale;
