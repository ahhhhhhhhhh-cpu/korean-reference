# 当前项目状态（Current Status）

> 文档版本：2.1  
> 最后更新：2026-08-08（Phase 7C-4B-1R-A4 — bound_noun deployed to Production）

---

## 1. 总体状态

| 项目 | 状态 |
|------|------|
| **当前阶段** | Phase 7C-4B-1R-A4 — `bound_noun` schema deployed (local/dev/prod **13/13**) |
| **整体进度** | ~95% |
| **工作 branch** | `chore/production-readiness` |
| **下一任务** | Git checkpoint → approved sense translations (7C-4B-1 cont.) |

---

## 2. 阶段进度

| 阶段 | 名称 | 状态 | 完成日期 |
|------|------|------|----------|
| 6C | 测试 Seed + Supabase Adapter | ✅ 完成 | 2026-08-07 |
| 6D | 远程 dev 接入 | ✅ 完成 | 2026-08-07 |
| 6E | Vercel Preview 集成 | ✅ 完成 | 2026-08-08 |
| 7A | Production readiness scaffolding | ✅ 完成 | 2026-08-08 |
| 7B | Production schema deployment | ✅ 完成 | 2026-08-08 |
| 7C-3A | Pre-CSV schema correction | ✅ local 完成 | 2026-08-08 |
| 7C-3B | Migration 12 → remote dev | ✅ 完成 | 2026-08-08 |
| 7C-3C | Migration 12 → Production | ✅ 完成 | 2026-08-08 |
| 7C-4B-1R-A2 | bound_noun + Pilot 시간 split | ✅ local | 2026-08-08 |
| 7C-4B-1R-A3 | Migration 13 → remote dev | ✅ 完成 | 2026-08-08 |
| 7C-4B-1R-A4 | Migration 13 → Production | ✅ 完成 | 2026-08-08 |

---

## 3. Phase 7C-4B-1R-A2 / A3 / A4（bound_noun schema）

- [x] Migration `20260808000013_add_bound_noun_part_of_speech.sql` — **local / dev / prod 均为 13/13**
- [x] Canonical POS 新增 `bound_noun`（TS / CSV validator / UI filter labels）
- [x] Pilot `data/pilot/entry/`（**local CSV only**）：시간 → `entry-sigan-time`（noun）+ `entry-sigan-hour`（bound_noun）；**32** entries / **50** senses
- [x] Formal Pilot content **未** import；sense_translations 仍待 review
- [x] Production formal lexical content **仍为空**（6 system `conjugation_forms` only）
- [x] Feedback **仍 disabled**

### Phase 7C-4B-1R-A3（remote dev）

- [x] CLI linked → `korean-reference-dev`；dry-run 仅 migration 13；`seeds: []`
- [x] Synthetic content intact（8 published、`test-draft`、`test-review`、8 `conjugation_results`）
- [x] 无 formal `sigan-time` / `sigan-hour` 远程行

### Phase 7C-4B-1R-A4（Production）

- [x] CLI relink → `korean-reference-prod`（`rpykfrvcynpwmbkogiou`）；dev **未** modified
- [x] Pre-apply：migrations 01–12；formal content **空**
- [x] Dry-run：仅 migration 13；`seeds: []`
- [x] Migration 13 applied；Production **13/13**
- [x] Formal content **仍为空**；synthetic markers absent；RLS 39/39；feedback / `submit_feedback` unchanged
- [x] Safety relink → `korean-reference-dev`

### 明确不做（7C-4B-1R-A2–A4）

- remote seed / formal CSV import
- Git commit / push

---

## 4. Phase 7C-3A（local）

- [x] Migration `20260808000012_conjugation_taxonomy_and_system_forms.sql`
- [x] `irregular_type` taxonomy: `ㄷ` `ㅂ` `ㅅ` `ㅎ` `르` `러` `여` `우`
- [x] `ㅡ` / `ㄹ` 从 irregular metadata 移除（常规规则）
- [x] `-하다` → `여` normalization（migration UPDATE）
- [x] Six `conjugation_forms` 迁入 migration（seed 不再负责）
- [x] pgTAP **68/68** PASS（`conjugation_taxonomy.test.sql` +14；`schema` 22 + `integrity` 19 + `rls` 13）

