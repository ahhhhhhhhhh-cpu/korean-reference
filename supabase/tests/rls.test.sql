-- Phase 6B: RLS read policies for anon role
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

create temp table rls_fixture on commit drop as
select
  gen_random_uuid() as pub_entry_id,
  gen_random_uuid() as draft_entry_id,
  gen_random_uuid() as review_entry_id,
  gen_random_uuid() as archived_entry_id,
  gen_random_uuid() as pub_sense_id,
  (select id from public.conjugation_forms where code = 'present_polite' limit 1) as conj_form_id,
  gen_random_uuid() as conj_rule_id,
  gen_random_uuid() as conj_result_id,
  gen_random_uuid() as conj_step_id,
  gen_random_uuid() as hanja_char_id,
  gen_random_uuid() as hanja_reading_id,
  gen_random_uuid() as hanja_term_id,
  gen_random_uuid() as hanja_slot_id,
  gen_random_uuid() as pub_source_id,
  gen_random_uuid() as private_source_id;

-- Entries (draft first, publish after sense chain)
insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select pub_entry_id, 'pub-entry', '공개', '공개', 'noun', 'draft' from rls_fixture;

insert into public.senses (id, entry_id, sense_order, is_primary, status)
select pub_sense_id, pub_entry_id, 1, true, 'published' from rls_fixture;

insert into public.sense_translations (sense_id, locale, short_definition, status)
select pub_sense_id, 'en', 'public', 'published' from rls_fixture;

update public.entries set status = 'published'
where id = (select pub_entry_id from rls_fixture);

insert into public.entry_aliases (entry_id, alias_type, alias, alias_normalized, status)
select pub_entry_id, 'common_variant', '공개별', '공개별', 'published' from rls_fixture;

insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select draft_entry_id, 'draft-entry', '초안', '초안', 'noun', 'draft' from rls_fixture;

insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select review_entry_id, 'review-entry', '검토', '검토', 'noun', 'in_review' from rls_fixture;

insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select archived_entry_id, 'archived-entry', '보관', '보관', 'noun', 'archived' from rls_fixture;

insert into public.senses (entry_id, sense_order, is_primary, status)
select draft_entry_id, 1, true, 'published' from rls_fixture;

insert into public.sense_translations (sense_id, locale, short_definition, status)
select s.id, 'en', 'orphan sense', 'published'
from public.senses s
join rls_fixture f on s.entry_id = f.draft_entry_id;

insert into public.entry_aliases (entry_id, alias_type, alias, alias_normalized, status)
select draft_entry_id, 'search_keyword', '숨김', '숨김', 'published' from rls_fixture;

insert into public.conjugation_rules (id, slug, rule_code, status)
select conj_rule_id, 'rls-conj-rule', 'RLS_RULE', 'draft' from rls_fixture;

insert into public.conjugation_rule_translations (rule_id, locale, title, explanation, status)
select conj_rule_id, 'en', 'Rule title', 'Rule explanation', 'published' from rls_fixture;

update public.conjugation_rules set status = 'published'
where id = (select conj_rule_id from rls_fixture);

insert into public.conjugation_results (id, entry_id, form_id, rule_id, result, result_normalized, status)
select conj_result_id, pub_entry_id, conj_form_id, conj_rule_id, '공개요', '공개요', 'draft'
from rls_fixture;

insert into public.conjugation_result_steps (id, result_id, step_order, before_form, after_form)
select conj_step_id, conj_result_id, 1, '공개', '공개요' from rls_fixture;

insert into public.conjugation_result_step_translations (step_id, locale, description, status)
select conj_step_id, 'en', 'Step description', 'published' from rls_fixture;

update public.conjugation_results set status = 'published'
where id = (select conj_result_id from rls_fixture);

insert into public.conjugation_results (entry_id, form_id, rule_id, result, result_normalized, status)
select draft_entry_id, conj_form_id, conj_rule_id, '초안요', '초안요', 'draft' from rls_fixture;

-- Hanja visibility chain
insert into public.hanja_characters (id, character, status)
select hanja_char_id, '字', 'draft' from rls_fixture;

insert into public.hanja_readings (id, character_id, reading_hangul, is_primary, status)
select hanja_reading_id, hanja_char_id, '자', true, 'published' from rls_fixture;

insert into public.hanja_character_translations (character_id, locale, meaning, status)
select hanja_char_id, 'en', 'character', 'published' from rls_fixture;

update public.hanja_characters set status = 'published'
where id = (select hanja_char_id from rls_fixture);

insert into public.hanja_terms (id, entry_id, slug, korean_hanja, status)
select hanja_term_id, pub_entry_id, 'rls-hanja-term', '字', 'draft' from rls_fixture;

insert into public.hanja_term_characters (id, term_id, character_id, position)
select hanja_slot_id, hanja_term_id, hanja_char_id, 1 from rls_fixture;

insert into public.hanja_term_character_translations (term_character_id, locale, meaning_in_term, status)
select hanja_slot_id, 'en', 'glyph', 'published' from rls_fixture;

