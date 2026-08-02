# 测试计划（Test Plan）

> 文档版本：1.0  
> 最后更新：2026-08-03  
> 项目：Korean Reference

---

## 1. 测试目标

验证 Korean Reference 第一版满足 [01-soft-overview.md](./01-soft-overview.md) 中的成功标准，确保：

- 核心查询流程正确可用
- 多语言切换与内容回退行为正确
- 数据权限安全（RLS）
- 响应式布局在目标断点可用
- 错误反馈可提交且不影响正式内容
- 性能与 SEO 达到目标基线

第一版不要求完整测试覆盖率，但核心路径必须有自动或手动测试保障。

---

## 2. 测试范围

### 2.1 在范围内

| 类别 | 内容 |
|------|------|
| 功能测试 | 搜索、Autocomplete、各模块查询、语言切换、反馈提交 |
| 集成测试 | Repository ↔ Mock/Supabase、API Routes |
| E2E 测试 | 关键用户流程（Playwright） |
| 响应式测试 | 360 / 390 / 768 / 1024 / 1440 px |
| 无障碍测试 | WCAG 2.1 AA 基础项 |
| 安全测试 | RLS、rate limiting、honeypot |
| 性能测试 | Lighthouse 基线 |
| SEO 测试 | metadata、sitemap、hreflang |

### 2.2 不在第一版范围

- 正式第三方 WCAG 认证
- 完整回归测试自动化覆盖所有页面
- 负载测试 / 压力测试
- 跨浏览器全量矩阵（仅测 Chrome + Safari + Firefox 代表）

---

## 3. 测试环境

| 环境 | 用途 | 数据源 |
|------|------|--------|
| Local | 开发调试 | Mock 或本地 Supabase |
| Vercel Preview | 功能分支验收 | Mock 或 Preview Supabase |
| Vercel Production | 正式验收 | Supabase Production |

---

## 4. 功能测试用例

### 4.1 首页与导航

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| NAV-01 | 访问 `/` | 跳转或进入 `/en` | P0 |
| NAV-02 | 桌面端导航链接 | 所有模块可达 | P0 |
| NAV-03 | 移动端汉堡菜单 | 菜单展开，链接可用 | P0 |
| NAV-04 | 移动端顶部搜索入口 | 可进入搜索 | P1 |
| NAV-05 | 关于页 | 可访问 | P2 |

### 4.2 语言切换

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| I18N-01 | 默认语言 | 首次访问为英文 | P0 |
| I18N-02 | 切换 zh | URL 变为 `/zh/...`，界面中文 | P0 |
| I18N-03 | 切换 ja | URL 变为 `/ja/...`，界面日文 | P0 |
| I18N-04 | 词条页切换语言 | 停留同 slug，不回首页 | P0 |
| I18N-05 | 偏好持久化 | 刷新后保留用户选择 | P0 |
| I18N-06 | 缺失翻译回退 | 显示英文 + 回退标记 | P0 |
| I18N-07 | 英文也缺失 | 显示「内容准备中」 | P1 |
| I18N-08 | 语言下拉显示全称 | English / 简体中文 / 日本語 | P1 |

### 4.3 综合搜索

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| SRCH-01 | 输入韩文 1 字符 | 触发 Autocomplete | P0 |
| SRCH-02 | 输入拉丁 2 字符 | 触发 Autocomplete | P0 |
| SRCH-03 | 防抖 | 300ms 内不重复请求 | P1 |
| SRCH-04 | 最多 8 条建议 | 不超过 8 条 | P1 |
| SRCH-05 | 键盘上下 + Enter | 可选中并导航 | P0 |
| SRCH-06 | Esc 关闭建议 | 下拉关闭 | P1 |
| SRCH-07 | 完全匹配 | 排最前 | P0 |
| SRCH-08 | 跨模块结果 | 按类型分组 | P0 |
| SRCH-09 | 无结果 | 空状态 + 引导 | P0 |
| SRCH-10 | 已收录变形反查原形 | 可通过变形找到词条 | P1 |

