# Production Readiness — Korean Reference

> **Phase 7A–7C-3C** — architecture, deployment runbook, formal content pipeline scaffolding.  
> **Status:** `korean-reference-prod` schema **13/13** (Phase 7C-4B-1R-A4). `bound_noun` deployed to all environments. System conjugation forms only. **No formal content.** Vercel Production not configured.

---

## 1. Architecture

### Production (deployed — Phase 7B)

```text
GitHub main                    (not merged yet)
      ↓
Vercel Production              (not configured yet)
      ↓
korean-reference-prod          ✅ schema 13/13 (Phase 7C-4B-1R-A4)
      ↓
(empty — no formal or synthetic content; 6 system conjugation_forms only)
```

**Phase 7C-4B-1R-A4 verified (2026-08-08):**

| Check | Result |
|-------|--------|
| Migrations applied | **13/13** local = remote |
| `entries.part_of_speech` | includes `bound_noun` (strict CHECK) |
| `public` business tables | 39 |
| RLS enabled | 39/39 |
| System `conjugation_forms` | 6 (published) |
| Formal content rows | 0 (entries, examples, modules) |
| Synthetic seed slugs | none |
| Seed applied | **No** |
| Feedback enabled | **No** |
| `submit_feedback` EXECUTE (anon/auth) | **0** |
| `korean-reference-dev` modified | **No** (this phase) |
| Pilot CSV imported | **No** (32 entries / 50 senses remain local only) |

**Phase 7C-3C verified (2026-08-08):**

| Check | Result |
|-------|--------|
| Migrations applied | **12/12** local = remote |
| `public` business tables | 39 |
| RLS enabled | 39/39 |
| System `conjugation_forms` | 6 (published) |
| System `conjugation_form_translations` | 18 (en/zh/ja, published) |
| Formal content rows | 0 (entries, examples, modules) |
| Synthetic seed slugs | none |
| Seed applied | **No** |
| Feedback enabled | **No** |
| `korean-reference-dev` modified | **No** (this phase) |

**Phase 7B verified (2026-08-08):**

| Check | Result |
|-------|--------|
| Migrations applied | 11/11 local = remote |
| `public` business tables | 39 |
| RLS enabled | 39/39 |
| Content rows | 0 (entries, examples, modules) |
| Synthetic seed slugs | none (`test-draft`, `hakgyo`, etc.) |
| Seed applied | **No** |
| `korean-reference-dev` modified | **No** |

### Preview / development (current)

```text
preview/* branches  (e.g. preview/phase-6e, chore/production-readiness)
      ↓
Vercel Preview
      ↓
korean-reference-dev
      ↓
TEST / SYNTHETIC DATA (supabase/seed.sql; schema 13/13 after Phase 7C-4B-1R-A3)
```

**Never mix environments.** Preview uses dev Supabase + synthetic seed. Production uses a separate project with migrations only — no seed.

---

## 2. Production environment variable contract

Vercel **Production** scope only (when approved):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable (`sb_publishable_…`) only |
| `DATA_SOURCE` | Yes | `supabase` |

**Must NOT be required for the public web app:**

- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SECRET_KEY` / `service_role`
- `sb_secret_…`

Feedback is not enabled; the app does not need elevated keys.

**Do not** copy Preview/dev variables to Production until formal content review is complete and Vercel Production deploy is approved.

Production Supabase project exists; credentials are in Supabase Dashboard only — **not** in Git or this doc.

---

## 3. Production database deployment runbook

Execute **only after** `korean-reference-prod` is created and ownership confirmed.

```text
Confirm target project (korean-reference-prod)
        ↓
supabase link --project-ref <prod-ref>
        ↓
supabase migration list
        ↓
supabase db push --dry-run
        ↓
Human review (schema diff, no seed)
        ↓
supabase db push
        ↓
Remote schema verification (supabase/scripts/verify_remote_schema.sql)
        ↓
RLS verification (anon sees published only)
        ↓
