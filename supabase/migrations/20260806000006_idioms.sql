-- Phase 6A: idioms, category links, relations

CREATE TABLE public.idioms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  slug text NOT NULL,
  expression text NOT NULL,
  expression_normalized text NOT NULL,
  romanization text,
  romanization_normalized text,
  register text NOT NULL DEFAULT 'neutral',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT idioms_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT idioms_expression_nonempty CHECK (btrim(expression) <> ''),
  CONSTRAINT idioms_expression_normalized_nonempty CHECK (btrim(expression_normalized) <> ''),
  CONSTRAINT idioms_register_check CHECK (
    register IN ('formal', 'informal', 'neutral')
  ),
  CONSTRAINT idioms_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX idioms_slug_unique ON public.idioms (slug);
CREATE UNIQUE INDEX idioms_import_key_unique ON public.idioms (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX idioms_status_idx ON public.idioms (status);
CREATE INDEX idioms_expression_normalized_idx ON public.idioms (expression_normalized);
CREATE INDEX idioms_expression_normalized_trgm_idx ON public.idioms
  USING gin (expression_normalized extensions.gin_trgm_ops);

CREATE TABLE public.idiom_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  locale text NOT NULL,
  literal_meaning text,
  actual_meaning text NOT NULL,
  usage_scenario text,
  common_misuse text,
  nuance_note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT idiom_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT idiom_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT idiom_translations_actual_meaning_nonempty CHECK (btrim(actual_meaning) <> ''),
  CONSTRAINT idiom_translations_unique_locale UNIQUE (idiom_id, locale)
);

CREATE UNIQUE INDEX idiom_translations_import_key_unique ON public.idiom_translations (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX idiom_translations_idiom_id_idx ON public.idiom_translations (idiom_id);
CREATE INDEX idiom_translations_locale_idx ON public.idiom_translations (locale);
CREATE INDEX idiom_translations_status_idx ON public.idiom_translations (status);

CREATE TABLE public.idiom_category_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idiom_category_links_category_check CHECK (
    category IN (
      'daily', 'emotion', 'relationship', 'work-study',
      'body', 'animal', 'formal', 'colloquial'
    )
  ),
  CONSTRAINT idiom_category_links_unique UNIQUE (idiom_id, category)
);

CREATE INDEX idiom_category_links_idiom_id_idx ON public.idiom_category_links (idiom_id);
CREATE INDEX idiom_category_links_category_idx ON public.idiom_category_links (category);

CREATE TABLE public.idiom_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  example_id uuid NOT NULL REFERENCES public.examples (id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idiom_examples_unique UNIQUE (idiom_id, example_id),
  CONSTRAINT idiom_examples_display_order_positive CHECK (display_order > 0)
);

CREATE INDEX idiom_examples_idiom_id_idx ON public.idiom_examples (idiom_id);
CREATE INDEX idiom_examples_example_id_idx ON public.idiom_examples (example_id);

CREATE TABLE public.idiom_entry_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  link_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idiom_entry_links_unique UNIQUE (idiom_id, entry_id)
);

CREATE INDEX idiom_entry_links_idiom_id_idx ON public.idiom_entry_links (idiom_id);
CREATE INDEX idiom_entry_links_entry_id_idx ON public.idiom_entry_links (entry_id);

CREATE TABLE public.idiom_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  target_idiom_id uuid NOT NULL REFERENCES public.idioms (id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idiom_relations_no_self CHECK (source_idiom_id <> target_idiom_id),
  CONSTRAINT idiom_relations_type_check CHECK (
    relation_type IN ('related', 'synonym', 'confusable', 'see_also')
  ),
  CONSTRAINT idiom_relations_unique UNIQUE (source_idiom_id, target_idiom_id, relation_type)
);

CREATE INDEX idiom_relations_source_idx ON public.idiom_relations (source_idiom_id);
CREATE INDEX idiom_relations_target_idx ON public.idiom_relations (target_idiom_id);

CREATE TRIGGER idioms_set_updated_at
  BEFORE UPDATE ON public.idioms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER idioms_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.idioms
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER idiom_translations_set_updated_at
  BEFORE UPDATE ON public.idiom_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER idiom_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.idiom_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();