### 4.4 词条详情

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| ENT-01 | 通过 slug 访问 | 正确展示 published 词条 | P0 |
| ENT-02 | draft 词条 | 匿名不可访问（404） | P0 |
| ENT-03 | 空白字段 | 对应区块隐藏 | P0 |
| ENT-04 | 锚点导航 | 点击跳转至对应区块 | P1 |
| ENT-05 | 移动目录 | 折叠目录可用 | P1 |
| ENT-06 | 分享 URL | 复制链接含正确 locale + slug | P1 |

### 4.5 音变模块

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| SND-01 | 规则列表 | 平铺展示 published 规则 | P0 |
| SND-02 | 标签筛选 | 筛选结果正确 | P1 |
| SND-03 | 规则详情分步 | 分步对比可见 | P0 |
| SND-04 | 词条 → 规则链接 | 可跳转 | P1 |

### 4.6 用言变形

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| CONJ-01 | 选词 + 选条件 | 展示变形结果 | P0 |
| CONJ-02 | 不规则标记 | 明确显示不规则类型 | P0 |
| CONJ-03 | 静态步骤 | 编号步骤可见 | P0 |
| CONJ-04 | 未收录 | 明确提示，不猜测 | P0 |

### 4.7 汉字词

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| HAN-01 | 韩文搜索 | 返回匹配词 | P0 |
| HAN-02 | 汉字搜索 | 返回匹配词 | P0 |
| HAN-03 | 单字反查 | 返回相关韩语词列表 | P0 |
| HAN-04 | 逐字表格 | 桌面表格 / 移动适配 | P1 |

### 4.8 习语

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| IDM-01 | 搜索习语 | 返回结果 | P0 |
| IDM-02 | 主题分类浏览 | 分类筛选正确 | P0 |
| IDM-03 | 字面 vs 实际 | 桌面两栏 / 移动上下 | P0 |

### 4.9 错误反馈

| ID | 用例 | 预期结果 | 优先级 |
|----|------|----------|--------|
| FB-01 | 打开反馈表单 | 自动填充 content ID 和 URL | P0 |
| FB-02 | 正常提交 | Toast 成功，数据写入 | P0 |
| FB-03 | 描述 < 10 字符 | 验证失败 | P0 |
| FB-04 | 描述 > 1000 字符 | 验证失败 | P1 |
| FB-05 | Honeypot 填写 | 静默拒绝 | P0 |
| FB-06 | 1 分钟内重复提交 | rate limit 拒绝 | P0 |
| FB-07 | 提交后正式内容 | 不变 | P0 |

---

## 5. 安全测试

| ID | 用例 | 预期结果 |
|----|------|----------|
| SEC-01 | 匿名读取 draft | 失败（RLS） |
| SEC-02 | 匿名读取 archived | 失败（RLS） |
| SEC-03 | 匿名 SELECT feedback | 失败（RLS） |
| SEC-04 | 匿名 INSERT feedback | 成功 |
| SEC-05 | service_role key 不在客户端 bundle | 构建产物中不存在 |
| SEC-06 | .env.local 不在 Git | .gitignore 生效 |

---

## 6. 响应式测试矩阵

| 断点 | 设备代表 | 必测页面 |
|------|----------|----------|
| 360px | 小屏手机 | 首页、词条详情、搜索 |
| 390px | 标准手机 | 同上 + 反馈表单 |
| 768px | 平板 | 导航、表格、习语对比 |
| 1024px | 小桌面 | 侧栏目录、规则详情 |
| 1440px | 大桌面 | 首页、长滚动页 |

**检查项：**

- 导航不溢出、不换行错乱
- 搜索框可输入、建议不被遮挡
- 表格/卡片在手机端可读
- 按钮触摸区域 ≥ 44px
- 长韩文/汉字不换行溢出

---

## 7. 无障碍测试

| 检查项 | 方法 |
|--------|------|
| 键盘导航 | Tab 遍历所有交互元素 |
| 焦点可见 | 焦点环清晰 |
| 色彩对比 | Lighthouse Accessibility ≥ 90 |
| 表单 Label | 反馈表单每个字段有 label |
| 图标 aria-label | 搜索、菜单、反馈按钮 |
| 不仅靠颜色 | 错误状态有文字说明 |
| 标题层级 | h1 → h2 → h3 不跳级 |
| reduced motion | `prefers-reduced-motion` 下无必要动画 |
| Autocomplete 键盘 | 上下 Enter Esc |

