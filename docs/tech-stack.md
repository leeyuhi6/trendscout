# TrendScout - 技术架构

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **图表**: Recharts
- **部署**: Vercel (免费)

### 后端
- **框架**: Python FastAPI
- **数据库**: PostgreSQL
- **缓存**: Redis (可选)
- **部署**: Railway ($5-10/月)

### 数据源
- Google Trends API (pytrends)
- Google Suggest API
- 已有数据: 26,573关键词

## 项目结构

```
trendscout/
├── frontend/          # Next.js应用
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/           # FastAPI应用
│   ├── api/
│   ├── models/
│   └── services/
└── data/             # 数据处理脚本
    └── trends/       # 复用现有Google Trends代码
```

## 开发计划

### Week 1: 基础架构
- Day 1-2: 前端项目搭建
- Day 3-4: 后端API搭建
- Day 5-7: 数据库设计

### Week 2: 核心功能
- Day 1-3: 关键词搜索功能
- Day 4-5: Trends数据集成
- Day 6-7: AI评分算法

### Week 3: UI/UX
- Day 1-3: 首页和搜索界面
- Day 4-5: 结果展示页面
- Day 6-7: 用户认证

### Week 4: 上线准备
- Day 1-2: 支付集成
- Day 3-4: 测试和优化
- Day 5-7: 部署和上线

---