### 明确不做（Phase 7C-3A）

- 任何 `--linked` / remote DB 操作
- 正式 Pilot 内容导入
- Git commit / push

---

## 4. Phase 7C-3B（remote dev）

- [x] CLI relink → `korean-reference-dev`（`rwtkaplfvbvlibipnjin`；prod **未** linked）
- [x] Remote migration history：01–11 → push **仅** migration 12
- [x] Dry-run：仅 `20260808000012_conjugation_taxonomy_and_system_forms.sql`；无 seed
- [x] 六条 `conjugation_forms` published；18 条 EN/ZH/JA translations published
- [x] 既有 form UUID（`eeeeeeee-…`）保留；synthetic 内容（8 published、`test-draft`、`test-review`）仍在
- [x] pgTAP 文档计数：**14** 新测 / **68** 总计（非 16/70）

### 明确不做（Phase 7C-3B）

- Production schema / 数据变更
- remote seed / formal CSV import
- Git commit / push

---

## 5. Phase 7C-3C（Production）

- [x] CLI relink → `korean-reference-prod`（`rpykfrvcynpwmbkogiou`；dev **未** linked / **未** modified）
- [x] Pre-apply：migrations 01–11；formal content **空**（entries/examples/etc. = 0）
- [x] Dry-run：仅 migration 12；`seeds: []`
- [x] Migration 12 applied；Production **12/12**
- [x] 六条 system `conjugation_forms` published；18 EN/ZH/JA translations published
- [x] Formal content **仍为空**；synthetic markers absent
- [x] RLS 39/39；feedback 权限 unchanged；`submit_feedback` EXECUTE = 0 for anon/authenticated
- [x] Production ready for formal Pilot CSV pipeline（**内容未导入**）

### 明确不做（Phase 7C-3C）

- 修改 `korean-reference-dev`
- remote seed / formal CSV import
- Vercel Production env
- Git commit / push

---

## 6. Phase 7B 交付物

- [x] `korean-reference-prod` Supabase 项目已创建（CLI 确认）
- [x] Production schema 通过 migrations 部署（11/11，无 seed）
- [x] 远程验证：`public` 业务表 39、RLS 39/39、内容表为空
- [x] `supabase/scripts/verify_production_schema.sql` — Production 只读验证脚本
- [x] Production types parity 与 `database.types.ts` 一致（grep / 结构对比）
- [x] `korean-reference-dev` **未修改**（Phase 7B 当时；7C-3B 已单独对 dev 应用 migration 12）

### 明确不做（Phase 7B）

- synthetic / 正式数据导入
- Vercel Production env 配置
- merge 到 `main`
- Feedback 启用
- `db push --include-seed` / `db reset --linked`

---

## 7. 环境状态

| 环境 | Supabase | 数据 | Vercel |
|------|----------|------|--------|
| Preview / dev | `korean-reference-dev` | TEST / SYNTHETIC（schema **13/13**；`bound_noun` ✅） | Preview env ✅ |
| Production DB | `korean-reference-prod` | **空**（schema **13/13**；6 system forms only；`bound_noun` ✅） | **未配置** |

---

## 8. Technical debt（non-blocking）

- Remote hosted pgTAP（Phase 6D）
- Accidental early Production Vercel deployment（不依赖）
- `db lint`: `validate_sound_change_rule_publishable` unused variable warning（非 blocking）
- Prod region CLI 显示 `ap-northeast-1`（创建时若选 Seoul，请在 Dashboard 核对）

---

## 9. 最近更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-08-08 | Phase 7C-4B-1R-A4: migration 13 applied to `korean-reference-prod` (content still empty) |
| 2026-08-08 | Phase 7C-4B-1R-A3: migration 13 applied to `korean-reference-dev` |
| 2026-08-08 | Phase 7C-3C: migration 12 applied to `korean-reference-prod` (content still empty) |
| 2026-08-08 | Phase 7C-3B: migration 12 applied to `korean-reference-dev` |
| 2026-08-08 | Phase 7C-3A (local): irregular taxonomy + system conjugation forms migration |
| 2026-08-08 | Phase 7A：Production readiness + CSV/import scaffolding |
| 2026-08-08 | Phase 6E COMPLETE |
