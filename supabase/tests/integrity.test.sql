-- Phase 6B: publication integrity validators and feedback delete flow
begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

-- ---------------------------------------------------------------------------
-- Shared fixtures
-- ---------------------------------------------------------------------------
create temp table fixture_ids on commit drop as
select
  gen_random_uuid() as entry_id,
  gen_random_uuid() as bare_entry_id,
  gen_random_uuid() as sense_id,
  gen_random_uuid() as sense_trans_id,
  gen_random_uuid() as example_id,
  gen_random_uuid() as sound_rule_id,
  gen_random_uuid() as sound_step_id,
  gen_random_uuid() as conj_rule_id,
  gen_random_uuid() as conj_result_id,
  (select id from public.conjugation_forms where code = 'present_polite' limit 1) as conj_form_id,
  gen_random_uuid() as hanja_char_id,
  gen_random_uuid() as hanja_reading_id,
  gen_random_uuid() as hanja_term_id,
  gen_random_uuid() as hanja_slot_id,
  gen_random_uuid() as sense2_id,
  gen_random_uuid() as feedback_id;

insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select entry_id, 'test-entry', '테스트', '테스트', 'noun', 'draft' from fixture_ids;

insert into public.entries (id, slug, headword, headword_normalized, part_of_speech, status)
select bare_entry_id, 'bare-entry', '맨', '맨', 'noun', 'draft' from fixture_ids;

-- 1. Entry without published primary sense cannot publish
select throws_ok(
  format(
    $$update public.entries set status = 'published' where id = %L$$,
    (select bare_entry_id from fixture_ids)
  ),
  'P0001',
  null,
  'entry without published primary sense cannot publish'
);

insert into public.senses (id, entry_id, sense_order, is_primary, status)
select sense_id, entry_id, 1, true, 'published' from fixture_ids;

insert into public.sense_translations (id, sense_id, locale, short_definition, status)
select sense_trans_id, sense_id, 'en', 'test definition', 'published' from fixture_ids;

insert into public.senses (id, entry_id, sense_order, is_primary, status)
select sense2_id, entry_id, 2, false, 'published' from fixture_ids;

insert into public.sense_translations (sense_id, locale, short_definition, status)
select sense2_id, 'en', 'second sense', 'published' from fixture_ids;

update public.senses set is_primary = false where id = (select sense_id from fixture_ids);
update public.senses set is_primary = true, status = 'published'
where id = (select sense_id from fixture_ids);

-- Publish entry successfully for later tests
update public.entries set status = 'published' where id = (select entry_id from fixture_ids);

-- 2. Published entry cannot stay published when a published sense loses English
select throws_ok(
  format(
    $q$
    do $body$
    begin
      update public.sense_translations
      set status = 'draft'
      where id = %L;
      set constraints sense_translations_revalidate_published_entry immediate;
    end;
    $body$;
    $q$,
    (select sense_trans_id from fixture_ids)
  ),
  'P0001',
  null,
  'entry cannot stay published when published sense loses English'
);

-- Restore EN translation for subsequent setup
update public.sense_translations
set status = 'published', short_definition = 'test definition'
where id = (select sense_trans_id from fixture_ids);

-- 3. in_review can be saved
select lives_ok(
  format(
    $$update public.entries set status = 'in_review' where id = %L$$,
    (select entry_id from fixture_ids)
  ),
  'entry in_review saves without error'
);

update public.entries set status = 'published' where id = (select entry_id from fixture_ids);

-- Example fixtures
insert into public.examples (id, korean_text, korean_text_normalized, provenance_type, status)
select example_id, '예문입니다.', '예문입니다.', 'original', 'draft' from fixture_ids;

-- 4. Example requires at least one published translation
select throws_ok(
  format(
    $$update public.examples set status = 'published' where id = %L$$,
    (select example_id from fixture_ids)
  ),
  'P0001',
  null,
  'example without published translation cannot publish'
);

insert into public.example_translations (example_id, locale, translation, status)
select example_id, 'en', 'Example sentence.', 'published' from fixture_ids;

