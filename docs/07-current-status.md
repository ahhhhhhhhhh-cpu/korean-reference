# 当前项目状态（Current Status）

> 文档版本：1.7  
> 最后更新：2026-08-08（Phase 7B — Production schema deployment）

---

## 1. 总体状态

| 项目 | 状态 |
|------|------|
| **当前阶段** | Phase 7B — Production Supabase Schema Deployment ✅ |
| **整体进度** | ~88% |
| **工作 branch** | `chore/production-readiness` |
| **下一任务** | Formal Content Review + Production Import Preparation |

---

## 2. 阶段进度

| 阶段 | 名称 | 状态 | 完成日期 |
|------|------|------|----------|
| 6C | 测试 Seed + Supabase Adapter | ✅ 完成 | 2026-08-07 |
| 6D | 远程 dev 接入 | ✅ 完成 | 2026-08-07 |
| 6E | Vercel Preview 集成 | ✅ 完成 | 2026-08-08 |
| 7A | Production readiness scaffolding | ✅ 完成 | 2026-08-08 |
| 7B | Production schema deployment | ✅ 完成 | 2026-08-08 |

---

## 3. Phase 7B 交付物

- [x] `korean-reference-prod` Supabase 项目已创建（CLI 确认）
- [x] Production schema 通过 migrations 部署（11/11，无 seed）
- [x] 远程验证：`public` 业务表 39、RLS 39/39、内容表为空
- [x] `supabase/scripts/verify_production_schema.sql` — Production 只读验证脚本
- [x] Production types parity 与 `database.types.ts` 一致（grep / 结构对比）
- [x] `korean-reference-dev` **未修改**

### 明确不做（Phase 7B）

- synthetic / 正式数据导入
- Vercel Production env 配置
- merge 到 `main`
- Feedback 启用
- `db push --include-seed` / `db reset --linked`

---

## 4. 环境状态

| 环境 | Supabase | 数据 | Vercel |
|------|----------|------|--------|
| Preview / dev | `korean-reference-dev` | TEST / SYNTHETIC | Preview env ✅ |
| Production DB | `korean-reference-prod` | **空**（schema only） | **未配置** |

---

## 5. Technical debt（non-blocking）

- Remote hosted pgTAP（Phase 6D）
- Accidental early Production Vercel deployment（不依赖）
- `db lint`: `validate_sound_change_rule_publishable` unused variable warning（非 blocking）
- Prod region CLI 显示 `ap-northeast-1`（创建时若选 Seoul，请在 Dashboard 核对）

---

## 6. 最近更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-08-08 | Phase 7B：Production schema 11/11 migrations，空库验证 |
| 2026-08-08 | Phase 7A：Production readiness + CSV/import scaffolding |
| 2026-08-08 | Phase 6E COMPLETE |
