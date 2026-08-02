# 开发计划（Development Plan）

> 文档版本：1.0  
> 最后更新：2026-08-03  
> 项目：Korean Reference

---

## 1. 开发原则

1. **分阶段验收**，不一次生成整个网站
2. **先 Mock 后数据库**，页面层与 Repository 层解耦
3. **先浅色后深色**，核心功能不等待主题完善
4. **每阶段更新** [07-current-status.md](./07-current-status.md)
5. **每稳定阶段 Git Commit**
6. **不未经确认扩展第一版范围**
7. **先打通最小部署链路**（Cursor → GitHub → Vercel）

---

## 2. 阶段总览

| 阶段 | 名称 | 目标 | 预估 |
|------|------|------|------|
| 0 | 文档与项目初始化 | 文档、仓库、基础脚手架 | 1–2 天 |
| 1 | 设计系统与布局 | 主题、导航、响应式骨架 | 2–3 天 |
| 2 | i18n 与路由 | 三语路由、语言切换、回退逻辑 | 2–3 天 |
| 3 | Mock 数据层 | 类型、Repository、Seed Mock | 1–2 天 |
| 4 | 首页与综合搜索 | 搜索框、Autocomplete、结果页 | 3–4 天 |
| 5 | 词条详情页 | 长滚动、锚点导航、内容区块 | 3–4 天 |
| 6 | 音变模块 | 规则列表、详情、分步展示 | 2–3 天 |
| 7 | 用言变形模块 | 选词、选条件、步骤展示 | 2–3 天 |
| 8 | 汉字词模块 | 列表、详情、单字反查 | 2–3 天 |
| 9 | 习语模块 | 分类浏览、详情、对比展示 | 2–3 天 |
| 10 | 错误反馈 | 表单、API、防 Spam | 1–2 天 |
| 11 | Supabase 接入 | Migration、RLS、Adapter 切换 | 3–4 天 |
| 12 | SEO 与性能 | Sitemap、metadata、优化 | 1–2 天 |
| 13 | 测试与验收 | Vitest、Playwright、跨端测试 | 2–3 天 |
| 14 | 深色模式 | 主题完善（可并行或后置） | 1–2 天 |

**总计预估：** 约 4–6 周（单人兼职开发）

---

## 3. 阶段详细说明

### 阶段 0：文档与项目初始化

**目标：** 完成文档，创建 GitHub 仓库，初始化 Next.js 项目。

**任务：**

- [x] 生成 `docs/` 十件套
- [x] 生成 README、CHANGELOG、.env.example
- [ ] 创建 GitHub 仓库 `korean-reference`
- [ ] `npx create-next-app` 初始化项目（TypeScript, Tailwind, App Router）
- [ ] 安装 shadcn/ui、Lucide、next-intl（或选定 i18n 方案）
- [ ] 配置 ESLint、Prettier
- [ ] 首次 Commit 推送 GitHub
- [ ] 连接 Vercel，验证 Preview 部署

**验收标准：**

- 仓库可访问，Vercel Preview 可打开空白 Next.js 页
- 文档齐全

---

### 阶段 1：设计系统与布局

**目标：** 建立设计 token、全局 Layout、响应式导航骨架。

**任务：**

- [ ] 配置 Tailwind CSS 变量（色彩、圆角、阴影）
- [ ] 配置字体（Inter, Noto Sans SC/JP, Pretendard 或回退）
- [ ] 实现 Header（Logo、导航、语言下拉占位、搜索入口）
- [ ] 实现 Footer
- [ ] 实现 MobileNav（汉堡菜单）
- [ ] 实现基础 shadcn/ui 组件（Button, Input, Card, Dropdown, Toast）
- [ ] 验证响应式断点：360 / 390 / 768 / 1024 / 1440

**验收标准：**

- 桌面与手机导航可用
- 色彩、圆角符合设计规范
- 韩/汉/英/日混排可读

---

### 阶段 2：i18n 与路由

**目标：** 三语 URL 路由、语言切换、偏好存储、内容回退逻辑。

**任务：**

