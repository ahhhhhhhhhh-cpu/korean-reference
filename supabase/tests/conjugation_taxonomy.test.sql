-- Phase 7C-3A: conjugation irregular taxonomy + system reference forms
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- ---------------------------------------------------------------------------
-- System reference conjugation forms (migration-owned, not seed-owned)
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::integer from public.conjugation_forms),
  6,
  'exactly six canonical conjugation forms exist after migrations'
);

select is(
  (
    select array_agg(code order by sort_order)
    from public.conjugation_forms
  ),
  array[
    'present_polite', 'past_polite', 'present_formal',
    'past_formal', 'present_informal', 'propositive'
  ]::text[],
  'conjugation form codes match canonical order'
);

select is(
  (
    select count(*)::integer
    from public.conjugation_form_translations t
    join public.conjugation_forms f on f.id = t.form_id
    where t.locale in ('en', 'zh', 'ja')
      and t.status = 'published'
  ),
  18,
  'each conjugation form has published EN/ZH/JA translation'
);

select ok(
  exists (
    select 1
    from public.conjugation_form_translations t
    join public.conjugation_forms f on f.id = t.form_id
    where f.code = 'propositive'
      and t.locale = 'en'
      and t.name = 'Propositive'
      and t.short_description like '%-(으)ㅂ시다%'
  ),
  'propositive EN translation uses learner-facing -(으)ㅂ시다 description'
);

-- ---------------------------------------------------------------------------
-- Canonical irregular_type taxonomy
-- ---------------------------------------------------------------------------

select lives_ok(
  $$insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
    values ('tax-irreg-d', '듣다', '듣다', 'verb', 'ㄷ', 'draft')$$,
  'irregular_type ㄷ is accepted'
);

select lives_ok(
  $$insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
    values ('tax-irreg-yeo', '공부하다', '공부하다', 'verb', '여', 'draft')$$,
  'irregular_type 여 is accepted'
);

select lives_ok(
  $$insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
    values ('tax-irreg-woo', 'placeholder-woo', 'placeholder-woo', 'verb', '우', 'draft')$$,
  'irregular_type 우 is accepted'
);

select throws_ok(
  $$insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
    values ('tax-deprecated-eu', 'placeholder-eu', 'placeholder-eu', 'verb', 'ㅡ', 'draft')$$,
  '23514',
  'new row for relation "entries" violates check constraint "entries_irregular_type_check"',
  'deprecated irregular_type ㅡ is rejected'
);

select throws_ok(
  $$insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
    values ('tax-deprecated-rieul', 'placeholder-rieul', 'placeholder-rieul', 'verb', 'ㄹ', 'draft')$$,
  '23514',
  'new row for relation "entries" violates check constraint "entries_irregular_type_check"',
  'deprecated irregular_type ㄹ is rejected'
);

-- Regular entries remain regular (NULL irregular_type)
select ok(
  (
    select irregular_type is null
    from public.entries
    where slug = 'keuda'
  ),
  'synthetic keuda remains regular (NULL irregular_type)'
);

select ok(
  (
    select irregular_type = 'ㄷ'
    from public.entries
    where slug = 'deutda'
  ),
  'synthetic deutda keeps ㄷ irregular_type'
);

select ok(
  (
    select irregular_type = '르'
    from public.entries
    where slug = 'oreuda'
  ),
  'synthetic oreuda keeps 르 irregular_type'
);

-- ---------------------------------------------------------------------------
-- 하다 normalization (migration-time policy smoke via temp row + manual update)
-- ---------------------------------------------------------------------------

insert into public.entries (slug, headword, headword_normalized, part_of_speech, irregular_type, status)
values ('tax-hada-normalize', '좋아하다', '좋아하다', 'verb', null, 'draft');

update public.entries
set irregular_type = '여'
where slug = 'tax-hada-normalize';

select is(
  (select irregular_type from public.entries where slug = 'tax-hada-normalize'),
  '여',
  '하다-pattern entry can be classified as 여 irregular'
);

-- ---------------------------------------------------------------------------
-- Integrity tests still resolve migration-owned present_polite form
-- ---------------------------------------------------------------------------

select ok(
  (select id from public.conjugation_forms where code = 'present_polite' limit 1) is not null,
  'present_polite form id resolves for downstream FK fixtures'
);

select * from finish();
rollback;
