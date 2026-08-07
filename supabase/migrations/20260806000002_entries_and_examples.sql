-- Phase 6A: entries, senses, examples, relations

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  slug text NOT NULL,
  headword text NOT NULL,
  headword_normalized text NOT NULL,
  romanization text,
  romanization_normalized text,
  pronunciation_hangul text,
  pronunciation_romanization text,
  part_of_speech text NOT NULL,
  etymology_type text,
  stem text,
  irregular_type text,
  difficulty_level text,
  frequency_level text,
  topik_level smallint,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT entries_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT entries_headword_nonempty CHECK (btrim(headword) <> ''),
  CONSTRAINT entries_headword_normalized_nonempty CHECK (btrim(headword_normalized) <> ''),
  CONSTRAINT entries_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  ),
  CONSTRAINT entries_part_of_speech_check CHECK (
    part_of_speech IN ('verb', 'adjective', 'noun', 'adverb', 'particle', 'other')
  ),
  CONSTRAINT entries_etymology_type_check CHECK (
    etymology_type IS NULL
    OR etymology_type IN ('native', 'sino_korean', 'loanword', 'hybrid', 'unknown')
  ),
  CONSTRAINT entries_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', '르', 'ㅎ', 'ㅅ', 'ㅡ', 'ㄹ')
  ),
  CONSTRAINT entries_difficulty_level_check CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('beginner', 'intermediate', 'advanced')
  ),
  CONSTRAINT entries_frequency_level_check CHECK (
    frequency_level IS NULL
    OR frequency_level IN ('high', 'medium', 'low')
  ),
  CONSTRAINT entries_topik_level_check CHECK (
    topik_level IS NULL OR (topik_level >= 1 AND topik_level <= 6)
  ),
  CONSTRAINT entries_romanization_nonempty CHECK (
    romanization IS NULL OR btrim(romanization) <> ''
  ),
  CONSTRAINT entries_romanization_normalized_nonempty CHECK (
    romanization_normalized IS NULL OR btrim(romanization_normalized) <> ''
  )
);

CREATE UNIQUE INDEX entries_slug_unique ON public.entries (slug);
CREATE UNIQUE INDEX entries_import_key_unique ON public.entries (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX entries_status_idx ON public.entries (status);
CREATE INDEX entries_headword_idx ON public.entries (headword);
CREATE INDEX entries_headword_normalized_idx ON public.entries (headword_normalized);
CREATE INDEX entries_romanization_normalized_idx ON public.entries (romanization_normalized)
  WHERE romanization_normalized IS NOT NULL;
CREATE INDEX entries_headword_trgm_idx ON public.entries
  USING gin (headword extensions.gin_trgm_ops);
CREATE INDEX entries_headword_normalized_trgm_idx ON public.entries
  USING gin (headword_normalized extensions.gin_trgm_ops);

CREATE TABLE public.entry_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  locale text NOT NULL,
  irregular_note text,
  etymology_note text,
  general_note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT entry_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT entry_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT entry_translations_unique_locale UNIQUE (entry_id, locale)
);

CREATE UNIQUE INDEX entry_translations_import_key_unique ON public.entry_translations (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX entry_translations_entry_id_idx ON public.entry_translations (entry_id);
CREATE INDEX entry_translations_locale_idx ON public.entry_translations (locale);
CREATE INDEX entry_translations_status_idx ON public.entry_translations (status);

CREATE TABLE public.entry_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  alias_type text NOT NULL,
  alias text NOT NULL,
  alias_normalized text NOT NULL,
  script text NOT NULL DEFAULT 'hangul',
  locale text,
  is_searchable boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT entry_aliases_alias_type_check CHECK (
    alias_type IN (
      'formal_variant', 'common_variant', 'old_romanization',
      'search_keyword', 'abbreviation', 'common_misspelling'
    )
  ),
  CONSTRAINT entry_aliases_alias_nonempty CHECK (btrim(alias) <> ''),
  CONSTRAINT entry_aliases_alias_normalized_nonempty CHECK (btrim(alias_normalized) <> ''),
  CONSTRAINT entry_aliases_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  ),
  CONSTRAINT entry_aliases_locale_check CHECK (
    locale IS NULL OR locale IN ('en', 'zh', 'ja')
  )
);

CREATE UNIQUE INDEX entry_aliases_import_key_unique ON public.entry_aliases (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX entry_aliases_entry_id_idx ON public.entry_aliases (entry_id);
CREATE INDEX entry_aliases_alias_normalized_idx ON public.entry_aliases (alias_normalized);
CREATE INDEX entry_aliases_alias_normalized_trgm_idx ON public.entry_aliases
  USING gin (alias_normalized extensions.gin_trgm_ops);

CREATE TABLE public.senses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  sense_order integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  register text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT senses_sense_order_positive CHECK (sense_order > 0),
  CONSTRAINT senses_register_check CHECK (
    register IS NULL OR register IN ('formal', 'informal', 'neutral')
  ),
  CONSTRAINT senses_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  ),
  CONSTRAINT senses_unique_order UNIQUE (entry_id, sense_order)
);

CREATE UNIQUE INDEX senses_one_primary_per_entry ON public.senses (entry_id)
  WHERE is_primary = true;
