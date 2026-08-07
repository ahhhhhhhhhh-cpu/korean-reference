# 当前项目状态（Current Status）

> 文档版本：1.5  
> 最后更新：2026-08-07（Phase 6E — Preview 集成进行中）

---

## 1. 总体状态

| 项目 | 状态 |
|------|------|
| **当前阶段** | Phase 6E 进行中（本地就绪；GitHub/Vercel 待配置） |
| **整体进度** | ~78% |
| **阻塞项** | GitHub remote 为占位 URL；Vercel CLI 需登录 |
| **工作方式** | 本地 Next.js + 远程 `korean-reference-dev`；Preview 待部署 |
| **下一任务** | 配置 GitHub remote → Vercel Preview → 公网验证 |

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

- [ ] 将 `origin` 设为真实 GitHub repository URL（当前为占位符）
- [ ] Commit + push 当前 branch
- [ ] Vercel CLI / Dashboard 登录
- [ ] Vercel Preview 环境变量（仅 Preview scope）：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `DATA_SOURCE=supabase`
- [ ] Preview Deployment 公网 spot-check

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
| 2026-08-07 | Phase 6E：本地回归全绿；GitHub/Vercel 待配置 |
| 2026-08-07 | Phase 6D：远程 dev 接入 + synthetic seed |
| 2026-08-07 | Phase 6C：测试 Seed + Supabase Adapter |
