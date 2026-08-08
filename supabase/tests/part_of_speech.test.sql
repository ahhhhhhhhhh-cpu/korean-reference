-- Phase 7C-4B-1R-A2: bound_noun part_of_speech taxonomy
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select lives_ok(
  $$insert into public.entries (
    id, slug, headword, headword_normalized, part_of_speech, status
  ) values (
    'a1111111-1111-4111-8111-111111111101',
    'pos-test-bound-noun',
    '시',
    '시',
    'bound_noun',
    'draft'
  )$$,
  'bound_noun is accepted by entries.part_of_speech'
);

select lives_ok(
  $$insert into public.entries (
    id, slug, headword, headword_normalized, part_of_speech, status
  ) values (
    'a1111111-1111-4111-8111-111111111102',
    'pos-test-noun',
    '테스트',
    '테스트',
    'noun',
    'draft'
  )$$,
  'noun remains accepted'
);

select lives_ok(
  $$insert into public.entries (
    id, slug, headword, headword_normalized, part_of_speech, status
  ) values (
    'a1111111-1111-4111-8111-111111111103',
    'pos-test-verb',
    '가다',
    '가다',
    'verb',
    'draft'
  )$$,
  'verb remains accepted'
);

select throws_ok(
  $$insert into public.entries (
    id, slug, headword, headword_normalized, part_of_speech, status
  ) values (
    'a1111111-1111-4111-8111-111111111104',
    'pos-test-invalid',
    '테스트',
    '테스트',
    'interjection',
    'draft'
  )$$,
  '23514',
  null,
  'invalid part_of_speech is rejected'
);

select * from extensions.finish();

rollback;
