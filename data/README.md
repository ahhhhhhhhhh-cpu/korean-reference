# Formal Content Import — Korean Reference

> Empty CSV templates and validator fixtures. **No formal Korean vocabulary lives here yet.**

## Directory layout

```text
data/
  README.md           ← this file
  templates/          ← header-only CSV templates for editors
  fixtures/
    valid/            ← synthetic packages that must PASS validation
    invalid/          ← synthetic packages that must FAIL (one rule each)
```

```text
scripts/content/
  validate-content.ts ← CSV → parse → validate → report (no DB)
  import-content.ts     ← --dry-run only; no database connection
  import-live-cli.ts    ← Dev-only live draft import (direct PostgreSQL)
```

## Synthetic vs formal

| Path | Purpose |
|------|---------|
| `supabase/seed.sql` | Dev/test synthetic DB seed — **never Production** |
| `data/templates/` | Empty headers for formal editorial CSV |
| `data/fixtures/` | Validator test data (synthetic words like `synth-alpha`) |

---

## Encoding and CSV rules

- **Encoding:** UTF-8 (no BOM preferred)
- **Delimiter:** comma (`,`)
- **Headers:** fixed English `snake_case` — do not rename columns
- **Locales:** `en`, `zh`, `ja` only
- **Korean** source text: Unicode Hangul as authored
- **Chinese** (`zh`): use standard simplified/traditional as intended for that locale
- **Japanese** (`ja`): use standard Japanese kanji/kana forms
- Do **not** programmatically convert Hanja/Hanzi/Kanji across locales
- Translations need **not** be word-for-word across locales — prefer natural phrasing per language

---

## Publication baseline: English first

- **English is required** for publishable core content (primary sense definition or short definition)
- `zh` / `ja` may be omitted; the app falls back to English
- Importer default row status: **`draft`**
- Do not set `status=published` in CSV unless using a future `--allow-publish` flag

---

## import_key strategy

Editors maintain **`import_key`** — not UUID — to link rows across CSV files.

Examples:

```text
entry import_key:     entry-synth-alpha
sense import_key:     sense-synth-alpha-01
example import_key:   example-synth-alpha-01
```

Flow:

```text
import_key (CSV) → importer resolves → UUID (PostgreSQL gen_random_uuid)
```

- `import_key` must be unique within its file and globally unique per entity type
- **Do not** use `slug` as a cross-table foreign key
- Slugs remain URL identifiers on entries, rules, idioms, etc.

---

## Human-authored CSV vs importer-generated rows

### Human-authored (CSV in `templates/`)

All files listed under [templates/README.md](./templates/README.md).

### Importer-generated (no separate CSV)

| Generated row | Source |
|---------------|--------|
| Primary key `id` (UUID) | PostgreSQL on insert |
| `hanja_term_characters.id` | From `hanja_term_characters.csv` link rows |
| `entry_examples.id` | From `entry_examples.csv` |
| `sound_change_examples.id` | From `sound_change_examples.csv` |
| `conjugation_examples.id` | From `conjugation_examples.csv` |
| `idiom_examples.id` | From `idiom_examples.csv` |
| `content_sources.id` | From `content_sources.csv` |
| Junction dedup | Importer skips duplicate `(parent, child)` links |

### System reference (not in formal CSV)

**`conjugation_forms`** — **system reference data** (six form codes), created by migration `20260808000012_conjugation_taxonomy_and_system_forms.sql`, not by `seed.sql` or formal CSV. Results CSV uses `form_code`, not a form UUID.

---

## Publication workflow

```text
CSV authored
    ↓
npm run content:validate
    ↓
npm run content:dry-run
        ↓
import as draft          (explicit Dev or Production target; always start with preflight)
        ↓
verify
    ↓
in_review               (npm run content:promote -- --target-status in_review …)
    ↓
verify
    ↓
published               (npm run content:promote -- --target-status published …)
    ↓
verify
```

After promotion, **do not re-run the draft importer** on the same Pilot rows — the importer only updates existing rows that are still `draft`.

---

## Release targets (Dev vs Production)

Dev and Production are **separate explicit targets**. Production is never inferred from “not Dev”, and it is never the default.

