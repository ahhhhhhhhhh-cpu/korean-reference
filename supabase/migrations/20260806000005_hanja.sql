-- Phase 6A: hanja characters, readings, terms

CREATE TABLE public.hanja_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  character text NOT NULL,
  simplified_chinese text,
  japanese_shinjitai text,
  radical text,
  stroke_count smallint,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT hanja_characters_character_nonempty CHECK (btrim(character) <> ''),
  CONSTRAINT hanja_characters_stroke_count_positive CHECK (
    stroke_count IS NULL OR stroke_count > 0
  ),
  CONSTRAINT hanja_characters_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX hanja_characters_character_unique ON public.hanja_characters (character);
CREATE UNIQUE INDEX hanja_characters_import_key_unique ON public.hanja_characters (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX hanja_characters_status_idx ON public.hanja_characters (status);
CREATE INDEX hanja_characters_character_trgm_idx ON public.hanja_characters
  USING gin (character extensions.gin_trgm_ops);

CREATE TABLE public.hanja_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  character_id uuid NOT NULL REFERENCES public.hanja_characters (id) ON DELETE CASCADE,
  reading_hangul text NOT NULL,
  reading_romanization text,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT hanja_readings_reading_hangul_nonempty CHECK (btrim(reading_hangul) <> ''),
  CONSTRAINT hanja_readings_display_order_positive CHECK (display_order > 0),
  CONSTRAINT hanja_readings_unique_reading UNIQUE (character_id, reading_hangul),
  CONSTRAINT hanja_readings_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX hanja_readings_one_primary_per_character
  ON public.hanja_readings (character_id) WHERE is_primary = true;
CREATE UNIQUE INDEX hanja_readings_import_key_unique ON public.hanja_readings (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX hanja_readings_character_id_idx ON public.hanja_readings (character_id);

CREATE TABLE public.hanja_character_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  character_id uuid NOT NULL REFERENCES public.hanja_characters (id) ON DELETE CASCADE,
  locale text NOT NULL,
  meaning text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT hanja_character_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT hanja_character_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT hanja_character_translations_meaning_nonempty CHECK (btrim(meaning) <> ''),
  CONSTRAINT hanja_character_translations_unique_locale UNIQUE (character_id, locale)
);

CREATE UNIQUE INDEX hanja_character_translations_import_key_unique
  ON public.hanja_character_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX hanja_character_translations_character_id_idx
  ON public.hanja_character_translations (character_id);

CREATE TABLE public.hanja_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  slug text NOT NULL,
  korean_hanja text NOT NULL,
  simplified_chinese text,
  japanese_shinjitai text,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT hanja_terms_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT hanja_terms_korean_hanja_nonempty CHECK (btrim(korean_hanja) <> ''),
  CONSTRAINT hanja_terms_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX hanja_terms_slug_unique ON public.hanja_terms (slug);
CREATE UNIQUE INDEX hanja_terms_one_primary_per_entry ON public.hanja_terms (entry_id)
  WHERE entry_id IS NOT NULL AND is_primary = true;
CREATE UNIQUE INDEX hanja_terms_import_key_unique ON public.hanja_terms (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX hanja_terms_entry_id_idx ON public.hanja_terms (entry_id);
CREATE INDEX hanja_terms_status_idx ON public.hanja_terms (status);
CREATE INDEX hanja_terms_korean_hanja_idx ON public.hanja_terms (korean_hanja);
CREATE INDEX hanja_terms_korean_hanja_trgm_idx ON public.hanja_terms
  USING gin (korean_hanja extensions.gin_trgm_ops);

CREATE TABLE public.hanja_term_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES public.hanja_terms (id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.hanja_characters (id) ON DELETE RESTRICT,
  reading_id uuid REFERENCES public.hanja_readings (id) ON DELETE SET NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hanja_term_characters_position_positive CHECK (position > 0),
  CONSTRAINT hanja_term_characters_unique_position UNIQUE (term_id, position)
);

CREATE INDEX hanja_term_characters_term_id_idx ON public.hanja_term_characters (term_id);
CREATE INDEX hanja_term_characters_character_id_idx ON public.hanja_term_characters (character_id);
CREATE INDEX hanja_term_characters_reading_id_idx ON public.hanja_term_characters (reading_id);

CREATE TABLE public.hanja_term_character_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  term_character_id uuid NOT NULL REFERENCES public.hanja_term_characters (id) ON DELETE CASCADE,
  locale text NOT NULL,
  meaning_in_term text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT hanja_term_character_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT hanja_term_character_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT hanja_term_character_translations_meaning_nonempty CHECK (btrim(meaning_in_term) <> ''),
  CONSTRAINT hanja_term_character_translations_unique_locale UNIQUE (term_character_id, locale)
);

CREATE UNIQUE INDEX hanja_term_character_translations_import_key_unique
  ON public.hanja_term_character_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX hanja_term_character_translations_term_character_id_idx
  ON public.hanja_term_character_translations (term_character_id);

CREATE OR REPLACE FUNCTION public.validate_hanja_term_character_reading()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_reading_character_id uuid;
BEGIN
  IF NEW.reading_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT character_id INTO v_reading_character_id
  FROM public.hanja_readings WHERE id = NEW.reading_id;

  IF v_reading_character_id IS NULL OR v_reading_character_id <> NEW.character_id THEN
    RAISE EXCEPTION 'reading_id must belong to the same character_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER hanja_term_characters_validate_reading
  BEFORE INSERT OR UPDATE ON public.hanja_term_characters
  FOR EACH ROW EXECUTE FUNCTION public.validate_hanja_term_character_reading();

CREATE TRIGGER hanja_characters_set_updated_at
  BEFORE UPDATE ON public.hanja_characters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER hanja_characters_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.hanja_characters
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER hanja_readings_set_updated_at
  BEFORE UPDATE ON public.hanja_readings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER hanja_readings_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.hanja_readings
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER hanja_character_translations_set_updated_at
  BEFORE UPDATE ON public.hanja_character_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER hanja_character_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.hanja_character_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER hanja_terms_set_updated_at
  BEFORE UPDATE ON public.hanja_terms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER hanja_terms_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.hanja_terms
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER hanja_term_character_translations_set_updated_at
  BEFORE UPDATE ON public.hanja_term_character_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER hanja_term_character_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.hanja_term_character_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();