- [ ] 配置 `[locale]` 动态路由
- [ ] 实现 `/` → `/en` 重定向
- [ ] 编写界面翻译 JSON（en / zh / ja）— 导航、按钮、系统提示
- [ ] 实现语言下拉切换（URL 同步变化）
- [ ] 实现 localStorage 语言偏好
- [ ] 实现 `locale-fallback` 工具函数
- [ ] 实现回退标记 UI 组件

**验收标准：**

- 三语路由正常，切换不丢页面上下文
- 缺失翻译时正确回退并显示标记

---

### 阶段 3：Mock 数据层

**目标：** 定义 TypeScript 类型，实现 Repository 接口与 Mock Adapter。

**任务：**

- [ ] 定义所有实体 TypeScript 类型（对齐 [04-data-model.md](./04-data-model.md)）
- [ ] 编写 Mock 数据（10–20 词条、5 规则、5 用言、5 汉字词、5 习语）
- [ ] Mock 数据包含：三语内容、缺失翻译案例、draft/published/archived
- [ ] 实现 Repository 函数签名
- [ ] 实现 Mock Adapter
- [ ] 配置 `USE_MOCK_DATA=true`

**验收标准：**

- Repository 函数可返回类型正确的 Mock 数据
- 页面层可通过 Repository 获取数据，不直接 import Mock 文件

---

### 阶段 4：首页与综合搜索

**目标：** 首页布局、搜索框、Autocomplete、搜索结果页。

**任务：**

- [ ] 首页：Hero + 搜索框 + 四模块入口 + 示例 + 说明
- [ ] SearchBar 组件（含 debounce）
- [ ] Autocomplete 下拉（键盘导航、最多 8 条）
- [ ] `/api/search` 路由（Mock 阶段走 Repository）
- [ ] 搜索结果页（跨模块分组）
- [ ] 空状态页

**验收标准：**

- 搜索建议触发条件正确
- 结果按类型分组
- 无结果时有引导

---

### 阶段 5：词条详情页

**目标：** 词条详情长滚动页、锚点导航、各内容区块。

**任务：**

- [ ] `/[locale]/entries/[slug]` 页面
- [ ] SectionNav（桌面侧栏 / 移动折叠）
- [ ] 内容区块：概要、发音、音变、变形、汉字、例句、相关内容
- [ ] 空白区块自动隐藏
- [ ] 复制、分享 URL
- [ ] generateMetadata（SEO）

**验收标准：**

- 长滚动 + 锚点跳转正常
- 移动端目录可用
- 缺失字段不显示空区块

---

### 阶段 6：音变模块

**任务：**

- [ ] 规则列表页（平铺 + 标签筛选 + 排序）
- [ ] 规则详情页（分步对比、条件表格、例词）
- [ ] 词条详情中音变区块与规则链接
- [ ] 模块图标

**验收标准：**

- 分步展示清晰
- 筛选与排序可用

---

### 阶段 7：用言变形模块

**任务：**

- [ ] 变形查询页（选词 + 选条件）
- [ ] 变形结果展示（静态步骤、不规则标记）
- [ ] 未收录提示

**验收标准：**

- 选词与选条件交互完整
- 不规则用言有明显标记

---

### 阶段 8：汉字词模块

**任务：**

- [ ] 汉字词列表与搜索
- [ ] 汉字词详情（逐字表格、移动适配）
- [ ] 单字反查

**验收标准：**

- 单字输入返回相关词列表
- 表格在手机端可读

---

### 阶段 9：习语模块

**任务：**

- [ ] 习语列表 + 主题分类筛选
- [ ] 习语详情（字面 vs 实际意义对比）
- [ ] 例句、相近表达

**验收标准：**

- 分类浏览可用
- 字面/实际意义对比清晰

---

### 阶段 10：错误反馈

**任务：**

- [ ] FeedbackForm 组件
- [ ] 内容页底部按钮 + 轻量浮动按钮
- [ ] `/api/feedback` 路由
- [ ] Honeypot、长度验证、rate limiting
- [ ] Toast 成功/失败提示

