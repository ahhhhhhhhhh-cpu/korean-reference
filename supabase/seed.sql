-- ============================================================
-- TEST / SYNTHETIC DATA ONLY
-- DEVELOPMENT AND TEST ENVIRONMENTS ONLY
-- DO NOT APPLY THIS FILE TO PRODUCTION
-- ============================================================
-- Korean Reference Phase 6C local test seed.
-- Synthetic vocabulary for adapter and locale-fallback testing only.
-- Never use `db push --include-seed` against korean-reference-prod.

BEGIN;

INSERT INTO public.entries (
  id, slug, headword, headword_normalized, romanization, romanization_normalized,
  pronunciation_hangul, part_of_speech, etymology_type, stem, irregular_type,
  difficulty_level, frequency_level, status
) VALUES
  ('11111111-1111-4111-8111-111111111101', 'gada', '가다', '가다', 'gada', 'gada', '[가다]', 'verb', 'native', '가', NULL, 'intermediate', 'high', 'draft'),
  ('11111111-1111-4111-8111-111111111102', 'yeppeuda', '예쁘다', '예쁘다', 'yeppeuda', 'yeppeuda', '[예쁘다]', 'adjective', 'native', '예쁘', NULL, 'beginner', 'high', 'draft'),
  ('11111111-1111-4111-8111-111111111103', 'deutda', '듣다', '듣다', 'deutda', 'deutda', '[듣따]', 'verb', 'native', '듣', 'ㄷ', 'beginner', 'high', 'draft'),
  ('11111111-1111-4111-8111-111111111104', 'hakgyo', '학교', '학교', 'hakgyo', 'hakgyo', '[학꾜]', 'noun', 'sino_korean', NULL, NULL, 'intermediate', 'high', 'draft'),
  ('11111111-1111-4111-8111-111111111105', 'meokda', '먹다', '먹다', 'meokda', 'meokda', '[먹따]', 'verb', 'native', '먹', NULL, 'beginner', 'high', 'draft'),
  ('11111111-1111-4111-8111-111111111106', 'oreuda', '오르다', '오르다', 'oreuda', 'oreuda', '[오르다]', 'verb', 'native', '오르', '르', 'beginner', 'medium', 'draft'),
  ('11111111-1111-4111-8111-111111111107', 'sipda', '쉽다', '쉽다', 'sipda', 'sipda', '[쉽따]', 'adjective', 'native', '쉽', 'ㅂ', 'intermediate', 'medium', 'draft'),
  ('11111111-1111-4111-8111-111111111108', 'keuda', '크다', '크다', 'keuda', 'keuda', '[크다]', 'adjective', 'native', '크', NULL, 'beginner', 'medium', 'draft'),
  ('11111111-1111-4111-8111-111111111109', 'test-draft', '초안단어', '초안단어', 'choandan-eo', 'choandan-eo', '[초안단어]', 'noun', 'native', NULL, NULL, 'beginner', 'low', 'draft'),
  ('11111111-1111-4111-8111-111111111110', 'test-review', '심사단어', '심사단어', 'simsadan-eo', 'simsadan-eo', '[심사단어]', 'noun', 'native', NULL, NULL, 'beginner', 'low', 'in_review');

INSERT INTO public.senses (id, entry_id, sense_order, is_primary, register, status) VALUES
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111103', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111104', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111105', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111106', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222207', '11111111-1111-4111-8111-111111111107', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222208', '11111111-1111-4111-8111-111111111108', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222209', '11111111-1111-4111-8111-111111111109', 1, true, 'neutral', 'draft'),
  ('22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111110', 1, true, 'neutral', 'draft');

