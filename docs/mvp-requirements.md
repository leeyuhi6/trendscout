# TrendScout MVP 需求文档

## 文档信息

**项目名称**: TrendScout  
**版本**: MVP v1.0  
**创建日期**: 2026-04-01  
**目标上线**: 2周内  

---

## 一、产品概述

### 1.1 产品定位
AI驱动的趋势关键词发现工具，帮助SEO从业者、内容创作者快速发现高潜力关键词。

### 1.2 核心价值
- 节省90%的关键词研究时间
- AI评分直接告诉你哪个词最值得做
- 价格仅为竞品的1/10

### 1.3 目标用户
- SEO从业者
- 内容创作者
- 独立开发者
- 数字营销人员

---

## 二、MVP范围

### 2.1 核心功能（必须有）

**1. 用户认证**
- 邮箱注册/登录
- JWT Token认证
- 密码找回（简化版）

**2. 关键词搜索**
- 搜索框输入关键词
- 显示搜索结果列表
- 显示AI评分

**3. Trends数据展示**
- 12个月趋势图表
- 基础数据指标
- 相关关键词推荐

**4. 用户限制**
- Free用户: 每天5次搜索
- 显示升级提示


### 2.2 暂不实现（V2版本）

- ❌ 支付功能（先用等待列表）
- ❌ 用户Dashboard
- ❌ 历史记录
- ❌ 收藏功能
- ❌ 数据导出
- ❌ 邮件通知
- ❌ 社交登录

---

## 三、功能详细说明

### 3.1 首页

**页面元素**:
- Hero区域: 标题 + 副标题 + CTA按钮
- 搜索框（大号）
- 功能特点（3-4个）
- 定价表格（简化版）
- FAQ（3-5个问题）

**交互**:
- 未登录用户可以看到首页
- 点击"开始使用"跳转到注册页


### 3.2 用户注册/登录

**注册页面**:
- 邮箱输入框
- 密码输入框（最少8位）
- 确认密码
- "注册"按钮
- "已有账号？登录"链接

**登录页面**:
- 邮箱输入框
- 密码输入框
- "登录"按钮
- "忘记密码？"链接
- "没有账号？注册"链接

**验证规则**:
- 邮箱格式验证
- 密码长度 ≥ 8位
- 密码需包含字母和数字

**错误提示**:
- 邮箱已存在
- 邮箱或密码错误
- 网络错误


### 3.3 关键词搜索页面

**页面布局**:
```
┌─────────────────────────────────────┐
│  Header (Logo + 用户信息)            │
├─────────────────────────────────────┤
│  搜索框 [_______________] [搜索]     │
├─────────────────────────────────────┤
│  搜索结果列表                        │
│  ┌───────────────────────────────┐  │
│  │ Keyword: "AI writing tools"   │  │
│  │ Score: 78.5 ⭐⭐⭐⭐           │  │
│  │ Volume: 75 | Momentum: 82     │  │
│  │ [查看详情]                     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**搜索逻辑**:
1. 用户输入关键词
2. 点击搜索或按Enter
3. 显示加载状态
4. 返回结果列表（最多20条）
5. 按评分排序

**结果卡片显示**:
- 关键词名称
- AI评分（0-100）
- 热度指标
- 趋势指标
- "查看详情"按钮


### 3.4 关键词详情页

**页面内容**:
1. **关键词标题**
   - 关键词名称
   - AI评分（大号显示）
   - 分类标签

2. **Trends图表**
   - 12个月趋势折线图
   - X轴: 时间
   - Y轴: 热度值(0-100)

3. **关键指标**
   - Volume（搜索量）
   - Momentum（趋势斜率）
   - Recency（近期加速）
   - 市场覆盖

4. **相关关键词**（5-10个）
   - 显示相似词
   - 点击可跳转

**交互**:
- 图表可悬停查看具体数值
- 相关词点击跳转到对应详情页


### 3.5 用户限制

**Free用户限制**:
- 每天5次搜索
- 只能查看词库内的关键词
- 查看完整Trends数据

**限制提示**:
```
┌─────────────────────────────────────┐
│  ⚠️ 今日搜索次数已用完              │
│                                     │
│  您今天已使用 5/5 次搜索            │
│  明天将自动重置                     │
│                                     │
│  [升级到Pro] [了解更多]             │
└─────────────────────────────────────┘
```

**计数逻辑**:
- 每次搜索计数+1
- 每天UTC 00:00重置
- 存储在数据库


---

## 四、API接口定义

### 4.1 认证接口

**POST /api/auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "plan": "free"
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {...}
}
```


### 4.2 搜索接口

**GET /api/keywords/search?q={keyword}**
```json
Request Headers:
Authorization: Bearer {token}

Response:
{
  "results": [
    {
      "id": 1,
      "keyword": "AI writing tools",
      "score": 78.5,
      "volume": 75,
      "momentum": 82,
      "category": "AI工具"
    }
  ],
  "total": 15,
  "remaining_searches": 4
}
```

