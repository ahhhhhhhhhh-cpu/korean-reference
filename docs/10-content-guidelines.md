# 内容规范（Content Guidelines）

> 文档版本：1.0  
> 最后更新：2026-08-03  
> 项目：Korean Reference

---

## 1. 目的

本文档规定 Korean Reference 正式内容的格式、质量标准与录入流程，确保：

- 中、英、日三语内容独立、可维护
- 内容质量可控，未经审核不得发布
- 数据结构一致，便于导入与扩展
- 维护者与开发者使用统一标准

---

## 2. 内容原则

1. **人工审核**：所有 `published` 内容必须经人工检查
2. **禁止 AI 直发**：AI 生成内容仅可作为草稿参考，不得直接 `published`
3. **三语独立**：每种语言的释义、解释存独立字段，不混写
4. **韩语汉字词 ≠ 中文同形词**：汉字信息用于词源辅助，须避免直接等同
5. **无法确认则 draft**：任何不确定的内容保持 `draft`
6. **例句优先**：每个重点词条/规则/习语至少 1 个例句
7. **中文优先完整**：第一版以中文内容为质量基准，英日尽量同步

---

## 3. 语言与 locale 代码

| locale | 语言 | 用途 |
|--------|------|------|
| `zh` | 简体中文 | 界面 + 知识内容 |
| `en` | English | 界面 + 知识内容 + 技术回退语言 |
| `ja` | 日本語 | 界面 + 知识内容 |

界面翻译（按钮、导航等）存 i18n JSON 文件，不在本文档范围。

---

## 4. 通用字段规范

### 4.1 Slug

| 规则 | 示例 |
|------|------|
| 小写拉丁字母 | `deutda` |
| 使用罗马字或通用转写 | `sound-change-liaison` |
| 不含空格 | 用连字符 `-` |
| 稳定不变 | 发布后尽量不修改 |
| 冲突时加后缀 | `malda-verb`, `malda-adj` |

### 4.2 发布状态

| 状态 | 何时使用 |
|------|----------|
| `draft` | 内容未完成或待校对 |
| `published` | 三语（或至少中文+英文）已审核 |
| `archived` | 内容过时或错误，停止公开展示 |

### 4.3 韩文文本

- 使用标准韩文 Unicode（NFC 标准化）
- 词形用标准写法，不混入罗马字
- 发音字段可使用韩文或 IPA 描述（第一版不要求 IPA）

---

## 5. 词条（Entry）内容规范

### 5.1 必填字段

| 字段 | 说明 |
|------|------|
| headword_ko | 韩文标准词形 |
| slug | URL 标识 |
| part_of_speech | 词性 |
| status | 发布状态 |

### 5.2 推荐字段

| 字段 | 说明 |
|------|------|
| pronunciation | 实际发音（含音变后） |
| romanization | 主罗马字（见 §5.2.1 Revised Romanization） |
| romanization_aliases | 审核过的备用罗马字（可选，数组） |
| hanja_text | 汉字来源 |
| irregular_type | 不规则类型（若适用） |
| frequency_level | 频率：high / medium / low |
| difficulty_level | 难度：beginner / intermediate / advanced |

### 5.2.1 罗马字标准（Revised Romanization of Korean）

本项目采用 **大韩民国文化体育观光部 Revised Romanization of Korean（RR，修订罗马字）** 作为唯一主标准。

| 规则 | 说明 |
|------|------|
| 体系 | Revised Romanization of Korean（RR） |
| 主字段 | `romanization` — 每个可搜索词条/汉字词一条主值 |
| 别名字段 | `romanization_aliases` — 仅存放**人工审核**过的备用写法，不是自动生成 |
| 大小写 | 存储用小写；搜索时忽略大小写 |
| 分隔符 | 搜索时忽略空格、连字符 `-`、撇号 `'` 差异 |
| 禁止 | 不自动推断 McCune-Reischauer、Yale 等其他体系；不做任意韩文→罗马字转换 |

**示例：**

| headword_ko | romanization | romanization_aliases |
|-------------|--------------|----------------------|
| 듣다 | deutda | deudda |
| 먹다 | meokda | — |
| 학교 | hakgyo | — |
| 사람 | saram | — |
| 쉽다 | swipda | sipda |

别名仅用于常见已审核变体（如 `deudda`），**不得**把未审核的拼写猜测写入 Seed。

### 5.3 翻译字段（每种 locale 独立）

| 字段 | 要求 |
|------|------|
| definition | 主要释义，1–3 句，简洁准确 |
| notes | 补充说明（可选） |
| usage_notes | 用法提示（可选） |

