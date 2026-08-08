# 当前项目状态（Current Status）

> 文档版本：1.6  
> 最后更新：2026-08-08（Phase 7A — Production readiness scaffolding）

---

## 1. 总体状态

| 项目 | 状态 |
|------|------|
| **当前阶段** | Phase 7A — Production Readiness + Formal Content Pipeline Scaffolding |
| **整体进度** | ~85% |
| **工作 branch** | `chore/production-readiness`（自 `preview/phase-6e`） |
| **下一任务** | Create `korean-reference-prod` + deploy schema（需人工批准） |

---

## 2. 阶段进度

| 阶段 | 名称 | 状态 | 完成日期 |
|------|------|------|----------|
| 6C | 测试 Seed + Supabase Adapter | ✅ 完成 | 2026-08-07 |
| 6D | 远程 dev 接入 | ✅ 完成 | 2026-08-07 |
| 6E | Vercel Preview 集成 | ✅ 完成 | 2026-08-08 |
| 7A | Production readiness scaffolding | ✅ 完成 | 2026-08-08 |

---

## 3. Phase 7A 交付物

- [x] `docs/08-production-readiness.md` — 架构、runbook、merge checklist
- [x] `data/templates/` — 空 CSV headers（34 files）
- [x] `data/fixtures/` — 合成 validator 测试包
- [x] `scripts/content/validate-content.ts` — 无 DB 校验器
- [x] `scripts/content/import-content.ts` — `--dry-run` only
- [x] `npm run content:validate` / `content:dry-run`
- [x] `supabase/seed.sql` 强化 synthetic 警告

### 明确不做（Phase 7A）

- Production Supabase 创建/连接
- 正式词库导入
- merge 到 `main`
- Feedback 启用
- `vercel --prod`

---

## 4. Technical debt（non-blocking）

- Remote hosted pgTAP（见 Phase 6D 文档）
- Accidental early Production Vercel deployment（已记录，不依赖）

---

## 5. 数据说明

| 环境 | 数据 |
|------|------|
| `korean-reference-dev` | TEST / SYNTHETIC（seed.sql） |
| Production | 尚未创建 |
| Formal CSV | 模板已就绪，内容未开始 |

---

## 6. 最近更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-08-08 | Phase 7A：Production readiness + CSV/import scaffolding |
| 2026-08-08 | Phase 6E COMPLETE |
| 2026-08-07 | Phase 6D：远程 dev 接入 |
