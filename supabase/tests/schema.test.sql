-- Phase 6B: schema, RLS enablement, grants, and submit_feedback hardening
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- 1. Business table count
select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  39,
  'public schema has 39 business tables'
);

-- 2. Core PK/FK (representative chain)
select col_is_pk('public', 'entries', 'id', 'entries.id is primary key');
select fk_ok(
  'public', 'senses', 'entry_id',
  'public', 'entries', 'id',
  'senses.entry_id references entries'
);
select fk_ok(
  'public', 'entry_examples', 'example_id',
  'public', 'examples', 'id',
  'entry_examples.example_id references examples'
);

-- 3. RLS enabled on all 39 business tables
select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = true
  ),
  39,
  'RLS enabled on all 39 public business tables'
);

-- 4. Key unique / partial unique indexes
select has_index('public', 'entries', 'entries_slug_unique', 'entries slug unique index');
select has_index(
  'public', 'entry_examples', 'entry_examples_unique_without_sense',
  'entry_examples partial unique without sense'
);
select has_index(
  'public', 'entry_examples', 'entry_examples_unique_with_sense',
  'entry_examples partial unique with sense'
);
select has_index(
  'public', 'conjugation_rules', 'conjugation_rules_rule_code_unique',
  'conjugation_rules rule_code unique'
);

-- Extensions and app_private
select ok(
  exists (select 1 from pg_extension where extname = 'pgcrypto'),
  'pgcrypto extension exists'
);
select ok(
  exists (select 1 from pg_extension where extname = 'pg_trgm'),
  'pg_trgm extension exists'
);
select ok(
  exists (select 1 from pg_namespace where nspname = 'app_private'),
  'app_private schema exists'
);

-- 5–6. submit_feedback SECURITY DEFINER + empty search_path
select ok(
  (
    select p.prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_feedback'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) like '%p_target_kind text%'
  ),
  'submit_feedback is SECURITY DEFINER'
);

select ok(
  (
    select 'search_path=""' = any (p.proconfig)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_feedback'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) like '%p_target_kind text%'
  ),
  'submit_feedback search_path is empty'
);

-- 7. anon/authenticated cannot EXECUTE submit_feedback
select ok(
  not has_function_privilege(
    'anon',
    'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'anon cannot EXECUTE submit_feedback'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated cannot EXECUTE submit_feedback'
);

-- 8. anon/authenticated have no feedback table privileges
select ok(
  not has_table_privilege('anon', 'public.feedback', 'SELECT')
  and not has_table_privilege('anon', 'public.feedback', 'INSERT')
  and not has_table_privilege('anon', 'public.feedback', 'UPDATE')
  and not has_table_privilege('anon', 'public.feedback', 'DELETE'),
  'anon has no feedback table privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.feedback', 'SELECT')
  and not has_table_privilege('authenticated', 'public.feedback', 'INSERT')
  and not has_table_privilege('authenticated', 'public.feedback', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.feedback', 'DELETE'),
  'authenticated has no feedback table privileges'
);

-- 9. anon/authenticated SELECT on 38 public content tables (feedback excluded)
select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname <> 'feedback'
      and has_table_privilege('anon', c.oid, 'SELECT')
      and has_table_privilege('authenticated', c.oid, 'SELECT')
  ),
  38,
  'anon and authenticated have SELECT on all 38 public content tables'
);

-- 10. No INSERT/UPDATE/DELETE on formal content for anon/authenticated
select ok(
  not has_table_privilege('anon', 'public.entries', 'INSERT')
  and not has_table_privilege('anon', 'public.entries', 'UPDATE')
  and not has_table_privilege('anon', 'public.entries', 'DELETE')
  and not has_table_privilege('authenticated', 'public.examples', 'INSERT')
  and not has_table_privilege('authenticated', 'public.examples', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.examples', 'DELETE')
  and not has_table_privilege('anon', 'public.hanja_terms', 'INSERT')
  and not has_table_privilege('anon', 'public.sources', 'DELETE'),
  'anon/authenticated lack INSERT/UPDATE/DELETE on formal content tables'
);

-- Validator / trigger presence (smoke)
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'validate_entry_publishable'
  ),
  'validate_entry_publishable exists'
);

select ok(
  (
    select count(*) >= 10
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'trg_mark_feedback_%'
  ),
  'feedback BEFORE DELETE mark triggers exist'
);

select * from finish();
rollback;