-- 5. unknown provenance cannot publish
insert into public.examples (korean_text, korean_text_normalized, provenance_type, status)
values ('미상 예문.', '미상 예문.', 'unknown', 'draft');

select throws_ok(
  $$update public.examples set status = 'published'
    where korean_text = '미상 예문.'$$,
  'P0001',
  null,
  'unknown provenance example cannot publish'
);

-- 6. licensed example without license info cannot publish
insert into public.examples (korean_text, korean_text_normalized, provenance_type, status)
values ('라이선스 예문.', '라이선스 예문.', 'licensed', 'draft');

insert into public.example_translations (example_id, locale, translation, status)
select id, 'en', 'Licensed line.', 'published'
from public.examples where korean_text = '라이선스 예문.';

select throws_ok(
  $$update public.examples set status = 'published'
    where korean_text = '라이선스 예문.'$$,
  'P0001',
  null,
  'licensed example without license info cannot publish'
);

-- Sound change rule
insert into public.sound_change_rules (id, slug, category, status)
select sound_rule_id, 'test-rule', 'liaison', 'draft' from fixture_ids;

insert into public.sound_change_translations (rule_id, locale, name, status)
select sound_rule_id, 'en', 'Test Rule', 'published' from fixture_ids;

insert into public.sound_change_steps (id, rule_id, step_order, before_form, after_form)
select sound_step_id, sound_rule_id, 1, 'a', 'b' from fixture_ids;

-- 7. Sound change missing English description cannot publish
select throws_ok(
  format(
    $$update public.sound_change_rules set status = 'published' where id = %L$$,
    (select sound_rule_id from fixture_ids)
  ),
  'P0001',
  null,
  'sound change rule missing English description cannot publish'
);

update public.sound_change_translations
set description = 'Full description.'
where rule_id = (select sound_rule_id from fixture_ids);

-- Conjugation rule
insert into public.conjugation_rules (id, slug, rule_code, status)
select conj_rule_id, 'test-conj-rule', 'TEST_RULE', 'draft' from fixture_ids;

insert into public.conjugation_rule_translations (rule_id, locale, title, status)
select conj_rule_id, 'en', 'Test Rule Title', 'published' from fixture_ids;

-- 8. Conjugation rule missing English explanation cannot publish
select throws_ok(
  format(
    $$update public.conjugation_rules set status = 'published' where id = %L$$,
    (select conj_rule_id from fixture_ids)
  ),
  'P0001',
  null,
  'conjugation rule missing English explanation cannot publish'
);

insert into public.conjugation_results (id, entry_id, form_id, rule_id, result, result_normalized, status)
select conj_result_id, entry_id, conj_form_id, conj_rule_id, '테스트요', '테스트요', 'draft'
from fixture_ids;

-- 9. Conjugation result requires published entry/form/rule
select throws_ok(
  format(
    $$update public.conjugation_results set status = 'published' where id = %L$$,
    (select conj_result_id from fixture_ids)
  ),
  'P0001',
  null,
  'conjugation result with unpublished rule cannot publish'
);

-- Hanja character
insert into public.hanja_characters (id, character, status)
select hanja_char_id, '測', 'draft' from fixture_ids;

insert into public.hanja_character_translations (character_id, locale, meaning, status)
select hanja_char_id, 'en', 'test measure', 'published' from fixture_ids;

-- 10. Hanja character without published reading cannot publish
select throws_ok(
  format(
    $$update public.hanja_characters set status = 'published' where id = %L$$,
    (select hanja_char_id from fixture_ids)
  ),
  'P0001',
  null,
  'hanja character without published reading cannot publish'
);

insert into public.hanja_readings (id, character_id, reading_hangul, is_primary, status)
select hanja_reading_id, hanja_char_id, '측', true, 'published' from fixture_ids;

update public.hanja_characters set status = 'published'
where id = (select hanja_char_id from fixture_ids);

-- Hanja term: duplicate character 測測
insert into public.hanja_terms (id, entry_id, slug, korean_hanja, status)
select hanja_term_id, entry_id, 'test-hanja-term', '測測', 'draft' from fixture_ids;