**验收标准：**

- 反馈可提交（Mock 阶段写本地或 Mock 存储）
- 防 Spam 基础措施生效

---

### 阶段 11：Supabase 接入

**目标：** 数据库 Migration、RLS、Seed、Adapter 切换、Vercel 连接验证。

**任务：**

- [ ] 创建 Supabase 项目
- [ ] 编写 Migration（schema + indexes）
- [ ] 编写 RLS policies
- [ ] 导入 Seed 数据
- [ ] 实现 Supabase Adapter
- [ ] Vercel 配置环境变量
- [ ] 验证 Production 读取
- [ ] `USE_MOCK_DATA=false` 切换
- [ ] 编写内容导入模板

**验收标准：**

- 正式 MVP 从 Supabase 读取 published 内容
- draft/archived 对匿名不可见
- 反馈写入数据库

---

### 阶段 12：SEO 与性能

**任务：**

- [ ] sitemap.ts 动态生成
- [ ] robots.ts
- [ ] 各页 hreflang + canonical
- [ ] 默认 OG 图
- [ ] 字体与缓存优化
- [ ] Lighthouse 检测与优化

**验收标准：**

- SEO 基础项齐全
- Lighthouse 目标接近（Performance ≥ 90 桌面）

---

### 阶段 13：测试与验收

**任务：**

- [ ] Vitest：Repository、locale-fallback、normalize 等单元测试
- [ ] Playwright：搜索流程、语言切换、反馈提交 E2E
- [ ] 跨端手动测试（360 / 768 / 1440）
- [ ] 无障碍基础检查
- [ ] 更新 [07-current-status.md](./07-current-status.md)

**验收标准：**

- 核心流程 E2E 通过
- 第一版成功标准（见 [01-soft-overview.md](./01-soft-overview.md)）逐项确认

---

### 阶段 14：深色模式（可后置）

**任务：**

- [ ] 深色 CSS 变量
- [ ] next-themes 集成
- [ ] 主题切换 UI
- [ ] 对比度检查

**验收标准：**

- 浅色/深色/跟随系统均可用
- 不影响已完成功能

---

## 4. Git 工作流

```text
main                    ← Production
  └── feature/xxx       ← 功能分支 → Vercel Preview
```

**Commit 规范建议：**

```text
feat: add search autocomplete
fix: correct locale fallback banner
docs: update current status
chore: configure supabase adapter
```

**每阶段完成后：**

1. 合并或 Commit 至 main（或 feature 分支）
2. 更新 CHANGELOG.md
3. 更新 07-current-status.md

---

## 5. 里程碑

| 里程碑 | 标志 | 目标日期 |
|--------|------|----------|
| M0 | 文档完成 | 2026-08-03 |
| M1 | 项目脚手架 + Vercel Preview | TBD |
| M2 | Demo 可浏览（Mock 数据，全模块 UI） | TBD |
| M3 | Supabase 接入，正式 MVP | TBD |
| M4 | 第一版上线（Production） | TBD |

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 深色模式拖延核心功能 | 明确为阶段 14，可后置 |
| Mock 与 Supabase 类型不一致 | 共享 TypeScript 类型，Adapter 统一接口 |
| 三语内容不完整 | draft 机制 + 回退标记，不静默展示 |
| 搜索性能 | 防抖、限制返回数、后续加索引 |
| 内容录入工作量大 | Seed 模板 + 分批次导入，不追求 100 词条一次完成 |
| 平台名称被占用 | 文档建议名称，实际创建时加前缀 |

---

## 7. 下一阶段建议

当前处于 **阶段 0（文档完成）**。

**建议立即执行的下一任务：**

1. 创建 GitHub 仓库 `korean-reference`
2. 初始化 Next.js 项目（阶段 0 剩余任务）
3. 连接 Vercel，完成首次 Preview 部署
4. 进入阶段 1：设计系统与 Layout

**不要在此阶段：**

- 编写业务页面逻辑
- 创建 Supabase 项目（可等到阶段 11 前）
- 一次性实现所有模块