NO SEED — formal content via import pipeline only
```

### Forbidden on Production

```bash
# NEVER on production
npx supabase db push --include-seed
npx supabase db reset --linked
```

Production schema is built **only** from `supabase/migrations/`. Content enters via the formal CSV → validate → import pipeline (future phase).

---

## 4. Synthetic seed safeguards

| Artifact | Role |
|----------|------|
| `supabase/seed.sql` | Local/dev **TEST / SYNTHETIC DATA** only |
| Formal CSV under `data/templates/` | Empty headers for editorial workflow |
| `data/fixtures/` | Validator test fixtures (synthetic) |

`supabase/seed.sql` ≠ formal content ≠ production seed.

Allowed seed usage:

- Local: `npx supabase db reset --local` (includes seed)
- Remote **dev**: `db push --include-seed` on `korean-reference-dev` only

---

## 5. Formal content pipeline (scaffolding)

```text
CSV authored (data/templates/*.csv)
        ↓
npm run content:validate
        ↓
npm run content:dry-run
        ↓
import as draft          (Dev-only: npm run content:import -- --execute …)
        ↓
content review
        ↓
in_review
        ↓
publish                 (DB workflow / editorial tools)
```

- Importer default status: **`draft`**
- Direct `published` import requires future explicit flag: `--allow-publish`
- Live DB import uses **direct PostgreSQL** (`DATABASE_URL`), Dev-only allowlist (korean-reference-dev only), SSL for Supabase hosts, and one transactional Pilot write; Production is hard-blocked in this phase

See [`data/README.md`](../data/README.md) for CSV contract, `import_key` strategy, and encoding rules.

---

## 6. Git / merge readiness audit (Phase 7A)

**Branch audited:** `preview/phase-6e` → work continued on `chore/production-readiness`

**`main...preview/phase-6e` delta (at audit time):**

| File | Change |
|------|--------|
| `docs/07-current-status.md` | Phase 6E status updates |
| `src/i18n/routing.ts` | `localeDetection: false` |
| `src/i18n/routing.test.ts` | Routing test |

Phase 6C–6D assets (adapter, migrations, seed, pgTAP) are on `main` via commit `3fd87af`. Phase 6E adds locale routing fix on the preview branch.

**Secret scan (Phase 7A):** No tracked `.env.local`, `sb_secret_`, service_role keys, or DB passwords. Dev project ref appears only in docs as documentation, not as credentials.

**Not found:** localhost hardcodes, accidental Vercel URL hardcodes, debug console logging, blocking TODOs in production paths.

---

## 7. Accidental early Production deployment

An early CLI deploy created a Production deployment on Vercel before Git integration was complete.

**Phase 7A actions:**

- Record existence only
- Confirm Production has **no** `korean-reference-dev` Supabase variables
- Do **not** promote, delete, redeploy, or depend on it

A future approved Production deploy will replace it.

---

## 8. Production merge checklist

Use before merging preview work to `main` and cutting Production:

```text
[ ] Preview acceptance complete (Phase 6E)
[ ] lint
[ ] Vitest
[ ] build
[ ] secret scan (no .env*, sb_secret_, service_role in repo)
[ ] main...preview diff reviewed
[ ] Production Supabase exists (korean-reference-prod)
[ ] Production migrations dry-run reviewed
[ ] Production migrations applied
[ ] Production RLS verified (draft/in_review hidden from anon)
[ ] No synthetic seed in Production
[ ] Production env configured (publishable key only)
[ ] Formal data reviewed (content:validate PASS)
[ ] Formal data imported (draft → review → publish)
[ ] Production deployment (Git main → Vercel Production)
[ ] Production smoke test (/en, search, modules)
[ ] Rollback path confirmed (previous deployment + DB backup)
```

**Phase 7C-3C note:** Production and dev both have migration 12. Production contains **only** the six system conjugation forms from that migration — no lexical/formal content.

---

## 9. Next step after Phase 7C-3C

1. ~~Create **`korean-reference-prod`** Supabase project~~ ✅ Phase 7B
2. ~~Run Production migration runbook (§3)~~ ✅ Phase 7B + 7C-3C + 7C-4B-1R-A4 (13/13)
3. **Formal Pilot CSV authoring + validation** ← current
4. Author formal CSV from `data/templates/`
5. Dry-run import against dev, then Production import (future phase)
6. Merge to `main` + configure Vercel Production env