---

## 8. 性能测试

| 指标 | 目标 | 工具 |
|------|------|------|
| Lighthouse Performance（桌面） | ≥ 90 | Chrome DevTools |
| Lighthouse Accessibility | ≥ 90 | Chrome DevTools |
| Lighthouse Best Practices | ≥ 90 | Chrome DevTools |
| Lighthouse SEO | ≥ 90 | Chrome DevTools |
| LCP | ≤ 2.5s | Lighthouse |
| CLS | ≤ 0.1 | Lighthouse |

**测试页面：** 首页、词条详情、规则详情、搜索结果

---

## 9. SEO 测试

| 检查项 | 方法 |
|--------|------|
| sitemap.xml 可访问 | curl / 浏览器 |
| robots.txt 正确 | 允许公开页，禁止 /api |
| 每页 title / description | 查看 source |
| hreflang | 三语 alternates 正确 |
| canonical | 与当前 URL 一致 |
| OG tags | title, description, url, image |
| 词条页可索引 | 无 noindex |

---

## 10. 自动化测试计划

### 10.1 Vitest（单元 / 集成）

| 模块 | 测试文件 | 覆盖 |
|------|----------|------|
| locale-fallback | `lib/utils/locale-fallback.test.ts` | 回退逻辑 |
| normalize-korean | `lib/utils/normalize-korean.test.ts` | 韩文标准化 |
| repositories | `lib/repositories/*.test.ts` | Mock Adapter 返回 |
| rate-limit | `lib/utils/rate-limit.test.ts` | 频率限制 |

### 10.2 Playwright（E2E）

| 流程 | 文件 |
|------|------|
| 首页 → 搜索 → 词条 | `e2e/search-flow.spec.ts` |
| 语言切换 | `e2e/locale-switch.spec.ts` |
| 反馈提交 | `e2e/feedback.spec.ts` |
| 移动端导航 | `e2e/mobile-nav.spec.ts` |

### 10.3 引入时机

| 阶段 | 测试 |
|------|------|
| 阶段 3 | Vitest 基础设施 + normalize 测试 |
| 阶段 4–5 | 搜索 E2E |
| 阶段 10 | 反馈 E2E |
| 阶段 11 | RLS 集成测试 |
| 阶段 13 | 完整 E2E 套件 |

---

## 11. 验收清单（第一版上线前）

### P0 — 必须通过

- [ ] 所有 P0 功能用例通过
- [ ] RLS 安全测试通过
- [ ] 三语路由与切换正常
- [ ] 核心搜索流程可用
- [ ] 五模块页面可访问
- [ ] 反馈可提交
- [ ] Production 从 Supabase 读取
- [ ] 手机 + 桌面无阻断性错误
- [ ] 无密钥泄露

### P1 — 应该通过

- [ ] Lighthouse 四项 ≥ 90（桌面）
- [ ] 响应式五断点验收
- [ ] Autocomplete 键盘操作
- [ ] SEO 基础项齐全
- [ ] 至少 1 条 Playwright E2E 通过

### P2 — 尽量完成

- [ ] 深色模式可用
- [ ] Vitest 核心模块覆盖
- [ ] 完整 E2E 套件

---

## 12. 缺陷管理

| 严重级别 | 定义 | 处理 |
|----------|------|------|
| Critical | 阻断核心功能、安全漏洞、数据泄露 | 必须修复才能上线 |
| Major | 功能错误但可绕过 | 上线前修复 |
| Minor | UI 问题、非核心路径 | 可上线后修复 |
| Trivial | 文案、间距 | 记录 backlog |

缺陷记录方式：GitHub Issues（仓库创建后）。

---

## 13. 测试数据要求

开发/测试使用 Seed 数据，须包含：

- published / draft / archived 各至少 1 条
- 三语完整 + 部分缺失（测回退）
- 不规则用言至少 1 个
- 各模块至少 1 条可搜索数据
- 单字反查至少 1 个汉字对应多个词

详见 [04-data-model.md](./04-data-model.md) Seed 部分。
