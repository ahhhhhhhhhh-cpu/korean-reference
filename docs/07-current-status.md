# 当前项目状态（Current Status）

> 文档版本：1.5  
> 最后更新：2026-08-08（Phase 6E — Vercel Framework Preset 修正为 Next.js）

---

## 1. 总体状态

| 项目 | 状态 |
|------|------|
| **当前阶段** | Phase 6E — Git-based Preview 部署验证中 |
| **整体进度** | ~82% |
| **阻塞项** | Deployment Protection 可能阻挡公网自动化测试 |
| **工作方式** | Git push `preview/phase-6e` → Vercel Preview（Next.js preset）→ `korean-reference-dev` |
| **下一任务** | 确认新 Git Preview URL + 公网 spot-check |

---

## 2. 阶段进度

| 阶段 | 名称 | 状态 | 完成日期 |
|------|------|------|----------|
| 6C | 测试 Seed + Supabase Adapter | ✅ 完成 | 2026-08-07 |
| 6D | 远程 dev 接入 | ✅ 完成 | 2026-08-07 |
| 6E | Vercel Preview 集成 | 🔄 进行中 | — |

---

## 3. Phase 6E 状态

### 已完成（本地）

- [x] Git 安全检查 — 无 secret 被 tracked；`.env.local` / `supabase/.temp/` 已忽略
- [x] `npm run lint` PASS
- [x] Vitest **58/58** PASS
- [x] `npm run build` PASS（连接 `korean-reference-dev` synthetic data）
- [x] Publishable key 模式（无 service_role / secret）

### 待完成（需人工）

- [x] Vercel Project 创建 + link
- [x] GitHub repository 连接 Vercel（2026-08-08）
- [ ] Git-based Preview Deployment 公网 spot-check

### 明确不做

- Production Supabase / Production promote
- 正式词库导入
- Feedback 写入开放
- 为 linked pgTAP 修改业务 schema

---

## 4. Technical debt（non-blocking）

**Remote hosted pgTAP：** Supabase 托管环境的 `extensions.pgtap` + `search_path=""` 导致 `test db --linked` 无法运行。验证依据：

- local pgTAP 54/54 PASS
- remote schema / RLS / manual + Preview 验证

---

## 5. 数据说明

当前远程 `korean-reference-dev` 全部为 **TEST / SYNTHETIC DATA**，非正式词库。

---

## 6. 最近更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-08-08 | Phase 6E：Vercel Framework Preset 修正为 Next.js |
| 2026-08-08 | Phase 6E：GitHub ↔ Vercel 连接完成；触发 Git Preview deploy |
| 2026-08-07 | Phase 6D：远程 dev 接入 + synthetic seed |
| 2026-08-07 | Phase 6C：测试 Seed + Supabase Adapter |
