# Migration Review Checklist — Korean Reference

> **Status:** Phase 7C-4B-1R-A4 complete — local pgTAP **72/72** PASS (schema 22, integrity 19, rls 13, conjugation_taxonomy 14, part_of_speech 4). Remote dev + prod at migration **13/13**.

Last updated: 2026-08-08

---

## Phase 6B results (local apply)

- `supabase start` + `db reset --local`: all migrations 000001–000011 apply cleanly
- 39 public business tables; 39/39 RLS enabled
- pgTAP: `schema.test.sql` (22), `integrity.test.sql` (19), `rls.test.sql` (13), `conjugation_taxonomy.test.sql` (14), `part_of_speech.test.sql` (4) — **72 total**
- No PostgreSQL migration errors (only NOTICE: long trigger name truncation)
- **Not linked** to remote; no seed

---

### Migration 01 — default privilege lockdown

Before any project tables/functions, `postgres` default privileges in `public` REVOKE table DML, sequence access, and function EXECUTE from `PUBLIC`, `anon`, `authenticated`, `service_role`. Does **not** revoke schema `USAGE`.

### Migration 10 — explicit read-only Data API GRANTs

After all RLS policies, `GRANT SELECT` on **38** public content tables to `anon, authenticated`. **`feedback` excluded** — no table grants; RLS deny-all policies remain; `submit_feedback()` still REVOKED from PUBLIC/anon/authenticated.

---

## Phase 6A.4 changes (final static blockers)

### 1. Feedback BEFORE DELETE (atomic flag + FK clear)

Each `trg_mark_feedback_*_target_deleted()` now sets **both** in one UPDATE:

```sql
SET target_was_deleted = true, <target_fk> = NULL
```

Flow: `feedback(entry_id=X, deleted=false)` → DELETE parent → BEFORE DELETE clears FK + sets flag → CHECK passes → parent deleted → FK SET NULL is no-op.

CHECK is **not** relaxed.

### 2. Hanja Term ↔ RLS alignment

`validate_hanja_term_publishable()` now requires:

- Every linked `hanja_character.status = 'published'`
- If `reading_id` set: `hanja_readings.status = 'published'` and same `character_id`

Reverse deferred triggers:

| Trigger | Event | Revalidates |
|---------|-------|-------------|
| `hanja_characters_revalidate_published_hanja_terms` | `hanja_characters` UPDATE OF status | published terms using character |
| `hanja_readings_revalidate_published_hanja_terms` | `hanja_readings` UPDATE OF status | published terms using reading |

### 3. Example provenance vs Source type

| Column | Table | Meaning |
|--------|-------|---------|
| `provenance_type` | `examples` | How the example text was obtained: `original`, `adapted`, `quoted`, `licensed`, `public_domain`, `unknown` |
| `source_type` | `sources` | What kind of reference work the source is: `dictionary`, `book`, etc. |

`validate_example_publishable()`:

- `original`: no external attribution required
- `adapted` / `quoted` / `licensed` / `public_domain`: `source_note` OR `content_sources` link
- `licensed`: also `license_note` OR linked source with non-empty `license`
- `unknown`: **cannot** be published

### 4. entry_examples uniqueness

Removed `UNIQUE (entry_id, example_id)`. Added:

- `(entry_id, example_id) WHERE sense_id IS NULL`
- `(entry_id, example_id, sense_id) WHERE sense_id IS NOT NULL`

Same example may link to different senses of one entry.

### 5. English publish completeness

| Validator | Published English requires |
|-----------|---------------------------|
| `validate_sound_change_rule_publishable` | `name` + `description` non-empty |
| `validate_conjugation_rule_publishable` | `title` + `explanation` non-empty |

---

## Validator ↔ RLS consistency (post-6A.4)

| Entity | Validator deps | RLS hides unpublished deps? | Aligned? |
|--------|----------------|----------------------------|----------|
| entry | senses + EN translations | sense_translations policy checks entry | ✅ |
| example | translations + provenance | example_translations checks example | ✅ |
| sound_change_rule | EN name+description, steps | translations/steps check rule | ✅ |
| conjugation_form | EN name | translations check form | ✅ |
| conjugation_rule | EN title+explanation | translations check rule | ✅ |
| conjugation_result | entry, form, rule?, steps | results policy checks entry/form/rule | ✅ |
| hanja_character | readings + EN meaning | readings/translations check character | ✅ |
| hanja_term | entry, published characters/readings, slots | term_characters checks term+entry+character | ✅ |
| idiom | EN actual_meaning | translations check idiom | ✅ |

---

## Prior phases (summary)

- **6A.1–6A.3:** deferred triggers, RLS parent chains, function lockdown, `submit_feedback` suspended, `target_was_deleted`, etc.
- **Migration 11:** consolidation marker only
- **Feedback RPC:** REVOKED from anon/authenticated until Phase 6B Route Handler

---

## Pre-Phase-6B checklist

- [x] Static SQL review through 6A.4
- [x] Migration 01 default privilege lockdown
- [x] Migration 10 explicit GRANT SELECT (38 tables, no feedback)
- [x] Docker Desktop available and running
- [x] `npm install supabase --save-dev` + `supabase init`
- [x] `supabase start` + `db reset --local`
- [x] pgTAP tests (`supabase/tests/*.sql`) + `supabase test db --local` — 54 PASS
- [ ] Phase 6C: test seed + Supabase Adapter

**Not connected. Not executed. No seed. No login/link.**