INSERT INTO public.sense_translations (id, sense_id, locale, short_definition, definition, status) VALUES
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'en', 'to go', 'To move from one place to another.', 'draft'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', 'zh', '去', '从一个地方移动到另一个地方。', 'draft'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222201', 'ja', '行く', 'ある場所から別の場所へ移動する。', 'draft'),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222202', 'en', 'to be pretty', 'To have an attractive appearance.', 'draft'),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222202', 'zh', '漂亮', '外表好看。', 'draft'),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222202', 'ja', 'きれいだ', '見た目が美しい。', 'draft'),
  ('33333333-3333-4333-8333-333333333307', '22222222-2222-4222-8222-222222222203', 'en', 'to listen', 'To pay attention to sounds or speech.', 'draft'),
  ('33333333-3333-4333-8333-333333333308', '22222222-2222-4222-8222-222222222203', 'zh', '听', '注意声音或说话。', 'draft'),
  ('33333333-3333-4333-8333-333333333309', '22222222-2222-4222-8222-222222222203', 'ja', '聞く', '音や話を注意して聞く。', 'draft'),
  ('33333333-3333-4333-8333-333333333310', '22222222-2222-4222-8222-222222222204', 'en', 'school', 'An institution for education.', 'draft'),
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222204', 'zh', '学校', '进行教育的机构。', 'draft'),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222205', 'en', 'to eat', 'To consume food.', 'draft'),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222205', 'zh', '吃', '进食。', 'draft'),
  ('33333333-3333-4333-8333-333333333314', '22222222-2222-4222-8222-222222222205', 'ja', '食べる', '食べ物を口に入れる。', 'draft'),
  ('33333333-3333-4333-8333-333333333315', '22222222-2222-4222-8222-222222222206', 'en', 'to climb', 'To go up or ascend.', 'draft'),
  ('33333333-3333-4333-8333-333333333316', '22222222-2222-4222-8222-222222222206', 'zh', '爬', '向上移动。', 'draft'),
  ('33333333-3333-4333-8333-333333333317', '22222222-2222-4222-8222-222222222206', 'ja', '登る', '上へ上がる。', 'draft'),
  ('33333333-3333-4333-8333-333333333318', '22222222-2222-4222-8222-222222222207', 'en', 'to be easy', 'Not difficult to do or understand.', 'draft'),
  ('33333333-3333-4333-8333-333333333319', '22222222-2222-4222-8222-222222222207', 'ja', '簡単だ', '難しくない。', 'draft'),
  ('33333333-3333-4333-8333-333333333320', '22222222-2222-4222-8222-222222222208', 'en', 'to be big', 'Large in size.', 'draft'),
  ('33333333-3333-4333-8333-333333333321', '22222222-2222-4222-8222-222222222208', 'ja', '大きい', 'サイズが大きい。', 'draft'),
  ('33333333-3333-4333-8333-333333333322', '22222222-2222-4222-8222-222222222209', 'en', 'draft word', 'Synthetic draft entry for testing.', 'draft'),
  ('33333333-3333-4333-8333-333333333323', '22222222-2222-4222-8222-222222222210', 'en', 'review word', 'Synthetic in-review entry for testing.', 'draft');

INSERT INTO public.examples (id, korean_text, korean_text_normalized, romanization, register, difficulty_level, provenance_type, status) VALUES
  ('44444444-4444-4444-8444-444444444401', '학교에 갑니다.', '학교에 갑니다.', 'hakgyoe gamnida.', 'neutral', 'beginner', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444402', '꽃이 예뻐요.', '꽃이 예뻐요.', 'kkochi yeppeoyo.', 'neutral', 'beginner', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444403', '음악을 듣어요.', '음악을 듣어요.', 'eumageul deureoyo.', 'neutral', 'intermediate', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444404', '학교는 커요.', '학교는 커요.', 'hakgyoneun keoyo.', 'neutral', 'beginner', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444405', '몱을 먹어요.', '몱을 먹어요.', 'babeul meogeoyo.', 'neutral', 'beginner', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444406', '산을 올라요.', '산을 올라요.', 'saneul ollayo.', 'neutral', 'intermediate', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444407', '한국어는 쉽워요.', '한국어는 쉽워요.', 'hangugeoneun swiwoyo.', 'neutral', 'intermediate', 'original', 'draft'),
  ('44444444-4444-4444-8444-444444444408', '방이 커요.', '방이 커요.', 'bangi keoyo.', 'neutral', 'beginner', 'original', 'draft');

INSERT INTO public.example_translations (id, example_id, locale, translation, status) VALUES
  ('55555555-5555-4555-8555-555555555501', '44444444-4444-4444-8444-444444444401', 'en', 'I go to school.', 'draft'),
  ('55555555-5555-4555-8555-555555555502', '44444444-4444-4444-8444-444444444401', 'zh', '我去学校。', 'draft'),
  ('55555555-5555-4555-8555-555555555503', '44444444-4444-4444-8444-444444444401', 'ja', '学校に行きます。', 'draft'),
  ('55555555-5555-4555-8555-555555555504', '44444444-4444-4444-8444-444444444402', 'en', 'The flower is pretty.', 'draft'),
  ('55555555-5555-4555-8555-555555555505', '44444444-4444-4444-8444-444444444403', 'en', 'I listen to music.', 'draft'),
  ('55555555-5555-4555-8555-555555555506', '44444444-4444-4444-8444-444444444404', 'en', 'The school is big.', 'draft'),
  ('55555555-5555-4555-8555-555555555507', '44444444-4444-4444-8444-444444444405', 'en', 'I eat a meal.', 'draft'),
  ('55555555-5555-4555-8555-555555555508', '44444444-4444-4444-8444-444444444406', 'en', 'I climb the mountain.', 'draft'),
  ('55555555-5555-4555-8555-555555555509', '44444444-4444-4444-8444-444444444407', 'en', 'Korean is easy.', 'draft'),
  ('55555555-5555-4555-8555-555555555510', '44444444-4444-4444-8444-444444444408', 'en', 'The room is big.', 'draft');

