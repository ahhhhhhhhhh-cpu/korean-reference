-- Phase 6D remote schema verification (read-only)
SELECT 'public_tables' AS check_name, count(*)::int AS value
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%';

SELECT 'rls_enabled' AS check_name, count(*)::int AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true;

SELECT 'app_private_schema' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app_private') THEN 1 ELSE 0 END AS value;

SELECT 'extension_pgcrypto' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN 1 ELSE 0 END AS value;

SELECT 'extension_pg_trgm' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN 1 ELSE 0 END AS value;

SELECT 'submit_feedback_execute_anon' AS check_name,
  has_function_privilege('anon', 'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure, 'EXECUTE')::int AS value;
SELECT 'submit_feedback_execute_authenticated' AS check_name,
  has_function_privilege('authenticated', 'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure, 'EXECUTE')::int AS value;

SELECT 'feedback_select_anon' AS check_name, has_table_privilege('anon', 'public.feedback', 'SELECT')::int AS value;
SELECT 'feedback_insert_anon' AS check_name, has_table_privilege('anon', 'public.feedback', 'INSERT')::int AS value;
