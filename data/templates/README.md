# CSV Templates

Header-only files for formal editorial import. Copy to a working directory, fill rows, then run `npm run content:validate`.

## Entries module

| File | Links via |
|------|-----------|
| `entries.csv` | `import_key` |
| `entry_translations.csv` | `entry_import_key` |
| `senses.csv` | `entry_import_key` |
| `sense_translations.csv` | `sense_import_key` |
| `entry_aliases.csv` | `entry_import_key` |
| `examples.csv` | `import_key` |
| `example_translations.csv` | `example_import_key` |
| `entry_examples.csv` | `entry_import_key`, `example_import_key`, optional `sense_import_key` |

## Sound changes

| File | Links via |
|------|-----------|
| `sound_change_rules.csv` | `import_key` |
| `sound_change_translations.csv` | `rule_import_key` |
| `sound_change_steps.csv` | `rule_import_key` |
| `sound_change_step_translations.csv` | `step_import_key` |
| `entry_sound_changes.csv` | `entry_import_key`, `rule_import_key` |
| `sound_change_examples.csv` | `rule_import_key`, `example_import_key`, optional `step_import_key` |

## Conjugation

| File | Notes |
|------|-------|
| `conjugation_rules.csv` | `import_key` |
| `conjugation_rule_translations.csv` | `rule_import_key` |
| `conjugation_results.csv` | `entry_import_key`, **`form_code`** (system form) |
| `conjugation_result_steps.csv` | `result_import_key` |
| `conjugation_result_step_translations.csv` | `step_import_key` |
| `conjugation_examples.csv` | `result_import_key`, `example_import_key` |

`conjugation_forms` is system reference data — not authored in formal CSV.

## Hanja

| File | Links via |
|------|-----------|
| `hanja_characters.csv` | `import_key` |
| `hanja_readings.csv` | `character_import_key` |
| `hanja_character_translations.csv` | `character_import_key` |
| `hanja_terms.csv` | `entry_import_key` |
| `hanja_term_characters.csv` | `term_import_key`, `character_import_key`, optional `reading_import_key` |
| `hanja_term_character_translations.csv` | `term_import_key`, `position`, `locale` |

## Idioms

| File | Links via |
|------|-----------|
| `idioms.csv` | `import_key` |
| `idiom_translations.csv` | `idiom_import_key` |
| `idiom_category_links.csv` | `idiom_import_key` |
| `idiom_examples.csv` | `idiom_import_key`, `example_import_key` |
| `idiom_entry_links.csv` | `idiom_import_key`, `entry_import_key` |
| `idiom_relations.csv` | `source_idiom_import_key`, `target_idiom_import_key` |

## Sources

| File | Links via |
|------|-----------|
| `sources.csv` | `import_key` |
| `content_sources.csv` | `source_import_key` + one target `*_import_key` column |