INSERT INTO public.entry_examples (id, entry_id, example_id, sense_id, display_order) VALUES
  ('66666666-6666-4666-8666-666666666601', '11111111-1111-4111-8111-111111111101', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', 1),
  ('66666666-6666-4666-8666-666666666602', '11111111-1111-4111-8111-111111111102', '44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222202', 1),
  ('66666666-6666-4666-8666-666666666603', '11111111-1111-4111-8111-111111111103', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222203', 1),
  ('66666666-6666-4666-8666-666666666604', '11111111-1111-4111-8111-111111111104', '44444444-4444-4444-8444-444444444404', '22222222-2222-4222-8222-222222222204', 1),
  ('66666666-6666-4666-8666-666666666605', '11111111-1111-4111-8111-111111111105', '44444444-4444-4444-8444-444444444405', '22222222-2222-4222-8222-222222222205', 1),
  ('66666666-6666-4666-8666-666666666606', '11111111-1111-4111-8111-111111111106', '44444444-4444-4444-8444-444444444406', '22222222-2222-4222-8222-222222222206', 1),
  ('66666666-6666-4666-8666-666666666607', '11111111-1111-4111-8111-111111111107', '44444444-4444-4444-8444-444444444407', '22222222-2222-4222-8222-222222222207', 1),
  ('66666666-6666-4666-8666-666666666608', '11111111-1111-4111-8111-111111111108', '44444444-4444-4444-8444-444444444408', '22222222-2222-4222-8222-222222222208', 1);

INSERT INTO public.entry_relations (id, source_entry_id, target_entry_id, relation_type) VALUES
  ('77777777-7777-4777-8777-777777777701', '11111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111106', 'related'),
  ('77777777-7777-4777-8777-777777777702', '11111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111105', 'related'),
  ('77777777-7777-4777-8777-777777777703', '11111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111108', 'related');

INSERT INTO public.sound_change_rules (id, slug, category, difficulty, frequency, input_pattern, output_pattern, status) VALUES
  ('88888888-8888-4888-8888-888888888801', 'liaison-hakgyo', 'liaison', 2, 4, 'ㄱ+ㄱ', 'ㄲ', 'draft'),
  ('88888888-8888-4888-8888-888888888802', 'batchim-assimilation', 'batchim', 3, 5, 'ㄷ+ㄴ', 'ㄴ+ㄴ', 'draft'),
  ('88888888-8888-4888-8888-888888888803', 'nasalization-basic', 'nasalization', 4, 3, 'ㄱ+ㄴ', 'ㅇ+ㄴ', 'draft');

INSERT INTO public.sound_change_translations (id, rule_id, locale, name, short_summary, description, status) VALUES
  ('99999999-9999-4999-8999-999999999901', '88888888-8888-4888-8888-888888888801', 'en', 'Liaison in 학교', 'Consonant liaison at morpheme boundary.', 'When consonants meet across a boundary, pronunciation may shift. Synthetic test rule.', 'draft'),
  ('99999999-9999-4999-8999-999999999902', '88888888-8888-4888-8888-888888888801', 'zh', '连音（学校）', '音节边界连音。', '合成测试规则。', 'draft'),
  ('99999999-9999-4999-8999-999999999903', '88888888-8888-4888-8888-888888888801', 'ja', '連音（学校）', '音節境界の連音。', '合成テスト規則。', 'draft'),
  ('99999999-9999-4999-8999-999999999904', '88888888-8888-4888-8888-888888888802', 'en', 'Batchim assimilation', 'Final consonant changes before another consonant.', 'A batchim may assimilate to the following consonant. Synthetic test rule.', 'draft'),
  ('99999999-9999-4999-8999-999999999905', '88888888-8888-4888-8888-888888888802', 'zh', '收音同化', '收音遇辅音时发生同化。', '合成测试规则。', 'draft'),
  ('99999999-9999-4999-8999-999999999906', '88888888-8888-4888-8888-888888888802', 'ja', '終声同化', '終声が次の子音の前で同化する。', '合成テスト規則。', 'draft'),
  ('99999999-9999-4999-8999-999999999907', '88888888-8888-4888-8888-888888888803', 'en', 'Basic nasalization', 'Stops become nasals before nasal consonants.', 'Stops may nasalize before nasals. Synthetic test rule.', 'draft'),
  ('99999999-9999-4999-8999-999999999908', '88888888-8888-4888-8888-888888888803', 'zh', '鼻音化', '辅音在鼻音前鼻音化。', '合成测试规则。', 'draft'),
  ('99999999-9999-4999-8999-999999999909', '88888888-8888-4888-8888-888888888803', 'ja', '鼻音化', '破裂音が鼻音の前で鼻音化する。', '合成テスト規則。', 'draft');

INSERT INTO public.sound_change_steps (id, rule_id, step_order, before_form, after_form, environment_pattern) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', '88888888-8888-4888-8888-888888888801', 1, '학+교', '학꾜', 'compound noun'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', '88888888-8888-4888-8888-888888888802', 1, '듣+ㄴ', '들', 'before ㄴ'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', '88888888-8888-4888-8888-888888888802', 2, '먹+ㄴ', '먵', 'before ㄴ'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', '88888888-8888-4888-8888-888888888803', 1, '국+물', '국물', 'before ㅁ');

INSERT INTO public.sound_change_step_translations (id, step_id, locale, label, explanation, status) VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'en', 'Liaison step', 'Pronounce 학교 as [학꾜].', 'draft'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 'en', 'ㄷ assimilation', '듣다 + ㄴ → [들].', 'draft'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 'en', 'ㄱ assimilation', '먹다 + ㄴ → [먵].', 'draft'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 'en', 'Nasalization step', '국물 → [국물].', 'draft');