**GET /api/keywords/{id}**
```json
Response:
{
  "id": 1,
  "keyword": "AI writing tools",
  "score": 78.5,
  "volume": 75,
  "momentum": 82,
  "recency": 68,
  "category": "AI工具",
  "trends_data": [
    {"date": "2025-04", "value": 65},
    {"date": "2025-05", "value": 72},
    ...
  ],
  "related_keywords": [
    {"id": 2, "keyword": "AI content writer", "score": 75}
  ]
}
```


---

## 五、数据库设计（MVP简化版）

### 5.1 核心表

**users表**:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free',
    daily_searches INT DEFAULT 0,
    last_search_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**keywords表**:
```sql
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(500) NOT NULL UNIQUE,
    score FLOAT,
    volume INT,
    momentum FLOAT,
    category VARCHAR(100),
    last_updated TIMESTAMP DEFAULT NOW()
);
```

**trends_data表**:
```sql
CREATE TABLE trends_data (
    id SERIAL PRIMARY KEY,
    keyword_id INT REFERENCES keywords(id),
    date DATE NOT NULL,
    value INT NOT NULL,
    UNIQUE(keyword_id, date)
);
```


---

## 六、UI设计要求

### 6.1 设计风格

**色彩方案**:
- 主色: #3B82F6 (蓝色)
- 辅色: #10B981 (绿色)
- 背景: #F9FAFB (浅灰)
- 文字: #111827 (深灰)

**字体**:
- 标题: Inter, sans-serif
- 正文: Inter, sans-serif
- 代码: Fira Code, monospace

**组件库**: shadcn/ui


### 6.2 响应式设计

**断点**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**移动端优化**:
- 搜索框全宽
- 结果卡片堆叠显示
- 图表自适应宽度


---

## 七、开发计划

### 7.1 Week 1: 基础架构

**Day 1-2: 项目搭建**
- [ ] 创建GitHub仓库
- [ ] 初始化Next.js前端
- [ ] 初始化FastAPI后端
- [ ] 配置开发环境

**Day 3-4: 数据库**
- [ ] 设计数据库表结构
- [ ] 创建迁移脚本
- [ ] 导入26k关键词数据

**Day 5-7: 用户认证**
- [ ] 实现注册/登录API
- [ ] 实现JWT认证
- [ ] 前端登录页面


### 7.2 Week 2: 核心功能

**Day 1-3: 搜索功能**
- [ ] 实现关键词搜索API
- [ ] 实现评分算法
- [ ] 前端搜索页面
- [ ] 结果列表展示

**Day 4-5: 详情页**
- [ ] 实现详情API
- [ ] 集成Recharts图表
- [ ] 显示Trends数据
- [ ] 相关词推荐

**Day 6-7: 用户限制 + 部署**
- [ ] 实现搜索次数限制
- [ ] 部署到Vercel + Railway
- [ ] 测试和修复bug


---

## 八、测试要求

### 8.1 功能测试

**用户认证**:
- [ ] 注册成功
- [ ] 邮箱重复提示
- [ ] 登录成功
- [ ] 密码错误提示
- [ ] Token过期处理

**搜索功能**:
- [ ] 搜索返回结果
- [ ] 无结果提示
- [ ] 搜索次数计数
- [ ] 达到限制提示

**详情页**:
- [ ] 图表正确显示
- [ ] 数据准确
- [ ] 相关词跳转


### 8.2 性能测试

- [ ] 首页加载 < 2秒
- [ ] 搜索响应 < 1秒
- [ ] 图表渲染 < 500ms
- [ ] 移动端流畅

---

## 九、验收标准

### 9.1 功能完整性

- ✅ 用户可以注册/登录
- ✅ 用户可以搜索关键词
- ✅ 用户可以查看详情和图表
- ✅ Free用户每天限制5次搜索
- ✅ 超限后显示升级提示


### 9.2 用户体验

- ✅ 界面简洁美观
- ✅ 操作流畅无卡顿
- ✅ 错误提示清晰
- ✅ 移动端适配良好

### 9.3 技术指标

- ✅ 代码通过测试
- ✅ 无严重bug
- ✅ 部署成功
- ✅ 监控配置完成

---

## 十、风险与应对

### 10.1 技术风险

**风险**: Google Trends API限流
**应对**: 实现缓存机制，减少API调用

**风险**: 数据库性能
**应对**: 建立索引，优化查询

### 10.2 时间风险

**风险**: 2周时间紧张
**应对**: 严格按MVP范围，砍掉非核心功能

---

## 十一、上线后计划

### 11.1 数据收集

- 用户注册数
- 搜索次数
- 热门关键词
- 用户反馈

### 11.2 快速迭代

- 根据用户反馈优化
- 修复bug
- 准备V2功能（支付）

---

## 附录：MVP检查清单

**开发前**:
- [ ] 需求评审通过
- [ ] 技术方案确认
- [ ] 开发环境就绪

**开发中**:
- [ ] 每日进度更新
- [ ] 代码提交规范
- [ ] 功能自测通过

**上线前**:
- [ ] 功能测试完成
- [ ] 性能测试通过
- [ ] 部署配置检查
- [ ] 监控告警配置

**上线后**:
- [ ] 监控数据正常
- [ ] 用户反馈收集
- [ ] bug修复及时

