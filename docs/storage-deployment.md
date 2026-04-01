# TrendScout 存储与部署策略

## 一、存储策略

### 1.1 数据存储架构

```
┌─────────────────────────────────────────────────┐
│              应用层 (FastAPI)                    │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL      │    │  Redis           │
│  (主存储)         │    │  (缓存层)         │
│  - 用户数据       │    │  - 查询缓存       │
│  - 关键词库       │    │  - 会话管理       │
│  - Trends数据     │    │  - 速率限制       │
│  - 订阅记录       │    │                  │
└──────────────────┘    └──────────────────┘
        ↓
┌──────────────────┐
│  S3/对象存储      │
│  (可选)           │
│  - 数据备份       │
│  - 导出文件       │
└──────────────────┘
```

### 1.2 PostgreSQL 存储设计

**数据库规模估算**:
```
启动阶段:
- 关键词: 26,573条 × 500B ≈ 13MB
- Trends数据: 26,573 × 52周 × 100B ≈ 138MB
- 用户数据: 1000用户 × 1KB ≈ 1MB
总计: ~150MB

1年后:
- 关键词: 120,000条 × 500B ≈ 60MB
- Trends数据: 120,000 × 52周 × 100B ≈ 624MB
- 用户数据: 10,000用户 × 1KB ≈ 10MB
总计: ~700MB
```

**存储优化策略**:
1. 分区表: 按时间分区Trends数据
2. 索引优化: 关键字段建立索引
3. 定期清理: 删除过期数据


### 1.3 Redis 缓存策略

**缓存内容**:
```python
# 1. 查询结果缓存
cache_key = f"keyword:{keyword_id}"
ttl = 86400  # 24小时

# 2. Trends数据缓存
cache_key = f"trends:{keyword}:{timeframe}"
ttl = 3600  # 1小时

# 3. 用户会话
cache_key = f"session:{user_id}"
ttl = 1800  # 30分钟

# 4. 速率限制
cache_key = f"rate:{user_id}:{date}"
ttl = 86400  # 24小时
```

**内存估算**:
- 1000个热门词缓存: ~10MB
- 1000个活跃用户会话: ~5MB
- 速率限制计数器: ~1MB
- **总计**: ~20MB (Redis免费套餐足够)


### 1.4 数据备份策略

**自动备份**:
```bash
# Railway自动备份（每日）
# 保留7天备份

# 手动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > backup_$DATE.sql.gz

# 上传到S3（可选）
aws s3 cp backup_$DATE.sql.gz s3://trendscout-backups/
```

**备份频率**:
- 每日自动备份: Railway自动
- 每周完整备份: 手动触发
- 重大更新前: 手动备份

**恢复测试**:
- 每月测试一次备份恢复
- 确保数据完整性


---

## 二、部署策略

### 2.1 部署架构

```
┌─────────────────────────────────────────────────┐
│              用户浏览器                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         Cloudflare CDN (可选)                    │
│         - DNS管理                                │
│         - DDoS防护                               │
│         - SSL证书                                │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  Vercel          │    │  Railway         │
│  (前端)           │    │  (后端)           │
│  - Next.js       │◄───┤  - FastAPI       │
│  - 全球CDN       │    │  - PostgreSQL    │
│  - 自动扩展      │    │  - Redis         │
└──────────────────┘    └──────────────────┘
```


### 2.2 前端部署 (Vercel)

**部署流程**:
```bash
# 1. 推送代码到GitHub
git push origin main

# 2. Vercel自动检测并部署
# - 自动构建
# - 自动部署到全球CDN
# - 自动生成预览URL
```

**环境变量配置**:
```env
# Production
NEXT_PUBLIC_API_URL=https://api.trendscout.dev
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxx

# Preview (自动部署分支)
NEXT_PUBLIC_API_URL=https://api-staging.trendscout.dev
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxx
```

**性能优化**:
- 自动图片优化
- 自动代码分割
- 全球CDN加速
- HTTP/2 + Brotli压缩

**成本**: $0 (免费套餐)


### 2.3 后端部署 (Railway)

**部署流程**:
```bash
# 1. 连接GitHub仓库
# Railway自动检测Dockerfile或requirements.txt

# 2. 配置服务
railway up

# 3. 添加PostgreSQL
railway add postgresql

# 4. 添加Redis (可选)
railway add redis
```

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**环境变量**:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**成本**: $5-10/月


### 2.4 数据库迁移

**使用Alembic管理迁移**:
```bash
# 初始化
alembic init alembic

# 创建迁移
alembic revision --autogenerate -m "create keywords table"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

**迁移脚本示例**:
```python
# alembic/versions/001_create_keywords.py
def upgrade():
    op.create_table(
        'keywords',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('keyword', sa.String(500), nullable=False),
        sa.Column('score', sa.Float()),
        sa.Column('created_at', sa.DateTime(), default=datetime.now)
    )
    op.create_index('idx_keywords_score', 'keywords', ['score'])
