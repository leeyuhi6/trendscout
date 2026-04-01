# TrendScout 开发者文档

## 项目概述

**产品定位**: AI驱动的趋势关键词发现工具  
**目标用户**: SEO从业者、内容创作者、独立开发者  
**核心价值**: 低价格 + Google Trends数据 + AI分析

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)                   │
│  - SSR/SSG页面渲染                                        │
│  - 客户端交互                                             │
│  - API路由 (轻量级)                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│            FastAPI Backend (Railway)                     │
│  - RESTful API                                           │
│  - 业务逻辑处理                                           │
│  - 数据聚合和分析                                         │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ↓                   ↓
┌──────────────────────┐  ┌──────────────────────┐
│  PostgreSQL          │  │  Redis (可选)         │
│  - 用户数据          │  │  - 查询缓存           │
│  - 关键词库          │  │  - 会话管理           │
│  - 订阅记录          │  │  - 速率限制           │
└──────────────────────┘  └──────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────┐
│              外部数据源                                    │
│  - Google Trends API (pytrends)                         │
│  - Google Suggest API                                   │
│  - 本地数据: 26,573关键词                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 技术栈详解

### 前端技术栈

**核心框架**
- Next.js 14 (App Router)
  - 为什么选择: SSR/SSG支持，SEO友好，部署简单
  - 版本: 14.x (最新稳定版)

**样式方案**
- Tailwind CSS 3.x
  - 为什么选择: 快速开发，文件体积小，易于定制
- shadcn/ui
  - 为什么选择: 开源免费，组件质量高，可定制

**数据可视化**
- Recharts
  - 为什么选择: React原生，轻量级，满足基本需求
  - 备选: Chart.js (如需更复杂图表)

**状态管理**
- React Context + Hooks (轻量级)
- 备选: Zustand (如需复杂状态)

**数据请求**
- SWR (Next.js官方推荐)
  - 自动缓存
  - 自动重新验证
  - 乐观更新


### 后端技术栈

**核心框架**
- FastAPI 0.110+
  - 为什么选择: 高性能，自动API文档，类型安全
  - 异步支持: 处理并发请求
  - 自动验证: Pydantic模型

**数据库**
- PostgreSQL 15+
  - 为什么选择: 开源免费，功能强大，Railway原生支持
  - 扩展: pgvector (如需向量搜索)

**ORM**
- SQLAlchemy 2.0
  - 异步支持
  - 类型提示
  - 迁移工具: Alembic

**缓存层**
- Redis 7+ (可选，后期优化)
  - 查询结果缓存
  - 速率限制
  - 会话存储

**认证**
- JWT (JSON Web Tokens)
  - python-jose
  - passlib (密码哈希)

**支付集成**
- Stripe API
  - 订阅管理
  - Webhook处理

**数据处理**
- pandas: 数据分析
- pytrends: Google Trends API
- httpx: 异步HTTP客户端

---

## 数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free',  -- free, basic, pro
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 关键词表
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(500) NOT NULL,
    volume INT,  -- 搜索量
    momentum FLOAT,  -- 趋势斜率
    score FLOAT,  -- 综合评分
    category VARCHAR(100),  -- 分类
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(keyword)
);

-- Trends数据表
CREATE TABLE trends_data (
    id SERIAL PRIMARY KEY,
    keyword_id INT REFERENCES keywords(id),
    date DATE NOT NULL,
    value INT NOT NULL,  -- 热度值 0-100
    geo VARCHAR(10) DEFAULT 'US',
    UNIQUE(keyword_id, date, geo)
);

-- 用户搜索历史
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    keyword VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 订阅记录
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(20),
    status VARCHAR(20),  -- active, canceled, past_due
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_keywords_score ON keywords(score DESC);
CREATE INDEX idx_keywords_category ON keywords(category);
CREATE INDEX idx_trends_keyword_date ON trends_data(keyword_id, date);
CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);
```


---

## API设计

### RESTful API端点

**认证相关**
```
POST   /api/auth/register      # 用户注册
POST   /api/auth/login         # 用户登录
POST   /api/auth/refresh       # 刷新Token
GET    /api/auth/me            # 获取当前用户信息
```

**关键词搜索**
```
GET    /api/keywords/search    # 搜索关键词
  Query参数:
  - q: 搜索词
  - category: 分类过滤
  - limit: 返回数量 (默认20)
  - offset: 分页偏移

GET    /api/keywords/trending  # 获取热门关键词
  Query参数:
  - category: 分类
  - period: 时间范围 (7d, 30d, 90d)
  - limit: 返回数量

GET    /api/keywords/{id}      # 获取关键词详情
  返回: 关键词信息 + Trends数据 + 相关词
