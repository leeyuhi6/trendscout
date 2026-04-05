# TrendScout 用户指南

**网址：** https://www.trendscout.dev  
**API：** https://api.trendscout.dev

---

## 这是什么？

TrendScout 帮你发现**正在上升的 Google 趋势关键词**，找到还没被大量竞争对手发现的内容机会。

数据来源：765条经过 Google Trends 验证的真实关键词，覆盖 AI工具、游戏、健康、SaaS、视频等10大方向。

---

## 核心功能

### 🔥 Trending（热门词）
当前热度最高的词，适合追热点。

- 热度 ≥ 10 才展示
- 按 avg_heat 从高到低排序

### 📈 Rising（上升词）
增长最快的词，最有价值——热度正在上升但竞争还不激烈。

- trend = rising + heat > 10
- 按 growth_rate 从高到低排序

### 🔍 搜索
输入任意词，智能匹配关键词库。

- 支持多词搜索（如 "ai tool"）
- AND 逻辑优先，无结果时自动降级为 OR
- 不区分大小写

---

## 数据字段说明

| 字段 | 说明 |
|------|------|
| keyword | 关键词 |
| avg_heat | 平均热度（0-100，Google Trends 相对值） |
| trend | 趋势方向：rising / stable / falling |
| growth_rate | 近期增长率（%），Rising词的核心指标 |
| active_markets | 活跃市场数量（US/GB/AU/CA等） |
| markets | 各国热度分布 |
| rising_queries | 相关上升词 |

---

## 使用技巧

**找内容机会：**
1. 点 Rising 标签 → 按 growth_rate 排序
2. 找 heat 在 20-60 之间的词（热度适中，竞争还小）
3. 看 active_markets，覆盖越多国家越好

**找爆款方向：**
1. 点 Trending 标签
2. heat > 60 的词是当前爆款
3. 结合 rising_queries 找长尾词

**搜索特定领域：**
- 搜 "ai" → 找所有 AI 相关词
- 搜 "video" → 视频方向
- 搜 "tool" → 工具类产品机会

---

## 真实数据举例

**当前增长最快的词：**
- `agent tools best practices` | heat: 43.4 | growth: +396% 🚀
- `monitor review oled` | heat: 20.8 | growth: +310%
- `recorder examples` | heat: 15.8 | growth: +481%

**当前最热的词：**
- `gemiini speech reviews` | heat: 94.0
- `meme` | heat: 88.9
- `downloader apk` | heat: 86.4

---

## 数据更新频率

当前为手动更新（每周），后续升级为自动每日更新。

---

## 反馈 & 联系

有问题或建议？欢迎通过网站底部的邮件订阅表单联系。
