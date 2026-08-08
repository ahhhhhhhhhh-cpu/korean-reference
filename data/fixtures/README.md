# Validator Fixtures

Synthetic CSV packages for `scripts/content/validate-content.test.ts`.

**Not formal vocabulary.** Words like `알파` / `synth-alpha` are placeholders only.

| Directory | Expected result |
|-----------|-----------------|
| `valid/minimal/` | PASS |
| `invalid/duplicate-import-key/` | FAIL |
| `invalid/invalid-locale/` | FAIL |
| `invalid/missing-en-core/` | FAIL |
| `invalid/invalid-enum/` | FAIL |
| `invalid/unresolved-relation/` | FAIL |
| `invalid/invalid-hanja-position/` | FAIL |
| `invalid/invalid-provenance/` | FAIL |