INSERT INTO public.entry_sound_changes (id, entry_id, rule_id, relation_type, context_note) VALUES
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc01', '11111111-1111-4111-8111-111111111104', '88888888-8888-4888-8888-888888888801', 'applies_to', '학교 liaison'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc02', '11111111-1111-4111-8111-111111111103', '88888888-8888-4888-8888-888888888802', 'demonstrates', '듣다 batchim'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc03', '11111111-1111-4111-8111-111111111105', '88888888-8888-4888-8888-888888888802', 'applies_to', '먹다 batchim'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc04', '11111111-1111-4111-8111-111111111107', '88888888-8888-4888-8888-888888888802', 'exception_to', '쉽다 ㅂ irregular exception');

INSERT INTO public.sound_change_examples (id, rule_id, example_id, step_id, display_order) VALUES
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd01', '88888888-8888-4888-8888-888888888801', '44444444-4444-4444-8444-444444444404', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 1),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd02', '88888888-8888-4888-8888-888888888802', '44444444-4444-4444-8444-444444444403', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 1),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd03', '88888888-8888-4888-8888-888888888803', '44444444-4444-4444-8444-444444444405', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 1);

INSERT INTO public.conjugation_forms (id, code, sort_order, status) VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'present_polite', 1, 'draft'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'past_polite', 2, 'draft'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'present_formal', 3, 'draft'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04', 'past_formal', 4, 'draft'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee05', 'present_informal', 5, 'draft'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee06', 'propositive', 6, 'draft');