```

**Trends数据**
```
GET    /api/trends/{keyword}   # 获取Trends时间序列
  Query参数:
  - geo: 地区 (US, GB, etc)
  - timeframe: 时间范围 (today 3-m, today 12-m)

POST   /api/trends/compare     # 对比多个关键词
  Body: { keywords: ["keyword1", "keyword2"] }
```

**用户功能**
```
GET    /api/user/history       # 搜索历史
POST   /api/user/favorites     # 收藏关键词
GET    /api/user/favorites     # 获取收藏列表
DELETE /api/user/favorites/{id} # 取消收藏
```

**订阅管理**
```
POST   /api/subscription/create    # 创建订阅
POST   /api/subscription/cancel    # 取消订阅
GET    /api/subscription/status    # 订阅状态
POST   /api/webhook/stripe         # Stripe Webhook
```


---

## 项目目录结构

```
trendscout/
├── frontend/                    # Next.js前端
│   ├── app/                     # App Router
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # 主应用页面
│   │   │   ├── search/
│   │   │   ├── trending/
│   │   │   └── favorites/
│   │   ├── api/                # API路由（轻量级）
│   │   ├── layout.tsx
│   │   └── page.tsx            # 首页
│   ├── components/             # React组件
│   │   ├── ui/                 # shadcn/ui组件
│   │   ├── charts/             # 图表组件
│   │   └── layout/             # 布局组件
│   ├── lib/                    # 工具函数
│   │   ├── api.ts              # API客户端
│   │   ├── auth.ts             # 认证逻辑
│   │   └── utils.ts
│   ├── public/                 # 静态资源
│   ├── package.json
│   └── next.config.js
│
├── backend/                     # FastAPI后端
│   ├── app/
│   │   ├── api/                # API路由
│   │   │   ├── auth.py
│   │   │   ├── keywords.py
│   │   │   ├── trends.py
│   │   │   └── subscription.py
│   │   ├── models/             # 数据模型
│   │   │   ├── user.py
│   │   │   ├── keyword.py
│   │   │   └── subscription.py
│   │   ├── services/           # 业务逻辑
│   │   │   ├── trends_service.py
│   │   │   ├── scoring_service.py
│   │   │   └── stripe_service.py
│   │   ├── core/               # 核心配置
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   └── main.py             # 应用入口
│   ├── alembic/                # 数据库迁移
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/                        # 数据处理脚本
│   ├── import_keywords.py      # 导入现有26k关键词
│   ├── update_trends.py        # 定期更新Trends数据
│   └── scoring.py              # 评分算法
│
├── scripts/                     # 部署和维护脚本
│   ├── deploy.sh
│   └── backup.sh
│
└── docs/                        # 文档
    ├── developer-guide.md      # 本文档
    ├── api-reference.md        # API文档
    └── deployment.md           # 部署指南
```


---

## 开发流程

### Phase 1: 环境搭建 (Day 1-2)

**前端初始化**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn-ui@latest init
npm install swr recharts
```

**后端初始化**
```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic-settings
pip install python-jose passlib bcrypt pytrends pandas
pip freeze > requirements.txt
```

**数据库设置**
```bash
# Railway创建PostgreSQL实例
# 获取DATABASE_URL
# 配置环境变量
```

### Phase 2: 核心功能开发 (Day 3-10)

**优先级排序**
1. 用户认证 (Day 3-4)
2. 关键词搜索 (Day 5-6)
3. Trends数据展示 (Day 7-8)
4. 基础UI (Day 9-10)

### Phase 3: 数据导入 (Day 11-12)

**导入现有数据**
```python
# data/import_keywords.py
import pandas as pd
from sqlalchemy import create_engine

# 读取现有26k关键词
df = pd.read_csv('../google-trends/keywords/dedup_clean.txt', 
                 names=['keyword'])

# 批量导入数据库
engine = create_engine(DATABASE_URL)
df.to_sql('keywords', engine, if_exists='append', index=False)
```

### Phase 4: 支付集成 (Day 13-14)

**Stripe集成步骤**
1. 创建Stripe账号
2. 配置产品和价格
3. 实现Checkout流程
4. 处理Webhook事件


---

## 核心功能实现示例

### 1. 用户认证 (FastAPI)

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
async def register(email: str, password: str):
    # 检查用户是否存在
    # 创建新用户
    # 返回token
    pass

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 验证用户
    # 返回token
    pass
```


### 2. 关键词搜索服务

```python
# backend/app/services/keyword_service.py
from sqlalchemy.orm import Session
from sqlalchemy import or_

class KeywordService:
    def search_keywords(self, db: Session, query: str, limit: int = 20):
        """搜索关键词"""
        return db.query(Keyword).filter(
            or_(
                Keyword.keyword.ilike(f"%{query}%"),
                Keyword.category.ilike(f"%{query}%")
            )
        ).order_by(Keyword.score.desc()).limit(limit).all()
    
    def get_trending(self, db: Session, category: str = None, limit: int = 50):
        """获取热门关键词"""
        query = db.query(Keyword).filter(Keyword.momentum > 0)
        if category:
            query = query.filter(Keyword.category == category)
        return query.order_by(Keyword.score.desc()).limit(limit).all()