CREATE UNIQUE INDEX senses_import_key_unique ON public.senses (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX senses_entry_id_idx ON public.senses (entry_id);
CREATE INDEX senses_status_idx ON public.senses (status);

CREATE TABLE public.sense_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  sense_id uuid NOT NULL REFERENCES public.senses (id) ON DELETE CASCADE,
  locale text NOT NULL,
  short_definition text,
  definition text,
  usage_note text,
  nuance_note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT sense_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT sense_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT sense_translations_unique_locale UNIQUE (sense_id, locale),
  CONSTRAINT sense_translations_has_content CHECK (
    (short_definition IS NOT NULL AND btrim(short_definition) <> '')
    OR (definition IS NOT NULL AND btrim(definition) <> '')
    OR status <> 'published'
  )
);

CREATE UNIQUE INDEX sense_translations_import_key_unique ON public.sense_translations (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX sense_translations_sense_id_idx ON public.sense_translations (sense_id);
CREATE INDEX sense_translations_locale_idx ON public.sense_translations (locale);
CREATE INDEX sense_translations_status_idx ON public.sense_translations (status);

CREATE TABLE public.examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  korean_text text NOT NULL,
  korean_text_normalized text NOT NULL,
  romanization text,
  register text,
  difficulty_level text,
  provenance_type text NOT NULL DEFAULT 'original',
  source_note text,
  license_note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT examples_korean_text_nonempty CHECK (btrim(korean_text) <> ''),
  CONSTRAINT examples_korean_text_normalized_nonempty CHECK (btrim(korean_text_normalized) <> ''),
  CONSTRAINT examples_register_check CHECK (
    register IS NULL OR register IN ('formal', 'informal', 'neutral')
  ),
  CONSTRAINT examples_difficulty_level_check CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('beginner', 'intermediate', 'advanced')
  ),
  CONSTRAINT examples_provenance_type_check CHECK (
    provenance_type IN (
      'original', 'adapted', 'quoted', 'licensed', 'public_domain', 'unknown'
    )
  ),
  CONSTRAINT examples_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX examples_import_key_unique ON public.examples (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX examples_status_idx ON public.examples (status);
CREATE INDEX examples_korean_text_normalized_idx ON public.examples (korean_text_normalized);
CREATE INDEX examples_korean_text_normalized_trgm_idx ON public.examples
  USING gin (korean_text_normalized extensions.gin_trgm_ops);

CREATE TABLE public.example_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  example_id uuid NOT NULL REFERENCES public.examples (id) ON DELETE CASCADE,
  locale text NOT NULL,
  translation text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT example_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT example_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT example_translations_translation_nonempty CHECK (btrim(translation) <> ''),
  CONSTRAINT example_translations_unique_locale UNIQUE (example_id, locale)
);

CREATE UNIQUE INDEX example_translations_import_key_unique ON public.example_translations (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX example_translations_example_id_idx ON public.example_translations (example_id);
CREATE INDEX example_translations_locale_idx ON public.example_translations (locale);
CREATE INDEX example_translations_status_idx ON public.example_translations (status);

CREATE TABLE public.entry_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  example_id uuid NOT NULL REFERENCES public.examples (id) ON DELETE CASCADE,
  sense_id uuid REFERENCES public.senses (id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entry_examples_display_order_positive CHECK (display_order > 0)
);

CREATE UNIQUE INDEX entry_examples_unique_without_sense
  ON public.entry_examples (entry_id, example_id)
  WHERE sense_id IS NULL;
CREATE UNIQUE INDEX entry_examples_unique_with_sense
  ON public.entry_examples (entry_id, example_id, sense_id)
  WHERE sense_id IS NOT NULL;

CREATE INDEX entry_examples_entry_id_idx ON public.entry_examples (entry_id);
CREATE INDEX entry_examples_example_id_idx ON public.entry_examples (example_id);
CREATE INDEX entry_examples_sense_id_idx ON public.entry_examples (sense_id);

CREATE TABLE public.entry_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  target_entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entry_relations_no_self CHECK (source_entry_id <> target_entry_id),
  CONSTRAINT entry_relations_type_check CHECK (
    relation_type IN (
      'related', 'synonym', 'antonym', 'confusable',
      'see_also', 'derived_from', 'variant_of'
    )
  ),
  CONSTRAINT entry_relations_unique UNIQUE (source_entry_id, target_entry_id, relation_type)
);

CREATE INDEX entry_relations_source_idx ON public.entry_relations (source_entry_id);
CREATE INDEX entry_relations_target_idx ON public.entry_relations (target_entry_id);

-- Ensure sense_id belongs to entry_id when linking examples
CREATE OR REPLACE FUNCTION public.validate_entry_example_sense()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_sense_entry_id uuid;
BEGIN
  IF NEW.sense_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT entry_id INTO v_sense_entry_id FROM public.senses WHERE id = NEW.sense_id;
  IF v_sense_entry_id IS NULL OR v_sense_entry_id <> NEW.entry_id THEN
    RAISE EXCEPTION 'sense_id must belong to the same entry_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER entry_examples_validate_sense
  BEFORE INSERT OR UPDATE ON public.entry_examples
  FOR EACH ROW EXECUTE FUNCTION public.validate_entry_example_sense();

CREATE TRIGGER entries_set_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER entries_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER entry_translations_set_updated_at
  BEFORE UPDATE ON public.entry_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER entry_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.entry_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER entry_aliases_set_updated_at
  BEFORE UPDATE ON public.entry_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER entry_aliases_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.entry_aliases
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER senses_set_updated_at
  BEFORE UPDATE ON public.senses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER senses_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.senses
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER sense_translations_set_updated_at
  BEFORE UPDATE ON public.sense_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sense_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.sense_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER examples_set_updated_at
  BEFORE UPDATE ON public.examples
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER examples_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.examples
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER example_translations_set_updated_at
  BEFORE UPDATE ON public.example_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER example_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.example_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();