INSERT INTO public.conjugation_form_translations (id, form_id, locale, name, short_description, status) VALUES
  ('ffffffff-ffff-4fff-8fff-ffffffffff01', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'en', 'Present polite', '어/아요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff02', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'zh', '现在敬语', '어/아요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff03', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'ja', '現在の敬語', '어/아요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff04', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'en', 'Past polite', '았/었어요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff05', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'zh', '过去敬语', '았/었어요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff06', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'ja', '過去の敬語', '았/었어요 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff07', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'en', 'Present formal', '습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff08', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'zh', '现在正式', '습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff09', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'ja', '現在の正式', '습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff10', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04', 'en', 'Past formal', '았/었습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff11', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04', 'zh', '过去正式', '았/었습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff12', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04', 'ja', '過去の正式', '았/었습니다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff13', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee05', 'en', 'Present informal', '아/어 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff14', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee05', 'zh', '现在非敬语', '아/어 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff15', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee05', 'ja', '現在の普通体', '아/어 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff16', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee06', 'en', 'Propositive', '자/ㅋ시다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff17', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee06', 'zh', '提议形', '자/ㅋ시다 ending', 'draft'),
  ('ffffffff-ffff-4fff-8fff-ffffffffff18', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee06', 'ja', '勧誘形', '자/ㅋ시다 ending', 'draft');

INSERT INTO public.conjugation_rules (id, slug, rule_code, is_irregular, irregular_type, rule_category, status) VALUES
  ('10101010-1010-4101-8101-101010101001', 'regular-eoyo', 'REGULAR_EOYO', false, NULL, 'regular', 'draft'),
  ('10101010-1010-4101-8101-101010101002', 'd-irregular', 'D_IRREGULAR', true, 'ㄷ', 'irregular', 'draft'),
  ('10101010-1010-4101-8101-101010101003', 'b-irregular', 'B_IRREGULAR', true, 'ㅂ', 'irregular', 'draft');

INSERT INTO public.conjugation_rule_translations (id, rule_id, locale, title, explanation, status) VALUES
  ('12121212-1212-4121-8121-121212121201', '10101010-1010-4101-8101-101010101001', 'en', 'Present polite ending', 'Attach 어요/아요 to the stem.', 'draft'),
  ('12121212-1212-4121-8121-121212121204', '10101010-1010-4101-8101-101010101002', 'en', 'ㄷ irregular', 'Stem-final ㄷ changes to ㄹ before a vowel.', 'draft'),
  ('12121212-1212-4121-8121-121212121207', '10101010-1010-4101-8101-101010101003', 'en', 'ㅂ irregular', 'Stem-final ㅂ changes to 우 before a vowel ending.', 'draft');

INSERT INTO public.conjugation_results (id, entry_id, form_id, rule_id, result, result_normalized, stem_used, is_irregular, irregular_type, variant_order, is_preferred, status) VALUES
  ('13131313-1313-4131-8131-131313131301', '11111111-1111-4111-8111-111111111101', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101001', '가요', '가요', '가', false, NULL, 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131302', '11111111-1111-4111-8111-111111111101', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', '10101010-1010-4101-8101-101010101001', '갔어요', '갔어요', '가', false, NULL, 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131303', '11111111-1111-4111-8111-111111111103', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101002', '듣어요', '듣어요', '듣', true, 'ㄷ', 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131304', '11111111-1111-4111-8111-111111111102', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101001', '예뻐요', '예뻐요', '예쁘', false, NULL, 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131305', '11111111-1111-4111-8111-111111111105', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101001', '먹어요', '먹어요', '먹', false, NULL, 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131306', '11111111-1111-4111-8111-111111111106', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', NULL, '올라요', '올라요', '오르', true, '르', 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131307', '11111111-1111-4111-8111-111111111107', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101003', '쉽워요', '쉽워요', '쉽', true, 'ㅂ', 1, true, 'draft'),
  ('13131313-1313-4131-8131-131313131308', '11111111-1111-4111-8111-111111111108', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', '10101010-1010-4101-8101-101010101001', '커요', '커요', '크', false, NULL, 1, true, 'draft');

INSERT INTO public.conjugation_result_steps (id, result_id, step_order, before_form, after_form, operation_code, applied_rule_id) VALUES
  ('14141414-1414-4141-8141-141414141401', '13131313-1313-4131-8131-131313131301', 1, '가', '가요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141402', '13131313-1313-4131-8131-131313131302', 1, '가', '갔어요', 'PAST_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141403', '13131313-1313-4131-8131-131313131303', 1, '듣', '들', 'D_TO_L', '10101010-1010-4101-8101-101010101002'),
  ('14141414-1414-4141-8141-141414141404', '13131313-1313-4131-8131-131313131303', 2, '들', '듣어요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141405', '13131313-1313-4131-8131-131313131304', 1, '예쁘', '예뻐요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141406', '13131313-1313-4131-8131-131313131305', 1, '먹', '먹어요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141407', '13131313-1313-4131-8131-131313131306', 1, '오르', '올라', 'REU_IRREG', NULL),
  ('14141414-1414-4141-8141-141414141408', '13131313-1313-4131-8131-131313131306', 2, '올라', '올라요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141409', '13131313-1313-4131-8131-131313131307', 1, '쉽', '쉼우', 'B_TO_U', '10101010-1010-4101-8101-101010101003'),
  ('14141414-1414-4141-8141-141414141410', '13131313-1313-4131-8131-131313131307', 2, '쉼우', '쉽워요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001'),
  ('14141414-1414-4141-8141-141414141411', '13131313-1313-4131-8131-131313131308', 1, '크', '커요', 'ADD_EOYO', '10101010-1010-4101-8101-101010101001');

INSERT INTO public.conjugation_result_step_translations (id, step_id, locale, description, status) VALUES
  ('15151515-1515-4151-8151-151515151501', '14141414-1414-4141-8141-141414141401', 'en', 'Add 어요 to stem 가.', 'draft'),
  ('15151515-1515-4151-8151-151515151502', '14141414-1414-4141-8141-141414141402', 'en', 'Form past tense 갔어요 from 가.', 'draft'),
  ('15151515-1515-4151-8151-151515151503', '14141414-1414-4141-8141-141414141403', 'en', 'Change ㄷ to ㄹ: 듣 → 들.', 'draft'),
  ('15151515-1515-4151-8151-151515151504', '14141414-1414-4141-8141-141414141404', 'en', 'Add 어요: 들 → 듣어요.', 'draft'),
  ('15151515-1515-4151-8151-151515151505', '14141414-1414-4141-8141-141414141405', 'en', 'Add 어요 with contraction: 예쁘 → 예뻐요.', 'draft'),
  ('15151515-1515-4151-8151-151515151506', '14141414-1414-4141-8141-141414141406', 'en', 'Add 어요: 먹 → 먹어요.', 'draft'),
  ('15151515-1515-4151-8151-151515151507', '14141414-1414-4141-8141-141414141407', 'en', 'Apply 르 irregular: 오르 → 올라.', 'draft'),
  ('15151515-1515-4151-8151-151515151508', '14141414-1414-4141-8141-141414141408', 'en', 'Add 어요: 올라 → 올라요.', 'draft'),
  ('15151515-1515-4151-8151-151515151509', '14141414-1414-4141-8141-141414141409', 'en', 'Change ㅂ to 우: 쉽 → 쉼우.', 'draft'),
  ('15151515-1515-4151-8151-151515151511', '14141414-1414-4141-8141-141414141411', 'en', 'Add 어요 with contraction: 크 → 커요.', 'draft');

INSERT INTO public.hanja_characters (id, character, simplified_chinese, radical, stroke_count, status) VALUES
  ('16161616-1616-4161-8161-161616161601', '學', '学', '子', 16, 'draft'),
  ('16161616-1616-4161-8161-161616161602', '校', '校', '木', 10, 'draft'),
  ('16161616-1616-4161-8161-161616161603', '人', '人', '人', 2, 'draft'),
  ('16161616-1616-4161-8161-161616161604', '大', '大', '大', 3, 'draft');

INSERT INTO public.hanja_readings (id, character_id, reading_hangul, reading_romanization, is_primary, display_order, status) VALUES
  ('17171717-1717-4171-8171-171717171701', '16161616-1616-4161-8161-161616161601', '학', 'hak', true, 1, 'draft'),
  ('17171717-1717-4171-8171-171717171702', '16161616-1616-4161-8161-161616161602', '교', 'gyo', true, 1, 'draft'),
  ('17171717-1717-4171-8171-171717171703', '16161616-1616-4161-8161-161616161603', '인', 'in', true, 1, 'draft'),
  ('17171717-1717-4171-8171-171717171704', '16161616-1616-4161-8161-161616161603', '사람', 'saram', false, 2, 'draft'),
  ('17171717-1717-4171-8171-171717171705', '16161616-1616-4161-8161-161616161604', '대', 'dae', true, 1, 'draft');

INSERT INTO public.hanja_character_translations (id, character_id, locale, meaning, status) VALUES
  ('18181818-1818-4181-8181-181818181801', '16161616-1616-4161-8161-161616161601', 'en', 'study; learning', 'draft'),
  ('18181818-1818-4181-8181-181818181804', '16161616-1616-4161-8161-161616161602', 'en', 'school; correction', 'draft'),
  ('18181818-1818-4181-8181-181818181807', '16161616-1616-4161-8161-161616161603', 'en', 'person', 'draft'),
  ('18181818-1818-4181-8181-181818181810', '16161616-1616-4161-8161-161616161604', 'en', 'big; great', 'draft');

INSERT INTO public.hanja_terms (id, entry_id, slug, korean_hanja, simplified_chinese, is_primary, status) VALUES
  ('19191919-1919-4191-8191-191919191901', '11111111-1111-4111-8111-111111111104', 'hakgyo-hanja', '學校', '学校', true, 'draft'),
  ('19191919-1919-4191-8191-191919191902', '11111111-1111-4111-8111-111111111108', 'indae-hanja', '人大', '人大', false, 'draft'),
  ('19191919-1919-4191-8191-191919191903', '11111111-1111-4111-8111-111111111102', 'hak-hak-dup', '學學', '学学', false, 'draft');

INSERT INTO public.hanja_term_characters (id, term_id, character_id, reading_id, position) VALUES
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a01', '19191919-1919-4191-8191-191919191901', '16161616-1616-4161-8161-161616161601', '17171717-1717-4171-8171-171717171701', 1),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a02', '19191919-1919-4191-8191-191919191901', '16161616-1616-4161-8161-161616161602', '17171717-1717-4171-8171-171717171702', 2),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a03', '19191919-1919-4191-8191-191919191902', '16161616-1616-4161-8161-161616161603', '17171717-1717-4171-8171-171717171703', 1),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a04', '19191919-1919-4191-8191-191919191902', '16161616-1616-4161-8161-161616161604', '17171717-1717-4171-8171-171717171705', 2),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a05', '19191919-1919-4191-8191-191919191903', '16161616-1616-4161-8161-161616161601', '17171717-1717-4171-8171-171717171701', 1),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a06', '19191919-1919-4191-8191-191919191903', '16161616-1616-4161-8161-161616161601', '17171717-1717-4171-8171-171717171701', 2);

