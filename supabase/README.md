# Supabase Migrations — Korean Reference

> **Status:** Phase 7B complete — **`korean-reference-prod`** schema deployed (11/11 migrations, no seed). **`korean-reference-dev`** unchanged.

## Migration order

Apply in timestamp order under `supabase/migrations/`:

| # | File | Purpose |
|---|------|---------|
| 1 | `20260806000001_shared_foundation.sql` | Extensions, timestamps, default privilege lockdown |
| 2 | `20260806000002_entries_and_examples.sql` | Entries, senses, examples, relations |
| 3 | `20260806000003_sound_changes.sql` | Sound change rules, steps, links |
| 4 | `20260806000004_conjugations.sql` | Conjugation forms, rules, results, steps |
| 5 | `20260806000005_hanja.sql` | Hanja characters, readings, terms |
| 6 | `20260806000006_idioms.sql` | Idioms, category links, relations |
| 7 | `20260806000007_sources.sql` | Sources and content attribution |
| 8 | `20260806000008_feedback.sql` | Feedback table |
| 9 | `20260806000009_integrity_functions_and_triggers.sql` | Publication validation, deferred re-checks |
| 10 | `20260806000010_rls_and_grants.sql` | RLS policies, explicit GRANTs, `submit_feedback()` RPC |
| 11 | `20260806000011_phase_6a1_integrity_security_revisions.sql` | Consolidation marker (no SQL) |

**Total tables:** 39

See **`MIGRATION_REVIEW.md`** for the full audit checklist.

## Remote dev (`korean-reference-dev`)

- **Linked** via `npx supabase link --project-ref <ref>`
- Schema deployed with `npx supabase db push` (11/11 migrations)
- Synthetic seed: `npx supabase db push --include-seed` (TEST/SYNTHETIC DATA only)
- **Not** production; **no** formal vocabulary imported

### Environment (local Next.js → remote dev)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATA_SOURCE=supabase
USE_MOCK_DATA=false
```

Legacy local CLI stack may use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of publishable key.

## Phase 6C — local test seed (synthetic)

`supabase/seed.sql` = **local/dev synthetic test data** — **not** formal content, **not** a production seed.

The file opens with an explicit banner: **TEST / SYNTHETIC DATA ONLY — DO NOT APPLY TO PRODUCTION**.

Allowed usage:

- Local reset: `npx supabase db reset --local`
- Remote **dev** only: `npx supabase db push --include-seed` on `korean-reference-dev`

**Never** run `--include-seed` against Production (`korean-reference-prod`).

Formal editorial content uses the CSV pipeline under `data/` (see `data/README.md`).

Approximate coverage:

| Module | Count |
|--------|-------|
| Entries | 10 (8 published, 1 draft, 1 in_review) |
| Examples | 8 |
| Sound change rules | 3 |
| Conjugation forms | 6 |
| Conjugation results | 8 |
| Hanja characters | 4 |
| Hanja terms | 3 |
| Idioms | 3 |
| Sources | 3 |

### Local reset + seed

```bash
npx supabase db reset --local
npx supabase test db --local    # 54/54 PASS
```

### Remote verification scripts

Optional read-only SQL under `supabase/scripts/` for post-deploy checks.

## pgTAP

| Target | Status |
|--------|--------|
| Local (`test db --local`) | 54/54 PASS |
| Linked remote | CLI test runner lacks `extensions` schema USAGE for pgTAP; schema verified via `db query` + local pgTAP |

## Security notes

- **No** production Supabase connection
- **No** `db reset --linked`
- `submit_feedback()` REVOKED from anon/authenticated
- **No** `SUPABASE_SECRET_KEY` / service_role in app
- `.env.local` gitignored — never commit keys or DB password

## Next: Phase 7

### Phase 7A — Production readiness (in progress)

See **`docs/08-production-readiness.md`** and **`data/README.md`**.

- Production architecture + deployment runbook (no prod Supabase yet)
- Formal CSV templates + validator (`npm run content:validate`)
- Dry-run importer only (`npm run content:dry-run`)

Do **not** merge to `main` or configure Production Supabase until checklist complete.