**中文释义示例：**

```text
走；前往。（动词）
```

**英文释义示例：**

```text
to go; to walk (verb)
```

**日文释义示例：**

```text
行く；歩く（動詞）
```

### 5.4 例句规范

| 字段 | 要求 |
|------|------|
| sentence_ko | 自然韩语句子 |
| translation (各 locale) | 对应语言翻译 |

例句要求：

- 语法正确、自然
- 与词条用法相关
- 长度适中（一般不超过 30 个音节）
- 避免过于生僻的词汇（除非词条本身高级）

---

## 6. 音变规则（Sound Rule）内容规范

### 6.1 必填

| 字段 | 说明 |
|------|------|
| name_ko | 韩文规则名 |
| slug | URL |
| category | 分类标签 |
| status | 发布状态 |

### 6.2 翻译（各 locale）

| 字段 | 要求 |
|------|------|
| title | 规则标题，如「连音化」 |
| summary | 1–2 句概述 |
| explanation | 详细解释，分段落 |
| conditions | 适用条件，条目化 |
| exceptions | 例外情况 |

### 6.3 分步展示（sound_rule_steps）

每步必填：

| 字段 | 示例 |
|------|------|
| before_text | `국` + `물` 或 `ㄱ` + `ㅁ` |
| after_text | `궁` + `물` 或 `ㅇ` + `ㅁ` |
| label | 「连音化」（可选） |

**要求：**

- 步骤顺序正确
- 每步变化清晰可见
- 配合文字说明，不仅靠步骤

### 6.4 例词

- 每规则至少 2 个例词
- 优先常用词
- 标注音变前后对比

---

## 7. 用言变形（Conjugation）内容规范

### 7.1 变形结果

| 字段 | 要求 |
|------|------|
| entry_id | 关联词条 |
| target_form | 形式标识（如 `past_polite`） |
| result_ko | 正确变形结果 |
| steps_json | 编号步骤 |
| is_irregular | 是否不规则 |

### 7.2 步骤描述

步骤应清晰、可复现：

```text
1. 去掉词尾 다
2. 识别 ㄷ 不规则
3. 词干末 ㄷ 变为 ㄹ
4. 接 어요
5. 得到 들어요
```

不规则步骤须额外说明变化原因。

### 7.3 第一版覆盖范围

优先收录：

- 常用动词/形容词（如 가다, 오다, 먹다, 예쁘다, 크다）
- 常见词尾（해요体、过去时、否定、疑问）
- 主要不规则类型（entry metadata）：`ㄷ` `ㅂ` `ㅅ` `ㅎ` `르` `러` `여` `우`
- **不是** irregular_type：`ㅡ` 脱落、`ㄹ` 脱落 — 这些是常规活用规则（`conjugation_rules`）
- **-하다 / -하다 谓词**：`irregular_type = 여`（如 공부하다、좋아하다）

### 7.4 规则分类（Pilot 前参考）

**REGULAR / REGULAR PATTERN**（conjugation_rules，非 entry metadata）：

- Basic -아/어 ending selection
- Common vowel contraction
- ㅡ deletion
- ㄹ deletion

**IRREGULAR**（entry `irregular_type` + 对应 rules）：

- 여、ㄷ、ㅂ、르、ㅅ、ㅎ irregular（`러` / `우` 为保留 canonical 值，Pilot 首批内容可暂无实例）

---

## 8. 汉字词（Hanja Entry）内容规范

### 8.1 必填

| 字段 | 说明 |
|------|------|
| word_ko | 韩文词形 |
| hanja_text | 对应汉字 |
| slug | URL |

### 8.2 逐字解释表格

| 字 | 韩语读音 | 基本意义 |
|----|----------|----------|
| 学 | 학 | 学习 |
| 校 | 교 | 学校 |

**注意：**

- 「基本意义」指该字在此词中的含义
- 不默认等于现代中文常用义
- 可在 notes 中说明与中文/日语的差异

### 8.3 同音词

- 标注同音不同字的情况
- 说明语义区别

---

## 9. 习语（Idiom）内容规范

### 9.1 必填

| 字段 | 说明 |
|------|------|
| idiom_ko | 习语原文 |
| slug | URL |
| status | 发布状态 |

### 9.2 翻译（各 locale）

| 字段 | 要求 |
|------|------|
| literal_meaning | 字面意义（直译） |
| actual_meaning | 实际意义（惯用意） |
| explanation | 详细解释 |
| usage_context | 使用场景 |
| common_mistakes | 易误用说明（可选） |