INSERT INTO public.hanja_term_character_translations (id, term_character_id, locale, meaning_in_term, status) VALUES
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b01', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a01', 'en', 'study', 'draft'),
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b04', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a02', 'en', 'school', 'draft'),
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b07', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a03', 'en', 'person', 'draft'),
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b08', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a04', 'en', 'big', 'draft'),
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b09', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a05', 'en', 'study (first)', 'draft'),
  ('1b1b1b1b-1b1b-41b1-81b1-1b1b1b1b1b10', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a06', 'en', 'study (second)', 'draft');

INSERT INTO public.idioms (id, slug, expression, expression_normalized, romanization, register, status) VALUES
  ('1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', 'sikeun-juk-meokgi', '식은 죽 먹기', '식은죽먹기', 'sikeun juk meokgi', 'informal', 'draft'),
  ('1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c02', 'bam-sae', '밤새', '밤새', 'bamsae', 'neutral', 'draft'),
  ('1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c03', 'son-jal-botda', '손을 잘 붙이다', '손을잘붙이다', 'soneul jal butida', 'neutral', 'draft');

INSERT INTO public.idiom_translations (id, idiom_id, locale, literal_meaning, actual_meaning, usage_scenario, status) VALUES
  ('1d1d1d1d-1d1d-41d1-81d1-1d1d1d1d1d01', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', 'en', 'eat cold porridge', 'very easy; a piece of cake', 'Casual conversation.', 'draft'),
  ('1d1d1d1d-1d1d-41d1-81d1-1d1d1d1d1d04', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c02', 'en', 'all night', 'through the night; overnight', 'Study or work contexts.', 'draft'),
  ('1d1d1d1d-1d1d-41d1-81d1-1d1d1d1d1d06', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c03', 'en', 'join hands well', 'be good at making things', 'Workplace praise.', 'draft');

INSERT INTO public.idiom_category_links (id, idiom_id, category) VALUES
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e01', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', 'daily'),
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e02', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', 'colloquial'),
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e03', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c02', 'daily'),
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e04', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c02', 'work-study'),
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e05', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c03', 'work-study'),
  ('1e1e1e1e-1e1e-41e1-81e1-1e1e1e1e1e06', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c03', 'relationship');

INSERT INTO public.idiom_examples (id, idiom_id, example_id, display_order) VALUES
  ('1f1f1f1f-1f1f-41f1-81f1-1f1f1f1f1f01', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', '44444444-4444-4444-8444-444444444407', 1);

INSERT INTO public.idiom_entry_links (id, idiom_id, entry_id, link_note) VALUES
  ('20000000-2000-4000-8000-000000000001', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', '11111111-1111-4111-8111-111111111107', 'Links to 쉽다 (easy)');

INSERT INTO public.idiom_relations (id, source_idiom_id, target_idiom_id, relation_type) VALUES
  ('21000000-2100-4100-8100-000000000001', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c02', 'related');

INSERT INTO public.sources (id, source_type, title, author_or_org, publisher, license, verification_status, is_publicly_displayed) VALUES
  ('22000000-2200-4200-8200-000000000001', 'dictionary', 'Synthetic Test Dictionary', 'KR Test Lab', 'Test Press', 'CC-BY-4.0 (synthetic)', 'verified', true),
  ('22000000-2200-4200-8200-000000000002', 'original_editorial', 'Internal Editorial Notes', 'KR Test Lab', NULL, NULL, 'unverified', false),
  ('22000000-2200-4200-8200-000000000003', 'textbook', 'Synthetic Korean Grammar Textbook', 'Test Authors', 'Test Publisher', 'All rights reserved (synthetic)', 'verified', true);

INSERT INTO public.content_sources (id, source_id, entry_id, sense_id, example_id, sound_change_rule_id, conjugation_rule_id, conjugation_result_id, hanja_character_id, hanja_term_id, idiom_id, citation_note) VALUES
  ('23000000-2300-4300-8300-000000000001', '22000000-2200-4200-8200-000000000001', '11111111-1111-4111-8111-111111111101', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Synthetic entry citation'),
  ('23000000-2300-4300-8300-000000000002', '22000000-2200-4200-8200-000000000002', NULL, NULL, NULL, '88888888-8888-4888-8888-888888888802', NULL, NULL, NULL, NULL, NULL, 'Internal batchim notes'),
  ('23000000-2300-4300-8300-000000000003', '22000000-2200-4200-8200-000000000003', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1c1c1c1c-1c1c-41c1-81c1-1c1c1c1c1c01', 'Textbook idiom reference');

UPDATE public.sense_translations SET status = 'published'
WHERE id::text LIKE '33333333-%' AND locale = 'en'
  AND sense_id IN (SELECT id FROM public.senses WHERE entry_id::text LIKE '11111111-%'
    AND entry_id NOT IN ('11111111-1111-4111-8111-111111111109', '11111111-1111-4111-8111-111111111110'));

UPDATE public.sense_translations SET status = 'published'
WHERE id::text LIKE '33333333-%' AND locale IN ('zh', 'ja')
  AND sense_id IN (SELECT id FROM public.senses WHERE entry_id::text LIKE '11111111-%'
    AND entry_id NOT IN ('11111111-1111-4111-8111-111111111109', '11111111-1111-4111-8111-111111111110'));

UPDATE public.senses SET status = 'published'
WHERE id::text LIKE '22222222-%' AND entry_id::text LIKE '11111111-%'
  AND entry_id NOT IN ('11111111-1111-4111-8111-111111111109', '11111111-1111-4111-8111-111111111110');

UPDATE public.entries SET status = 'published'
WHERE id::text LIKE '11111111-%' AND slug NOT IN ('test-draft', 'test-review');

UPDATE public.example_translations SET status = 'published' WHERE id::text LIKE '55555555-%';
UPDATE public.examples SET status = 'published' WHERE id::text LIKE '44444444-%';
UPDATE public.sound_change_translations SET status = 'published' WHERE id::text LIKE '99999999-%' AND locale = 'en';
UPDATE public.sound_change_step_translations SET status = 'published' WHERE id::text LIKE 'bbbbbbbb-%' AND locale = 'en';
UPDATE public.sound_change_rules SET status = 'published' WHERE id::text LIKE '88888888-%';
UPDATE public.conjugation_form_translations SET status = 'published' WHERE id::text LIKE 'ffffffff-%';
UPDATE public.conjugation_forms SET status = 'published' WHERE id::text LIKE 'eeeeeeee-%';
UPDATE public.conjugation_rule_translations SET status = 'published' WHERE id::text LIKE '12121212-%' AND locale = 'en';
UPDATE public.conjugation_rules SET status = 'published' WHERE id::text LIKE '10101010-%';
UPDATE public.conjugation_result_step_translations SET status = 'published' WHERE id::text LIKE '15151515-%' AND locale = 'en';
UPDATE public.conjugation_results SET status = 'published' WHERE id::text LIKE '13131313-%';
UPDATE public.hanja_character_translations SET status = 'published' WHERE id::text LIKE '18181818-%' AND locale = 'en';
UPDATE public.hanja_readings SET status = 'published' WHERE id::text LIKE '17171717-%';
UPDATE public.hanja_characters SET status = 'published' WHERE id::text LIKE '16161616-%';
UPDATE public.hanja_term_character_translations SET status = 'published' WHERE id::text LIKE '1b1b1b1b-%' AND locale = 'en';
UPDATE public.hanja_terms SET status = 'published' WHERE id::text LIKE '19191919-%';
UPDATE public.idiom_translations SET status = 'published' WHERE id::text LIKE '1d1d1d1d-%' AND locale = 'en';
UPDATE public.idioms SET status = 'published' WHERE id::text LIKE '1c1c1c1c-%';

COMMIT;
