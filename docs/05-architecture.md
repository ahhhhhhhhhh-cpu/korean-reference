# 程序架构（Architecture）

> 文档版本：1.0  
> 最后更新：2026-08-03  
> 项目：Korean Reference

---

## 1. 架构概览

```text
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  React Components · Tailwind · shadcn/ui · Lucide       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   Next.js App Router                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Pages     │  │  API Routes  │  │  Server Actions│ │
│  │  /[locale]  │  │  /api/...    │  │  (optional)    │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                │                   │          │
│  ┌──────▼────────────────▼───────────────────▼────────┐ │
│  │              Service / Repository Layer           │ │
│  │  searchEntries · getEntryBySlug · submitFeedback  │ │
│  └──────┬────────────────────────────────────────────┘ │
│         │                                               │
│  ┌──────▼──────┐         ┌──────────────────────────┐  │
│  │ Mock Adapter│   OR    │   Supabase Adapter       │  │
│  │ (Demo)      │         │   (Production MVP)       │  │
│  └─────────────┘         └────────────┬─────────────┘  │
└───────────────────────────────────────┼─────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │  Supabase PostgreSQL  │
                            │  + RLS Policies       │
                            └───────────────────────┘
```

---

## 2. 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Next.js (App Router) | 路由、SSR、API、SEO |
| 语言 | TypeScript | 类型安全 |
| UI | React | 组件 |
| 样式 | Tailwind CSS | 响应式、设计 token |
| 组件库 | shadcn/ui | 可定制基础组件 |
| 图标 | Lucide Icons | 模块图标 |
| 数据库 | Supabase PostgreSQL | 持久化 |
| 部署 | Vercel | CI/CD、Analytics |
| 测试 | Vitest + Playwright | 单元 + E2E |
| i18n | next-intl 或等效方案 | 界面国际化 |

---

## 3. 目录结构（建议）

```text
korean-reference/
├── app/
│   ├── [locale]/                    # 语言前缀路由
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # 首页
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── entries/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── sound-change/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── conjugation/
│   │   │   └── page.tsx
│   │   ├── hanja/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── idioms/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── api/
│   │   ├── search/
│   │   │   └── route.ts             # Autocomplete + 搜索
│   │   └── feedback/
│   │       └── route.ts             # 错误反馈提交
│   ├── layout.tsx                   # 根 layout
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/                      # Header, Footer, MobileNav
│   ├── search/                      # SearchBar, Autocomplete
│   ├── entries/                     # EntryDetail, SectionNav
│   ├── sound-change/
│   ├── conjugation/
│   ├── hanja/
│   ├── idioms/
│   ├── feedback/                    # FeedbackForm, FeedbackButton
│   └── ui/                          # shadcn/ui 组件
├── lib/
│   ├── repositories/                # 数据访问层
│   │   ├── entries.ts
│   │   ├── sound-rules.ts
│   │   ├── conjugation.ts
│   │   ├── hanja.ts
│   │   ├── idioms.ts
│   │   └── feedback.ts
│   ├── adapters/
│   │   ├── mock/                    # Demo 数据源
│   │   └── supabase/                # 生产数据源
│   ├── supabase/
│   │   ├── client.ts                # 浏览器客户端（anon）
│   │   └── server.ts                # 服务端客户端
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── routing.ts
│   │   └── messages/                # 界面翻译 JSON
│   │       ├── en.json
│   │       ├── zh.json
│   │       └── ja.json
│   ├── utils/
│   │   ├── normalize-korean.ts
│   │   ├── locale-fallback.ts
│   │   └── rate-limit.ts
│   └── types/                       # 共享 TypeScript 类型
├── data/
│   └── mock/                        # Demo JSON/TS 数据
│       ├── entries.ts
│       ├── sound-rules.ts
│       └── ...
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── scripts/
│   └── templates/                   # 内容导入模板
├── docs/                            # 项目文档
├── public/
│   └── og-default.png               # 默认 OG 图
├── .env.example
├── .env.local                       # 本地密钥（不提交）
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 4. 分层职责

### 4.1 Presentation Layer（页面与组件）

- 负责 UI 渲染、响应式布局、用户交互
- 不直接读取 Mock 文件或编写 SQL
- 通过 Repository 函数获取数据
- 处理 loading / error / empty 状态

### 4.2 Service / Repository Layer

统一数据访问接口，示例：

```typescript
// lib/repositories/entries.ts
export async function searchEntries(query: SearchParams): Promise<SearchResult[]>
export async function getEntryBySlug(slug: string, locale: Locale): Promise<EntryDetail | null>
export async function getEntrySuggestions(query: string, locale: Locale): Promise<Suggestion[]>
```

Repository 内部根据环境变量选择 Mock 或 Supabase Adapter：

```typescript
const useMock = process.env.USE_MOCK_DATA === 'true'
```

### 4.3 Adapter Layer

| Adapter | 用途 |
|---------|------|
| Mock | Demo 阶段，读取 `data/mock/` |
| Supabase | 正式 MVP，通过 Supabase Client 查询 |

两者返回相同 TypeScript 类型，保证页面层无感切换。

### 4.4 API Routes

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/search` | GET | Autocomplete 与搜索 |
| `/api/feedback` | POST | 错误反馈提交（含 rate limit） |