**示例：**

| 字段 | 中文 |
|------|------|
| idiom_ko | 식은 죽 먹기 |
| literal_meaning | 吃凉粥 |
| actual_meaning | 轻而易举、手到擒来 |
| usage_context | 形容某事非常简单，常用于口语 |

### 9.3 主题分类

使用数据库标签，初始分类：

- daily（日常会话）
- emotion（感情与态度）
- relationship（人际关系）
- work-study（工作与学习）
- body（身体相关）
- animal（动物相关）
- formal（正式表达）
- colloquial（口语表达）

---

## 10. 标签（Tag）规范

| 规则 | 说明 |
|------|------|
| slug | 英文小写，连字符 |
| 每种 locale 有 label | 如 `daily` → 日常会话 / Daily / 日常会話 |
| 不重复创建同义标签 | 先查已有标签 |

---

## 11. 内容质量检查清单

发布前逐项确认：

### 词条

- [ ] 韩文词形正确
- [ ] 词性正确
- [ ] 发音（含音变）正确
- [ ] 中文释义准确完整
- [ ] 英文释义准确（若提供）
- [ ] 日文释义准确（若提供）
- [ ] 至少 1 个例句 + 三语翻译
- [ ] 汉字来源正确（若适用）
- [ ] 不规则标记正确（若适用）
- [ ] slug 唯一且稳定

### 音变规则

- [ ] 规则描述准确
- [ ] 分步展示正确
- [ ] 适用条件完整
- [ ] 例外情况已标注
- [ ] 例词发音正确

### 用言变形

- [ ] 变形结果正确
- [ ] 步骤可复现
- [ ] 不规则类型标记
- [ ] 与规则用言区别已说明

### 汉字词

- [ ] 汉字对应正确
- [ ] 逐字解释准确
- [ ] 未暗示与中/日同形词完全同义

### 习语

- [ ] 字面义与实际义区分清晰
- [ ] 使用场景准确
- [ ] 例句自然

---

## 12. 缺失翻译处理

| 情况 | 处理方式 |
|------|----------|
| 仅中文完成 | 保持 `draft`，或 `published` 但英日缺失（触发回退） |
| 中文 + 英文完成 | 可 `published`；日文缺失触发回退 |
| 三语均完成 | 正常 `published` |

**禁止：** 使用 Google Translate 等机器翻译填充后直接 `published`。

---

## 13. 导入流程

### 13.1 模板文件

开发阶段在 `scripts/templates/` 提供 CSV 模板：

```text
entries.template.csv
entry_translations.template.csv
examples.template.csv
example_translations.template.csv
sound_rules.template.csv
...
```

### 13.2 导入步骤

```text
1. 按模板填写内容
2. 运行质量检查清单
3. 导入至 Supabase（draft）
4. 人工校对
5. 修改 status 为 published
6. 验证网站展示
```

### 13.3 开发 Seed

Seed 数据须包含：

- 正常三语完整案例
- 缺失翻译案例（测回退）
- draft / published / archived 各 1
- 不规则用言案例
- 单字反查案例

---

## 14. 内容规模建议（第一版）

| 类型 | 建议数量 | 最低 Seed |
|------|----------|-----------|
| 词条 | ~100 | 10–20 |
| 音变规则 | 20–30 | 5 |
| 用言变形 | ~30 | 5 |
| 汉字词 | ~50 | 5 |
| 习语 | ~30 | 5 |

第一版重点是验证流程与结构，不追求词典规模。

---

## 15. 禁止事项

- 未经审核发布内容
- 将三语混写在同一字段
- 使用 AI 生成内容直接发布
- 猜测变形结果或发音
- 将韩语汉字词默认等同于中文同形词
- 修改已发布 slug（除非有 redirect 计划）
- 删除正式内容（应使用 `archived`）

---

## 16. 术语对照表

| 韩文概念 | 中文 | English | 日本語 |
|----------|------|---------|--------|
| 음운 변동 | 音变 | sound change | 音変化 |
| 활용 | 用言变形 | conjugation | 活用 |
| 한자어 | 汉字词 | Sino-Korean word | 漢字語 |
| 관용 표현 | 习语 | idiom | 慣用表現 |
| 불규칙 | 不规则 | irregular | 不規則 |
| 연음 | 连音 | liaison | 連音 |
| 비음화 | 鼻音化 | nasalization | 鼻音化 |

界面与内容中优先使用各 locale 对应术语，保持一致性。
