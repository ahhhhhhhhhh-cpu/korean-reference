-- Phase 6A: sources and content attribution

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  source_type text NOT NULL,
  title text NOT NULL,
  author_or_org text,
  publisher text,
  url text,
  publication_date date,
  accessed_at timestamptz,
  license text,
  notes text,
  verification_status text NOT NULL DEFAULT 'unverified',
  is_publicly_displayed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sources_source_type_check CHECK (
    source_type IN (
      'dictionary', 'academic_paper', 'book', 'textbook', 'article',
      'official_website', 'corpus', 'licensed_dataset', 'original_editorial', 'other'
    )
  ),
  CONSTRAINT sources_title_nonempty CHECK (btrim(title) <> ''),
  CONSTRAINT sources_verification_status_check CHECK (
    verification_status IN ('unverified', 'verified', 'deprecated', 'rejected')
  )
);

CREATE UNIQUE INDEX sources_import_key_unique ON public.sources (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX sources_source_type_idx ON public.sources (source_type);
CREATE INDEX sources_verification_status_idx ON public.sources (verification_status);

CREATE TABLE public.content_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources (id) ON DELETE RESTRICT,
  entry_id uuid REFERENCES public.entries (id) ON DELETE CASCADE,
  sense_id uuid REFERENCES public.senses (id) ON DELETE CASCADE,
  example_id uuid REFERENCES public.examples (id) ON DELETE CASCADE,
  sound_change_rule_id uuid REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  conjugation_rule_id uuid REFERENCES public.conjugation_rules (id) ON DELETE CASCADE,
  conjugation_result_id uuid REFERENCES public.conjugation_results (id) ON DELETE CASCADE,
  hanja_character_id uuid REFERENCES public.hanja_characters (id) ON DELETE CASCADE,
  hanja_term_id uuid REFERENCES public.hanja_terms (id) ON DELETE CASCADE,
  idiom_id uuid REFERENCES public.idioms (id) ON DELETE CASCADE,
  citation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_sources_exactly_one_target CHECK (
    num_nonnulls(
      entry_id, sense_id, example_id, sound_change_rule_id,
      conjugation_rule_id, conjugation_result_id, hanja_character_id,
      hanja_term_id, idiom_id
    ) = 1
  )
);

CREATE INDEX content_sources_source_id_idx ON public.content_sources (source_id);
CREATE INDEX content_sources_entry_id_idx ON public.content_sources (entry_id);
CREATE INDEX content_sources_sense_id_idx ON public.content_sources (sense_id);
CREATE INDEX content_sources_example_id_idx ON public.content_sources (example_id);
CREATE INDEX content_sources_sound_change_rule_id_idx ON public.content_sources (sound_change_rule_id);
CREATE INDEX content_sources_conjugation_rule_id_idx ON public.content_sources (conjugation_rule_id);
CREATE INDEX content_sources_conjugation_result_id_idx ON public.content_sources (conjugation_result_id);
CREATE INDEX content_sources_hanja_character_id_idx ON public.content_sources (hanja_character_id);
CREATE INDEX content_sources_hanja_term_id_idx ON public.content_sources (hanja_term_id);
CREATE INDEX content_sources_idiom_id_idx ON public.content_sources (idiom_id);

CREATE UNIQUE INDEX content_sources_unique_entry
  ON public.content_sources (source_id, entry_id) WHERE entry_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_sense
  ON public.content_sources (source_id, sense_id) WHERE sense_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_example
  ON public.content_sources (source_id, example_id) WHERE example_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_sound_change_rule
  ON public.content_sources (source_id, sound_change_rule_id) WHERE sound_change_rule_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_conjugation_rule
  ON public.content_sources (source_id, conjugation_rule_id) WHERE conjugation_rule_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_conjugation_result
  ON public.content_sources (source_id, conjugation_result_id) WHERE conjugation_result_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_hanja_character
  ON public.content_sources (source_id, hanja_character_id) WHERE hanja_character_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_hanja_term
  ON public.content_sources (source_id, hanja_term_id) WHERE hanja_term_id IS NOT NULL;
CREATE UNIQUE INDEX content_sources_unique_idiom
  ON public.content_sources (source_id, idiom_id) WHERE idiom_id IS NOT NULL;

CREATE TRIGGER sources_set_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
