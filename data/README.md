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
import as draft          (Dev-only live import via direct PostgreSQL)
        ↓
content review
    ↓
in_review
    ↓
publish
```

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

### Dev-only live draft import (direct PostgreSQL)

The live importer exists but is **Dev-only** and **draft-only** in this phase.

**Supported target (allowlist):** only **korean-reference-dev** — project ref `rwtkaplfvbvlibipnjin`. Any other Supabase project (including random third-party refs) is rejected even when `--project-ref`, `DATABASE_URL`, and `NEXT_PUBLIC_SUPABASE_URL` all agree. **Production import is hard-blocked and unsupported.**

Requirements:

- `DATABASE_URL` — direct Postgres or Supabase pooler connection string (env or `.env.local`); remote Supabase requires SSL (direct `db.<ref>.supabase.co` or `*.pooler.supabase.com`)
- `--execute` — explicit opt-in to writes
- `--confirm-dev` — confirm Dev-only intent
- `--project-ref rwtkaplfvbvlibipnjin` — must match the project ref derived from `DATABASE_URL`
- Optional consistency check: `NEXT_PUBLIC_SUPABASE_URL` must match the same ref when set

```bash
npm run content:import -- \
  --dir data/pilot/entry \
  --execute \
  --confirm-dev \
  --project-ref rwtkaplfvbvlibipnjin
```

Behavior:

- Validates CSV locally first (no `--allow-publish`; incoming rows must be `draft`)
- Runs read-only database **preflight** before any write (all keyed entities; unsafe non-draft statuses block)
- Re-checks critical slug/status conflicts inside the transaction before the first write
- Blocks seed-style slug collisions (existing slug with `NULL`/different `import_key`); **does not auto-delete synthetic seed conflicts** — operator-reviewed resolution is a separate step
- Executes the full Pilot package in **one transaction** (rollback on any failure)
- Upserts keyed entities by `import_key`; preserves UUIDs on safe draft re-import
- **Production import is not supported** — documented production project refs are hard-blocked

Supabase CLI, Docker, and Vercel are **not** required to run the Node importer against remote Dev when `DATABASE_URL` is available.

Exit codes: `0` = valid, `1` = validation errors.

---

## Feedback

No CSV templates for `feedback` — not part of formal content import.