insert into public.hanja_term_characters (id, term_id, character_id, reading_id, position)
select hanja_slot_id, hanja_term_id, hanja_char_id, hanja_reading_id, 1 from fixture_ids;

insert into public.hanja_term_characters (term_id, character_id, reading_id, position)
select hanja_term_id, hanja_char_id, hanja_reading_id, 2 from fixture_ids;

insert into public.hanja_term_character_translations (term_character_id, locale, meaning_in_term, status)
select id, 'en', 'study slot', 'published'
from public.hanja_term_characters
where term_id = (select hanja_term_id from fixture_ids);

-- 11a. Hanja term with gap in positions cannot publish
update public.hanja_term_characters set position = 3
where term_id = (select hanja_term_id from fixture_ids) and position = 2;

select throws_ok(
  format(
    $$update public.hanja_terms set status = 'published' where id = %L$$,
    (select hanja_term_id from fixture_ids)
  ),
  'P0001',
  null,
  'hanja term requires contiguous positions'
);

-- Fix positions for sequence test
update public.hanja_term_characters set position = 2
where term_id = (select hanja_term_id from fixture_ids) and position = 3;

-- 11b. Hanja term character sequence must match korean_hanja
update public.hanja_terms set korean_hanja = '測試' where id = (select hanja_term_id from fixture_ids);

select throws_ok(
  format(
    $$update public.hanja_terms set status = 'published' where id = %L$$,
    (select hanja_term_id from fixture_ids)
  ),
  'P0001',
  null,
  'hanja term character sequence must match korean_hanja'
);

update public.hanja_terms set korean_hanja = '測測' where id = (select hanja_term_id from fixture_ids);

-- 11c. Linked character must be published
update public.hanja_characters set status = 'draft'
where id = (select hanja_char_id from fixture_ids);

select throws_ok(
  format(
    $$update public.hanja_terms set status = 'published' where id = %L$$,
    (select hanja_term_id from fixture_ids)
  ),
  'P0001',
  null,
  'hanja term requires published linked characters'
);

update public.hanja_characters set status = 'published'
where id = (select hanja_char_id from fixture_ids);

-- 12. One example can link to two senses on same entry
select lives_ok(
  format(
    $q$
    insert into public.entry_examples (entry_id, example_id, sense_id)
    values (%L, %L, %L);
    insert into public.entry_examples (entry_id, example_id, sense_id)
    values (%L, %L, %L);
    $q$,
    (select entry_id from fixture_ids),
    (select example_id from fixture_ids),
    (select sense_id from fixture_ids),
    (select entry_id from fixture_ids),
    (select example_id from fixture_ids),
    (select sense2_id from fixture_ids)
  ),
  'one example can link to two different senses on same entry'
);

-- 13. Feedback survives target delete with flag set and FK cleared
insert into public.feedback (
  id, target_kind, category, message, entry_id, target_was_deleted
)
select
  feedback_id,
  'entry',
  'other',
  'Test feedback message for delete flow.',
  entry_id,
  false
from fixture_ids;

select lives_ok(
  format(
    $$delete from public.entries where id = %L$$,
    (select entry_id from fixture_ids)
  ),
  'deleting entry with feedback succeeds'
);

select is(
  (select count(*)::integer from public.feedback where id = (select feedback_id from fixture_ids)),
  1,
  'feedback row preserved after target delete'
);

select is(
  (select target_kind from public.feedback where id = (select feedback_id from fixture_ids)),
  'entry',
  'feedback target_kind preserved'
);

select is(
  (select target_was_deleted from public.feedback where id = (select feedback_id from fixture_ids)),
  true,
  'feedback target_was_deleted set true'
);

select is(
  (
    select pg_catalog.num_nonnulls(
      entry_id, sense_id, sense_translation_id, example_id, example_translation_id,
      sound_change_rule_id, conjugation_result_id, hanja_character_id, hanja_term_id, idiom_id
    )::integer
    from public.feedback
    where id = (select feedback_id from fixture_ids)
  ),
  0,
  'feedback target FKs are NULL after delete'
);

select * from finish();
rollback;