```


### 2.5 CI/CD 流程

**GitHub Actions配置**:
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up
```

**部署流程**:
```
代码提交 → GitHub
    ↓
自动触发CI
    ↓
运行测试
    ├─ 失败 → 停止部署
    └─ 成功 → 继续
        ↓
    自动部署
    ├─ Vercel (前端)
    └─ Railway (后端)
        ↓
    健康检查
        ↓
    部署完成
```


---

## 三、监控与告警

### 3.1 应用监控

**Vercel Analytics (前端)**:
- 页面访问量
- 加载时间
- 用户地理分布
- 核心Web指标

**Railway Metrics (后端)**:
- CPU使用率
- 内存使用率
- 请求响应时间
- 错误率

**Sentry (错误追踪)**:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://xxx@sentry.io/xxx",
    traces_sample_rate=0.1
)
```


### 3.2 告警配置

**关键指标告警**:
```python
# 后端健康检查
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": check_db_connection(),
        "redis": check_redis_connection(),
        "timestamp": datetime.now()
    }
```

**告警规则**:
- API响应时间 > 2秒 → 警告
- 错误率 > 5% → 严重
- 数据库连接失败 → 紧急
- 磁盘使用 > 80% → 警告


---

## 四、扩展策略

### 4.1 水平扩展

**Railway自动扩展**:
- 根据CPU/内存自动增加实例
- 负载均衡自动配置
- 成本随用量线性增长

**扩展阈值**:
- CPU > 70% 持续5分钟 → 扩展
- 内存 > 80% → 扩展
- 请求队列 > 100 → 扩展

### 4.2 数据库扩展

**垂直扩展** (优先):
- Railway升级套餐
- $5 → $10 → $20/月

**读写分离** (后期):
- 主库: 写操作
- 从库: 读操作
- 成本: +$10/月


---

## 五、成本分析

### 5.1 启动阶段成本 (月)

| 服务 | 配置 | 成本 |
|------|------|------|
| Vercel | 免费套餐 | $0 |
| Railway | Starter | $5 |
| PostgreSQL | 1GB | 包含 |
| Redis | 可选 | $0 |
| 域名 | .dev | $1/月 |
| **总计** | | **$6/月** |

### 5.2 增长阶段成本 (1000用户)

| 服务 | 配置 | 成本 |
|------|------|------|
| Vercel | Pro | $20 |
| Railway | 2实例 | $20 |
| PostgreSQL | 5GB | 包含 |
| Redis | 100MB | 包含 |
| CDN | Cloudflare | $0 |
| 监控 | Sentry | $26 |
| **总计** | | **$66/月** |

**收入**: 100付费用户 × $9 = $900/月  
**利润**: $900 - $66 = **$834/月**


---

## 六、部署检查清单

### 6.1 上线前检查

**前端**:
- [ ] 环境变量配置正确
- [ ] API地址指向生产环境
- [ ] Stripe使用生产密钥
- [ ] SEO元标签完整
- [ ] 404/500错误页面

**后端**:
- [ ] 数据库迁移完成
- [ ] 环境变量配置
- [ ] CORS配置正确
- [ ] 速率限制启用
- [ ] 日志记录配置

**数据库**:
- [ ] 索引创建完成
- [ ] 备份策略配置
- [ ] 连接池配置
- [ ] 初始数据导入

**监控**:
- [ ] Sentry配置
- [ ] 健康检查端点
- [ ] 告警规则设置


### 6.2 部署流程

**第一次部署**:
```bash
# 1. 创建GitHub仓库
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. 部署前端到Vercel
# - 连接GitHub仓库
# - 配置环境变量
# - 自动部署

# 3. 部署后端到Railway
railway login
railway init
railway add postgresql
railway up

# 4. 运行数据库迁移
railway run alembic upgrade head

# 5. 导入初始数据
railway run python data/import_keywords.py
```

**后续更新**:
```bash
git push origin main
# 自动触发CI/CD，无需手动操作
```

---

## 七、总结

### 核心优势

1. **低成本**: 启动仅$6/月
2. **自动扩展**: 无需手动干预
3. **全球CDN**: Vercel自动配置
4. **零停机部署**: 自动回滚
5. **监控完善**: 实时告警

### 技术栈选择理由

| 技术 | 理由 |
|------|------|
| Vercel | 免费、快速、全球CDN |
| Railway | 简单、便宜、自动扩展 |
| PostgreSQL | 稳定、功能强大 |
| Redis | 高性能缓存 |
| GitHub Actions | 免费CI/CD |

### 扩展路径

```
启动: $6/月 (0-100用户)
  ↓
成长: $66/月 (100-1000用户)
  ↓
扩展: $200/月 (1000-10000用户)
```

**关键点**: 成本随收入线性增长，利润率保持在90%+