update public.hanja_terms set status = 'published'
where id = (select hanja_term_id from rls_fixture);

insert into public.hanja_terms (entry_id, slug, korean_hanja, status)
select pub_entry_id, 'draft-hanja-term', '字', 'draft' from rls_fixture;

-- Sources
insert into public.sources (id, source_type, title, verification_status, is_publicly_displayed)
select pub_source_id, 'dictionary', 'Public Dictionary', 'verified', true from rls_fixture;

insert into public.content_sources (source_id, entry_id)
select pub_source_id, pub_entry_id from rls_fixture;

insert into public.sources (id, source_type, title, verification_status, is_publicly_displayed)
select private_source_id, 'book', 'Private Book', 'unverified', false from rls_fixture;

insert into public.content_sources (source_id, entry_id)
select private_source_id, pub_entry_id from rls_fixture;

insert into public.feedback (target_kind, category, message, entry_id)
select 'entry', 'other', 'RLS hidden feedback row.', pub_entry_id from rls_fixture;

select set_config('test.pub_entry_id', (select pub_entry_id::text from rls_fixture), true);
select set_config('test.draft_entry_id', (select draft_entry_id::text from rls_fixture), true);
select set_config('test.review_entry_id', (select review_entry_id::text from rls_fixture), true);
select set_config('test.archived_entry_id', (select archived_entry_id::text from rls_fixture), true);
select set_config('test.conj_result_id', (select conj_result_id::text from rls_fixture), true);
select set_config('test.hanja_term_id', (select hanja_term_id::text from rls_fixture), true);
select set_config('test.hanja_char_id', (select hanja_char_id::text from rls_fixture), true);
select set_config('test.private_source_id', (select private_source_id::text from rls_fixture), true);
select set_config('test.pub_source_id', (select pub_source_id::text from rls_fixture), true);

set local role anon;

-- 1. Published entry readable
select is(
  (select count(*)::integer from public.entries where id = current_setting('test.pub_entry_id')::uuid),
  1,
  'published entry readable by anon'
);

-- 2. draft / in_review / archived entries not readable
select is(
  (
    select count(*)::integer from public.entries
    where id in (
      current_setting('test.draft_entry_id')::uuid,
      current_setting('test.review_entry_id')::uuid,
      current_setting('test.archived_entry_id')::uuid
    )
  ),
  0,
  'draft, in_review, and archived entries not readable by anon'
);

-- 3. Published sense with draft parent not readable
select is(
  (
    select count(*)::integer
    from public.senses s
    where s.entry_id = current_setting('test.draft_entry_id')::uuid
      and s.status = 'published'
  ),
  0,
  'published sense under draft entry not readable by anon'
);

-- 4. Published alias with draft parent not readable
select is(
  (
    select count(*)::integer
    from public.entry_aliases a
    where a.entry_id = current_setting('test.draft_entry_id')::uuid
      and a.status = 'published'
  ),
  0,
  'published alias under draft entry not readable by anon'
);

-- 5. Conjugation result readable with full published dependency chain
select is(
  (select count(*)::integer from public.conjugation_results where id = current_setting('test.conj_result_id')::uuid),
  1,
  'conjugation result with full published chain readable by anon'
);

select is(
  (
    select count(*)::integer
    from public.conjugation_results cr
    where cr.entry_id = current_setting('test.draft_entry_id')::uuid
  ),
  0,
  'conjugation result with draft entry not readable by anon'
);

-- 6. Hanja term and character visibility consistent
select is(
  (select count(*)::integer from public.hanja_terms where id = current_setting('test.hanja_term_id')::uuid),
  1,
  'published hanja term readable by anon'
);

select is(
  (select count(*)::integer from public.hanja_characters where id = current_setting('test.hanja_char_id')::uuid),
  1,
  'published hanja character readable by anon'
);

select is(
  (
    select count(*)::integer from public.hanja_term_characters
    where term_id = current_setting('test.hanja_term_id')::uuid
  ),
  1,
  'hanja term character slot visible when term and character published'
);

-- 7–8. Source visibility
select is(
  (select count(*)::integer from public.sources where id = current_setting('test.private_source_id')::uuid),
  0,
  'unverified non-displayed source not readable by anon'
);

select is(
  (select count(*)::integer from public.sources where id = current_setting('test.pub_source_id')::uuid),
  1,
  'verified publicly displayed source linked to published target readable by anon'
);

-- 9. feedback not readable (no SELECT privilege → error, not empty result)
select throws_ok(
  $$select count(*) from public.feedback$$,
  '42501',
  null,
  'feedback never readable by anon'
);

-- 10. anon cannot insert feedback
select throws_ok(
  $$insert into public.feedback (target_kind, category, message)
    values ('page', 'other', 'anon insert attempt.')$$,
  '42501',
  null,
  'anon cannot directly insert feedback'
);

reset role;

select * from finish();
rollback;