```

### 3. Trends数据服务

```python
# backend/app/services/trends_service.py
from pytrends.request import TrendReq
import pandas as pd

class TrendsService:
    def __init__(self):
        self.pytrends = TrendReq(hl='en-US', tz=360)
    
    def get_trends_data(self, keyword: str, timeframe: str = 'today 12-m'):
        """获取Trends时间序列数据"""
        self.pytrends.build_payload([keyword], timeframe=timeframe)
        data = self.pytrends.interest_over_time()
        
        if data.empty:
            return []
        
        # 转换为API响应格式
        return [
            {"date": str(date), "value": int(row[keyword])}
            for date, row in data.iterrows()
        ]
    
    def compare_keywords(self, keywords: list, timeframe: str = 'today 3-m'):
        """对比多个关键词"""
        self.pytrends.build_payload(keywords, timeframe=timeframe)
        data = self.pytrends.interest_over_time()
        return data.to_dict('records')
```


### 4. 前端API客户端

```typescript
// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function searchKeywords(query: string, limit = 20) {
  const res = await fetch(`${API_BASE}/api/keywords/search?q=${query}&limit=${limit}`)
  return res.json()
}

export async function getTrendsData(keyword: string) {
  const res = await fetch(`${API_BASE}/api/trends/${encodeURIComponent(keyword)}`)
  return res.json()
}
```

### 5. 前端搜索页面

```typescript
// frontend/app/(dashboard)/search/page.tsx
'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { searchKeywords } from '@/lib/api'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading } = useSWR(
    query ? `/search/${query}` : null,
    () => searchKeywords(query)
  )

  return (
    <div className="container mx-auto p-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search keywords..."
        className="w-full p-2 border rounded"
      />
      {isLoading && <p>Loading...</p>}
      {data && (
        <div className="mt-4 grid gap-4">
          {data.map((kw: any) => (
            <div key={kw.id} className="p-4 border rounded">
              <h3 className="font-bold">{kw.keyword}</h3>
              <p>Score: {kw.score}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```


---

## 部署方案

### 前端部署 (Vercel)

**步骤**
1. 推送代码到GitHub
2. 连接Vercel账号
3. 导入仓库
4. 配置环境变量
5. 自动部署

**环境变量**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxx
```

**成本**: $0 (免费套餐)

### 后端部署 (Railway)

**步骤**
1. 创建Railway项目
2. 添加PostgreSQL服务
3. 部署FastAPI应用
4. 配置域名

**环境变量**
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**成本**: $5-10/月

### 数据库备份

```bash
# 每日自动备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```


---

## 性能优化

### 前端优化
- 使用Next.js SSG预渲染静态页面
- 图片优化: next/image
- 代码分割: 动态导入
- CDN加速: Vercel自动配置

### 后端优化
- 数据库索引优化
- Redis缓存热门查询
- 异步处理: FastAPI原生支持
- 连接池: SQLAlchemy配置

### 缓存策略
```python
# 缓存Trends数据 (24小时)
@cache(expire=86400)
def get_trends_data(keyword: str):
    return trends_service.get_trends_data(keyword)
```

---

## 开发规范

### 代码风格
- Python: Black + isort
- TypeScript: Prettier + ESLint
- 提交信息: Conventional Commits

### 测试
- 后端: pytest
- 前端: Jest + React Testing Library
- E2E: Playwright (可选)

### CI/CD
- GitHub Actions
- 自动测试
- 自动部署

---

## 监控和日志

### 应用监控
- Vercel Analytics (前端)
- Railway Metrics (后端)
- Sentry (错误追踪)

### 日志
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

---

## 安全考虑

1. **认证安全**
   - JWT过期时间: 30分钟
   - 密码哈希: bcrypt
   - HTTPS强制

2. **API安全**
   - 速率限制: 100请求/分钟
   - CORS配置
   - SQL注入防护: ORM

3. **支付安全**
   - Stripe Webhook验证
   - 敏感信息加密

---

## 成本估算

| 项目 | 成本 | 说明 |
|------|------|------|
| Vercel | $0 | 免费套餐 |
| Railway | $5-10/月 | 基础套餐 |
| 域名 | $12/年 | .dev域名 |
| Stripe | 2.9%+$0.3/笔 | 交易费用 |
| **总计** | ~$10/月 | 启动成本 |

---

## 下一步

1. 创建GitHub仓库
2. 初始化前后端项目
3. 配置开发环境
4. 开始第一个功能开发

准备好开始了吗？