| Target | Project | Project ref | Confirmation | Connection env |
|--------|---------|-------------|--------------|----------------|
| Dev | `korean-reference-dev` | `rwtkaplfvbvlibipnjin` | `--confirm-dev` | `DATABASE_URL` only |
| Production | `korean-reference-prod` | `rpykfrvcynpwmbkogiou` | `--confirm-production` | `PRODUCTION_DATABASE_URL` only |

Rules:

- `--confirm-dev` **never** authorizes Production.
- Production mode **never** falls back to `DATABASE_URL`.
- Dev mode **never** uses `PRODUCTION_DATABASE_URL`.
- `--project-ref` must match the selected connection URL’s derived project identity.
- Unknown / third-party refs are rejected.
- Dev ref is rejected in Production mode; Production ref is rejected in Dev mode.
- **Never commit secrets** or connection strings. **Never copy Dev environment settings into Production.**
- Production writes require explicit Production confirmation. Always start with `--preflight-only`, then import → verify → review → verify → publish → verify.

---

## Formal Pilot status promotion

The promotion CLI transitions **only** the exact Formal Pilot `import_key` set from `data/pilot/entry/` — never broad `WHERE status = 'draft'` updates.

### Supported transitions

| `--target-status` | Required current DB status | Result |
|-------------------|--------------------------|--------|
| `in_review` | `draft` | All six keyed Pilot entity groups → `in_review` |
| `published` | `in_review` | All six keyed Pilot entity groups → `published` (bottom-up order) |

`entry_examples` (61 junction rows) has **no status column** and is never updated — public visibility follows parent entry/example/sense publication state.

Direct `draft → published` is **not** supported. Use the two-step review path above.

#### Read-only promotion preflight (recommended first)

```bash
npm run content:promote -- \
  --dir data/pilot/entry \
  --target-status in_review \
  --preflight-only \
  --confirm-dev \
  --project-ref rwtkaplfvbvlibipnjin
```

Requirements match the live importer: target confirmation (`--confirm-dev` or `--confirm-production`), matching `--project-ref`, the selected connection URL (`DATABASE_URL` or `PRODUCTION_DATABASE_URL`), and exactly one of `--preflight-only` or `--execute`.

Preflight verifies exact Pilot counts, source statuses, translation completeness (en/zh/ja), link integrity, and (for `published`) publish-readiness — **SELECT only, no writes**.

#### Execute promotion (single transaction)

```bash
npm run content:promote -- \
  --dir data/pilot/entry \
  --target-status in_review \
  --execute \
  --confirm-dev \
  --project-ref rwtkaplfvbvlibipnjin
```

For **`--target-status published --execute`**, an additional explicit operator-safety flag is required:

```bash
npm run content:promote -- \
  --dir data/pilot/entry \
  --target-status published \
  --execute \
  --confirm-dev \
  --confirm-publish \
  --project-ref rwtkaplfvbvlibipnjin
```

`--confirm-publish` is intentional: it makes accidental publication materially harder. It is **not** required for `--preflight-only` or for `--target-status in_review --execute`.

Production publish execute requires **all** of: `--confirm-production`, `--project-ref rpykfrvcynpwmbkogiou`, `PRODUCTION_DATABASE_URL` identity match, `--execute`, and `--confirm-publish`.

#### Production promotion (same semantics, separate target)

```bash
npm run content:promote -- \
  --dir data/pilot/entry \
  --target-status in_review \
  --preflight-only \
  --confirm-production \
  --project-ref rpykfrvcynpwmbkogiou
```

```bash
npm run content:promote -- \
  --dir data/pilot/entry \
  --target-status published \
  --execute \
  --confirm-production \
  --confirm-publish \
  --project-ref rpykfrvcynpwmbkogiou
```

Uses `PRODUCTION_DATABASE_URL` only. Do not overwrite Dev `DATABASE_URL` in `.env.local`.

Execution repeats critical checks inside one PostgreSQL transaction, updates rows in deterministic order, asserts affected-row counts, and rolls back on any failure. For `published`, updates run bottom-up (`sense_translations` → `senses` → `entries` → `example_translations` → `examples` → `entry_aliases`) so DB publication guards remain active. Before writes, execute prints a non-secret audit summary; after commit, it prints `PROMOTION COMMITTED` with the transition label.

