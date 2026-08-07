-- Phase 6A: shared foundation (extensions, timestamps, slug helper)
-- Canonical codes align with src/lib/constants/ (Phase 5.1)

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Phase 6B: deny automatic table/sequence/function grants to API roles.
-- Migration 10 explicitly GRANTs read-only SELECT on public content tables.
-- Does not revoke USAGE on schema public (required for anon/authenticated).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE
  ON TABLES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT
  ON SEQUENCES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE
  ON FUNCTIONS
  FROM PUBLIC, anon, authenticated, service_role;

-- Slug pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
-- Applied via CHECK on each slug column (not a generated column).

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_publication_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME IN (
    'entry_translations', 'sense_translations', 'example_translations',
    'sound_change_translations', 'sound_change_step_translations',
    'conjugation_form_translations', 'conjugation_rule_translations',
    'conjugation_result_step_translations', 'hanja_character_translations',
    'hanja_term_character_translations', 'idiom_translations'
  ) THEN
    IF NEW.status = 'published'
      AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
      NEW.published_at = COALESCE(NEW.published_at, pg_catalog.now());
    ELSIF NEW.status IS DISTINCT FROM 'published' THEN
      NEW.published_at = NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'published'
    AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at = COALESCE(NEW.published_at, pg_catalog.now());
    NEW.archived_at = NULL;
  ELSIF NEW.status = 'archived' THEN
    NEW.archived_at = COALESCE(NEW.archived_at, pg_catalog.now());
  ELSIF NEW.status IN ('draft', 'in_review') THEN
    NEW.published_at = NULL;
    NEW.archived_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Sets updated_at to now() on row update.';
COMMENT ON FUNCTION public.sync_publication_timestamps() IS
  'Syncs published_at / archived_at when publication status changes.';
