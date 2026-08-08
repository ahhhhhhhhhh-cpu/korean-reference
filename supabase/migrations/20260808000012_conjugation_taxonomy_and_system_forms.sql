-- Phase 7C-3A: conjugation irregular taxonomy correction + system reference forms
-- Safe for databases that already contain synthetic dev seed (upsert forms by code).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Normalize deprecated irregular_type values before tightening CHECKs
-- ---------------------------------------------------------------------------

-- entries: no is_irregular column; NULL irregular_type means regular
UPDATE public.entries
SET irregular_type = NULL
WHERE irregular_type IN ('ㅡ', 'ㄹ');

UPDATE public.entries
SET irregular_type = '여'
WHERE part_of_speech IN ('verb', 'adjective')
  AND (
    headword ~ '하다$'
    OR headword_normalized ~ '하다$'
  );

UPDATE public.conjugation_rules
SET is_irregular = false,
    irregular_type = NULL
WHERE irregular_type IN ('ㅡ', 'ㄹ');

UPDATE public.conjugation_results
SET is_irregular = false,
    irregular_type = NULL
WHERE irregular_type IN ('ㅡ', 'ㄹ');

-- ---------------------------------------------------------------------------
-- 2. Replace irregular_type CHECK constraints (canonical taxonomy)
--    ㄷ | ㅂ | ㅅ | ㅎ | 르 | 러 | 여 | 우
--    ㅡ deletion and ㄹ deletion are regular patterns (conjugation_rules), not metadata.
-- ---------------------------------------------------------------------------

ALTER TABLE public.entries
  DROP CONSTRAINT entries_irregular_type_check;

ALTER TABLE public.entries
  ADD CONSTRAINT entries_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', 'ㅅ', 'ㅎ', '르', '러', '여', '우')
  );

ALTER TABLE public.conjugation_rules
  DROP CONSTRAINT conjugation_rules_irregular_type_check;

ALTER TABLE public.conjugation_rules
  ADD CONSTRAINT conjugation_rules_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', 'ㅅ', 'ㅎ', '르', '러', '여', '우')
  );

ALTER TABLE public.conjugation_results
  DROP CONSTRAINT conjugation_results_irregular_type_check;

ALTER TABLE public.conjugation_results
  ADD CONSTRAINT conjugation_results_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', 'ㅅ', 'ㅎ', '르', '러', '여', '우')
  );

-- ---------------------------------------------------------------------------
-- 3. System reference data: six canonical conjugation forms (+ EN/ZH/JA labels)
--    Upsert by unique code; preserve existing row ids when already present (e.g. dev seed).
--    Publication order: draft forms → published translations → published forms.
-- ---------------------------------------------------------------------------

INSERT INTO public.conjugation_forms (code, sort_order, status)
VALUES
  ('present_polite', 1, 'draft'),
  ('past_polite', 2, 'draft'),
  ('present_formal', 3, 'draft'),
  ('past_formal', 4, 'draft'),
  ('present_informal', 5, 'draft'),
  ('propositive', 6, 'draft')
ON CONFLICT (code) DO UPDATE
SET sort_order = EXCLUDED.sort_order;

INSERT INTO public.conjugation_form_translations (form_id, locale, name, short_description, status)
SELECT f.id, v.locale, v.name, v.short_description, 'published'
FROM (
  VALUES
    ('present_polite', 'en', 'Present polite', '어/아요 ending'),
    ('present_polite', 'zh', '现在敬语', '어/아요 ending'),
    ('present_polite', 'ja', '現在の敬語', '어/아요 ending'),
    ('past_polite', 'en', 'Past polite', '았/었어요 ending'),
    ('past_polite', 'zh', '过去敬语', '았/었어요 ending'),
    ('past_polite', 'ja', '過去の敬語', '았/었어요 ending'),
    ('present_formal', 'en', 'Present formal', '습니다 ending'),
    ('present_formal', 'zh', '现在正式', '습니다 ending'),
    ('present_formal', 'ja', '現在の正式', '습니다 ending'),
    ('past_formal', 'en', 'Past formal', '았/었습니다 ending'),
    ('past_formal', 'zh', '过去正式', '았/었습니다 ending'),
    ('past_formal', 'ja', '過去の正式', '았/었습니다 ending'),
    ('present_informal', 'en', 'Present informal', '아/어 ending'),
    ('present_informal', 'zh', '现在非敬语', '아/어 ending'),
    ('present_informal', 'ja', '現在の普通体', '아/어 ending'),
    ('propositive', 'en', 'Propositive', 'Let''s … (-(으)ㅂ시다)'),
    ('propositive', 'zh', '提议形', '我们……吧（-(으)ㅂ시다）'),
    ('propositive', 'ja', '勧誘形', '～しましょう（-(으)ㅂ시다）')
) AS v(code, locale, name, short_description)
JOIN public.conjugation_forms f ON f.code = v.code
ON CONFLICT (form_id, locale) DO UPDATE
SET name = EXCLUDED.name,
    short_description = EXCLUDED.short_description,
    status = 'published';

UPDATE public.conjugation_forms
SET status = 'published'
WHERE code IN (
  'present_polite',
  'past_polite',
  'present_formal',
  'past_formal',
  'present_informal',
  'propositive'
);

COMMIT;
