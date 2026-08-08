-- Phase 7B production verification (single result set)
SELECT check_name, value FROM (
  SELECT 'public_tables' AS check_name, count(*)::int AS value
  FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  UNION ALL
  SELECT 'rls_enabled', count(*)::int
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
  UNION ALL
  SELECT 'app_private_schema', CASE WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app_private') THEN 1 ELSE 0 END
  UNION ALL
  SELECT 'extension_pgcrypto', CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN 1 ELSE 0 END
  UNION ALL
  SELECT 'extension_pg_trgm', CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN 1 ELSE 0 END
  UNION ALL
  SELECT 'trigger_count', count(*)::int
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
  UNION ALL
  SELECT 'policy_count', count(*)::int FROM pg_policies WHERE schemaname = 'public'
  UNION ALL
  SELECT 'validator_functions', count(*)::int
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname LIKE 'validate_%'
  UNION ALL
  SELECT 'entries', count(*)::int FROM public.entries
  UNION ALL
  SELECT 'examples', count(*)::int FROM public.examples
  UNION ALL
  SELECT 'sound_change_rules', count(*)::int FROM public.sound_change_rules
  UNION ALL
  SELECT 'conjugation_results', count(*)::int FROM public.conjugation_results
  UNION ALL
  SELECT 'conjugation_forms', count(*)::int FROM public.conjugation_forms
  UNION ALL
  SELECT 'hanja_characters', count(*)::int FROM public.hanja_characters
  UNION ALL
  SELECT 'idioms', count(*)::int FROM public.idioms
  UNION ALL
  SELECT 'synthetic_test_draft', count(*)::int FROM public.entries WHERE slug = 'test-draft'
  UNION ALL
  SELECT 'synthetic_test_review', count(*)::int FROM public.entries WHERE slug = 'test-review'
  UNION ALL
  SELECT 'synthetic_hakgyo', count(*)::int FROM public.entries WHERE slug = 'hakgyo'
  UNION ALL
  SELECT 'feedback_select_anon', has_table_privilege('anon', 'public.feedback', 'SELECT')::int
  UNION ALL
  SELECT 'feedback_insert_anon', has_table_privilege('anon', 'public.feedback', 'INSERT')::int
  UNION ALL
  SELECT 'feedback_update_anon', has_table_privilege('anon', 'public.feedback', 'UPDATE')::int
  UNION ALL
  SELECT 'feedback_delete_anon', has_table_privilege('anon', 'public.feedback', 'DELETE')::int
  UNION ALL
  SELECT 'feedback_select_authenticated', has_table_privilege('authenticated', 'public.feedback', 'SELECT')::int
  UNION ALL
  SELECT 'feedback_insert_authenticated', has_table_privilege('authenticated', 'public.feedback', 'INSERT')::int
  UNION ALL
  SELECT 'entries_select_anon', has_table_privilege('anon', 'public.entries', 'SELECT')::int
  UNION ALL
  SELECT 'public_content_tables_with_anon_select', count(*)::int
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename <> 'feedback'
    AND has_table_privilege('anon', 'public.' || quote_ident(t.tablename), 'SELECT')
) AS checks
ORDER BY check_name;
