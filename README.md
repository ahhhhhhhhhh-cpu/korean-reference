# Korean Reference

> 面向中、英、日母语学习者的韩语音变、用言变形、汉字词与习语查询网站。

**English:** A multilingual Korean reference website for sound changes, conjugation, Hanja vocabulary, idioms, and practical examples.

**日本語:** 中国語・英語・日本語話者向けの、韓国語の音変化、用言活用、漢字語、慣用表現を調べられるリファレンスサイト。

---

## 项目状态

| 项目 | 状态 |
|------|------|
| 阶段 | 文档完成，代码未开始 |
| 在线网站 | 尚未部署 |
| GitHub | 尚未创建 |
| 数据库 | 尚未创建 |

详见 [docs/07-current-status.md](./docs/07-current-status.md)。

---

## 核心功能（计划）

- **综合查询** — 跨模块搜索韩文词条
- **音变** — 规则浏览、分步对比、词条关联
- **用言变形** — 选词 + 选条件，静态步骤展示
- **汉字词** — 韩文/汉字搜索，单字反查
- **习语** — 主题分类、字面 vs 实际意义对比
- **多语言** — 中 / 英 / 日界面与释义
- **错误反馈** — 用户报告问题，不直接修改内容

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js, TypeScript, React |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| 数据库 | Supabase PostgreSQL |
| 部署 | Vercel |
| 分析 | Vercel Analytics |

---

## 文档

完整项目文档位于 `docs/` 目录：

| 文档 | 说明 |
|------|------|
| [01-soft-overview.md](./docs/01-soft-overview.md) | SOFT 项目概述 |
| [02-product-requirements.md](./docs/02-product-requirements.md) | 产品需求 |
| [03-user-flows.md](./docs/03-user-flows.md) | 用户交互流程 |
| [04-data-model.md](./docs/04-data-model.md) | 数据模型 |
| [05-architecture.md](./docs/05-architecture.md) | 程序架构 |
| [06-development-plan.md](./docs/06-development-plan.md) | 开发计划 |
| [07-current-status.md](./docs/07-current-status.md) | 当前状态 |
| [08-decisions.md](./docs/08-decisions.md) | 技术决策 |
| [09-test-plan.md](./docs/09-test-plan.md) | 测试计划 |
| [10-content-guidelines.md](./docs/10-content-guidelines.md) | 内容规范 |

---

## 本地开发（尚未初始化）

项目代码尚未开始。按 [开发计划](./docs/06-development-plan.md)，下一步为：

1. 创建 GitHub 仓库 `korean-reference`
2. 初始化 Next.js 项目
3. 连接 Vercel

初始化后的预期步骤：

```bash
git clone https://github.com/<username>/korean-reference.git
cd korean-reference
npm install
cp .env.example .env.local
# 编辑 .env.local 填入环境变量
npm run dev
```

---

## 环境变量

参见 [.env.example](./.env.example)。密钥文件 `.env.local` 不得提交至 Git。

---

## 推荐平台命名

| 平台 | 建议名称 |
|------|----------|
| GitHub | `korean-reference` |
| Vercel | `korean-reference` |
| Supabase | `korean-reference` |

---

## 许可证

待定（TBD）。

---

## 作者

Arnold