**原则：** 公开内容读取优先 Server Component 直接调用 Repository；仅交互性、需 rate limit 的操作走 API Route。

---

## 5. 路由与 i18n

### 5.1 URL 结构

```text
/                           → 重定向至 /en
/en                         → 英文首页
/zh/entries/deutda          → 中文词条详情
/ja/sound-change/ liaison    → 日文音变规则
```

### 5.2 语言配置

```typescript
// lib/i18n/config.ts
export const locales = ['en', 'zh', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

### 5.3 语言切换实现

- 使用 `usePathname` + `useRouter` 替换 URL 中的 locale 段
- 保存偏好：`localStorage.setItem('kr-locale-preference', locale)`
- Middleware 读取偏好（可选）或在 layout 中处理根路径重定向

### 5.4 内容回退

```typescript
// lib/utils/locale-fallback.ts
function resolveTranslation<T>(
  translations: Record<Locale, T | null>,
  locale: Locale
): { content: T | null; fallbackLocale: Locale | null }
```

逻辑：

1. 当前 locale 有内容 → 返回
2. 否则 en 有内容 → 返回 + 标记 fallback
3. 否则 → null（显示「内容准备中」）

---

## 6. 设计系统

### 6.1 CSS 变量（Tailwind 扩展）

```css
:root {
  --color-primary: #0F766E;
  --color-primary-dark: #115E59;
  --color-background: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-text: #1C1917;
  --color-text-muted: #78716C;
  --color-accent: #5EEAD4;
  --color-error: #B91C1C;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

.dark {
  /* 深色主题变量 — 第二优先级实现 */
}
```

### 6.2 字体加载

```typescript
// app/layout.tsx 或 [locale]/layout.tsx
import { Inter, Noto_Sans_SC, Noto_Sans_JP } from 'next/font/google'
// Pretendard 若使用本地字体文件则放 public/fonts/
```

### 6.3 主题切换

- 使用 `next-themes` 或等效方案
- 支持：`system` | `light` | `dark`
- 偏好存 `localStorage`
- 第一版先完成浅色，深色后补

---

## 7. 数据流示例

### 7.1 词条详情页（Server Component）

```text
Request: GET /zh/entries/deutda
    ↓
Page Server Component
    ↓
getEntryBySlug('deutda', 'zh')
    ↓
Repository → Supabase Adapter
    ↓
SQL: entries + translations + examples + relations
    ↓
locale-fallback 处理缺失翻译
    ↓
返回 EntryDetail 类型
    ↓
渲染页面 + 生成 metadata（SEO）
```

### 7.2 搜索 Autocomplete（Client + API）

```text
User types in SearchBar
    ↓
Debounce 250ms
    ↓
GET /api/search?q=...&locale=zh&type=suggest
    ↓
API Route → searchEntries()
    ↓
Return grouped suggestions (max 8)
    ↓
Client renders dropdown
    ↓
Keyboard nav / click → navigate to detail
```

### 7.3 错误反馈

```text
User submits FeedbackForm
    ↓
POST /api/feedback
    ↓
Validate: honeypot, length, rate limit
    ↓
Repository → insert feedback
    ↓
Return success / error
    ↓
Client shows Toast or inline error
```

---

## 8. 安全架构

### 8.1 密钥管理

| 变量 | 位置 | 用途 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 客户端 + 服务端 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 客户端 + 服务端 | 匿名读取 |
| `SUPABASE_SERVICE_ROLE_KEY` | **仅服务端** | 绕过 RLS 的管理操作（若需要） |

**禁止：** 将 `service_role` key 暴露到浏览器或提交 GitHub。

### 8.2 RLS

- 所有内容表启用 RLS
- 匿名用户只能 SELECT `published` 内容
- feedback 表匿名用户只能 INSERT
- draft / archived 对匿名不可见

### 8.3 API 安全

- 反馈 API：rate limiting、honeypot、输入验证
- 搜索 API：参数 sanitization、结果数量限制
- 无用户认证 API（第一版）

---

## 9. SEO 架构

### 9.1 Metadata

每个页面通过 Next.js `generateMetadata` 生成：

- `title`、`description`
- `openGraph`（title, description, url, locale, images）
- `alternates.canonical`
- `alternates.languages`（hreflang）

### 9.2 Sitemap

`sitemap.ts` 动态生成所有 `published` 词条、规则、习语的多语言 URL。

### 9.3 robots.txt

允许索引公开页面，禁止 `/api/`。

---

## 10. 性能策略

| 策略 | 实现 |
|------|------|
| SSR / SSG | 词条详情、规则页服务端渲染 |
| 缓存 | `unstable_cache` 或 Next.js fetch cache 缓存公开词条 |
| 字体 | next/font 优化，subset 必要字符 |
| 搜索 | 客户端防抖，服务端限制返回数量 |
| 分页 | 列表页分页，不一次加载全部 |
| 图片 | next/image，OG 图预优化 |
| JS | Server Component 优先，减少 client bundle |

---

## 11. 环境变量

见项目根目录 `.env.example`。

关键变量：

```text
USE_MOCK_DATA=true|false
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 仅服务端
NEXT_PUBLIC_SITE_URL=https://...  # 用于 SEO canonical
```

---

## 12. 部署架构

```text
Developer (Cursor)
    ↓ git push
GitHub (korean-reference)
    ↓ webhook
Vercel
    ├── Preview Deployments (feature branches)
    └── Production (main branch)
            ↓
        Supabase (korean-reference)
            PostgreSQL + RLS
```

### 12.1 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定正式版，Production 部署 |
| `feature/*` | 功能开发，Preview 部署 |

### 12.2 部署检查清单

- [ ] 环境变量已在 Vercel 配置
- [ ] Supabase RLS 已启用并测试
- [ ] `USE_MOCK_DATA=false`（Production）
- [ ] Sitemap 可访问
- [ ] 多语言 hreflang 正确
- [ ] 手机端布局验收

---

## 13. 与 Mock 的切换

### Demo 阶段

```text
USE_MOCK_DATA=true
```

Repository 读取 `data/mock/`，无需 Supabase 连接即可开发 UI。

### 正式 MVP

```text
USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Repository 切换至 Supabase Adapter。页面与组件代码**不变**。

---

## 14. 模块独立性

各查询模块（音变、变形、汉字、习语）在路由、组件、Repository 上保持相对独立，共享：

- Layout / Header / Footer
- SearchBar / Autocomplete
- i18n 基础设施
- 设计系统组件
- Feedback 组件
- 类型定义

这样后续扩展（如语法模块）不影响现有模块。