---

## Provenance and sources

### Example `provenance_type`

`original` | `adapted` | `quoted` | `licensed` | `public_domain` | `unknown`

Production publication rules (DB validators — do not bypass):

- `unknown` **cannot** be `published`
- Non-`original` requires `source_note` and/or linked `content_sources`
- `licensed` requires `license_note`

### Source `source_type`

`dictionary` | `academic_paper` | `book` | `textbook` | `article` | `official_website` | `corpus` | `licensed_dataset` | `original_editorial` | `other`

Link attributions via `content_sources.csv` using `source_import_key` + exactly one `*_import_key` target column.

---

## Commands

```bash
npm run content:validate -- --dir data/fixtures/valid/minimal
npm run content:validate -- --dir data/templates   # headers only → expect warnings
npm run content:dry-run -- --dir data/fixtures/valid/minimal
```

### Live draft import (direct PostgreSQL)

The live importer is **draft-only**. Direct publish is not supported. Dev and Production are separate explicit targets (see **Release targets** above).

**Dev allowlist:** only **korean-reference-dev** — `rwtkaplfvbvlibipnjin`.  
**Production allowlist:** only **korean-reference-prod** — `rpykfrvcynpwmbkogiou`.  
Unknown refs are rejected even when `--project-ref` and the connection URL agree.

#### Read-only database preflight (required first)

Use `--preflight-only` to run **SELECT-only** conflict checks with **no transaction and no writes**. Recommended before every live import.

```bash
npm run content:import -- \
  --dir data/pilot/entry \
  --preflight-only \
  --confirm-dev \
  --project-ref rwtkaplfvbvlibipnjin
```

Requirements for any database connection (`--preflight-only` or `--execute`):

- Target confirmation: `--confirm-dev` **or** `--confirm-production` (never both; `--confirm-dev` never authorizes Production)
- `--project-ref` — exact expected ref for that target; must match the selected connection URL
- Dev: `DATABASE_URL` only (direct Postgres or Supabase pooler; remote Supabase requires SSL)
- Production: `PRODUCTION_DATABASE_URL` only — **no fallback** to `DATABASE_URL`
- Optional Dev consistency check: `NEXT_PUBLIC_SUPABASE_URL` must match the Dev ref when set (ignored in Production mode because local app env is Dev)

Exactly one DB mode is required: `--preflight-only` (read-only) **or** `--execute` (transactional writes). Combining both flags is rejected.

#### Live draft import (writes)

```bash
npm run content:import -- \
  --dir data/pilot/entry \
  --execute \
  --confirm-dev \
  --project-ref rwtkaplfvbvlibipnjin
```

Production import (same draft-only semantics):

```bash
npm run content:import -- \
  --dir data/pilot/entry \
  --preflight-only \
  --confirm-production \
  --project-ref rpykfrvcynpwmbkogiou
```

```bash
npm run content:import -- \
  --dir data/pilot/entry \
  --execute \
  --confirm-production \
  --project-ref rpykfrvcynpwmbkogiou
```

Before Production `--execute`, the CLI prints a non-secret write confirmation banner (`TARGET: PRODUCTION`, project ref, operation, Pilot scope, confirmation flags). It never prints connection strings, passwords, or API keys.

Behavior (identical for Dev and Production):

- Validates CSV locally first (no `--allow-publish`; incoming rows must be `draft`)
- Runs read-only database **preflight** before any write (all keyed entities; unsafe non-draft statuses block)
- Re-checks critical slug/status conflicts inside the transaction before the first write
- Blocks seed-style slug collisions (existing slug with `NULL`/different `import_key`); **does not auto-delete synthetic seed conflicts** — operator-reviewed resolution is a separate step
- Executes the full Pilot package in **one transaction** (rollback on any failure)
- Upserts keyed entities by `import_key`; preserves UUIDs on safe draft re-import
- Import results remain `draft` — no direct publish

Supabase CLI, Docker, and Vercel are **not** required to run the Node importer when the selected connection URL is available.

Exit codes: `0` = valid, `1` = validation errors.

---

## Feedback

No CSV templates for `feedback` — not part of formal content import.
