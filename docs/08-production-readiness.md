# Production Readiness — Korean Reference

> **Phase 7A** — architecture, deployment runbook, formal content pipeline scaffolding.  
> **Status:** Production Supabase **not created** in this phase.

---

## 1. Architecture

### Production (future)

```text
GitHub main
      ↓
Vercel Production
      ↓
korean-reference-prod   (not created yet)
      ↓
Formal editorial content
```

### Preview / development (current)

```text
preview/* branches  (e.g. preview/phase-6e, chore/production-readiness)
      ↓
Vercel Preview
      ↓
korean-reference-dev
      ↓
TEST / SYNTHETIC DATA (supabase/seed.sql)
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

**Do not** copy Preview/dev variables to Production until `korean-reference-prod` exists and is reviewed.

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
import as draft          (future: live import)
        ↓
content review
        ↓
in_review
        ↓
publish                 (DB workflow / editorial tools)
```

- Importer default status: **`draft`**
- Direct `published` import requires future explicit flag: `--allow-publish`
- First live DB import is **not enabled** in Phase 7A

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

**Phase 7A:** Do not merge to `main` or deploy Production yet.

---

## 9. Next step after Phase 7A

When approved:

1. Create **`korean-reference-prod`** Supabase project
2. Run Production migration runbook (§3)
3. Author formal CSV from `data/templates/`
4. Enable live import (future phase)
5. Merge to `main` + configure Vercel Production env
