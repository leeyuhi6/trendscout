# TrendScout 词库更新与实时查询策略

## 问题分析

**现状**:
- 现有词库: 26,573个关键词
- 覆盖范围: 有限，无法满足所有用户需求
- 挑战: 如何持续扩展 + 如何处理未覆盖的查询

---

## 策略一：词库持续更新机制

### 1. 用户驱动的词库扩展（核心策略）

**逻辑**:
```
用户搜索 → 词库没有 → 实时调用Google Trends → 返回结果 → 异步存入词库
```

**优势**:
- 词库自动增长
- 用户需求驱动
- 零人工维护成本

**实现流程**:
```python
# backend/app/services/keyword_service.py

async def search_keyword(query: str, db: Session):
    # 1. 先查本地词库
    keyword = db.query(Keyword).filter(Keyword.keyword == query).first()
    
    if keyword:
        # 命中词库，直接返回
        return keyword
    
    # 2. 词库未命中，实时调用Google Trends
    trends_data = await trends_service.get_trends_data(query)
    
    if not trends_data:
        return {"error": "No data available"}
    
    # 3. 计算评分
    score = scoring_service.calculate_score(trends_data)
    
    # 4. 异步存入词库（后台任务）
    background_tasks.add_task(save_to_database, query, trends_data, score)
    
    # 5. 立即返回结果给用户
    return {
        "keyword": query,
        "trends": trends_data,
        "score": score,
        "source": "real-time"  # 标记为实时查询
    }
```


### 2. 定期批量更新（补充策略）

**每周自动扩展**:
```python
# data/weekly_expansion.py

def weekly_keyword_expansion():
    """每周自动扩展词库"""
    
    # 1. 分析用户搜索日志，找出高频未命中词
    top_missing = get_top_missing_keywords(limit=1000)
    
    # 2. 使用Google Suggest API扩展
    for keyword in top_missing:
        suggestions = get_google_suggestions(keyword)
        # 批量获取Trends数据
        # 存入词库
    
    # 3. 基于现有词库，生成相关词
    for category in categories:
        related = generate_related_keywords(category)
        # 存入词库
```

**触发条件**:
- 每周日凌晨自动执行
- 或词库命中率 < 80% 时触发

**预期增长**:
- 每周新增 1000-2000 词
- 6个月达到 50,000+ 词
- 1年达到 100,000+ 词


---

## 策略二：实时查询处理机制

### 1. 三层查询架构

```
Layer 1: 本地词库（最快，<50ms）
    ↓ 未命中
Layer 2: Redis缓存（快，<200ms）
    ↓ 未命中  
Layer 3: 实时Google Trends API（慢，2-5s）
```

### 2. 实时查询的用户体验优化

**方案A: 渐进式加载**
```typescript
// 前端实现
async function searchKeyword(query: string) {
  // 1. 立即显示加载状态
  setLoading(true)
  
  // 2. 先返回基础信息（如果有）
  const basic = await getBasicInfo(query)
  if (basic) {
    setData(basic)  // 先显示部分数据
  }
  
  // 3. 异步加载完整Trends数据
  const full = await getTrendsData(query)
  setData(full)  // 更新完整数据
  setLoading(false)
}
```

**用户看到的流程**:
1. 输入关键词 → 立即显示"正在分析..."
2. 0.5秒后 → 显示基础信息（词频、分类）
3. 2-3秒后 → 显示完整Trends图表


### 3. 智能缓存策略

**Redis缓存层**:
```python
# 缓存实时查询结果
@cache(expire=86400)  # 24小时
async def get_trends_cached(keyword: str):
    return await trends_service.get_trends_data(keyword)
```

**缓存优先级**:
- 高频词: 缓存7天
- 中频词: 缓存3天  
- 低频词: 缓存1天
- 实时查询: 缓存24小时

**缓存命中率目标**: 85%+


---

## 策略三：API成本控制

### 1. 用户限流策略

**Free用户**:
- 每天5次搜索
- 只能查词库内的词
- 实时查询不可用

**Paid用户**:
- 无限搜索词库内的词
- 每天20次实时查询（词库外）
- 超出后提示升级或等待

**实现**:
```python
@rate_limit(max_calls=20, period=86400)  # 每天20次
async def real_time_search(user_id: int, keyword: str):
    # 检查用户套餐
    if not user.is_paid:
        raise HTTPException(403, "Upgrade to access real-time search")
    
    # 执行实时查询
    return await get_trends_data(keyword)
```


### 2. 智能推荐降低实时查询

**策略**: 用户搜索时，优先推荐词库内的相关词

```python
async def search_with_suggestions(query: str):
    # 1. 模糊匹配词库
    matches = fuzzy_search(query, limit=10)
    
    if matches:
        return {
            "exact": None,
            "suggestions": matches,
            "message": "Did you mean one of these?"
        }
    
    # 2. 如果没有匹配，才实时查询
    return await real_time_search(query)
```

**效果**: 减少70%的实时API调用


---

## 策略四：数据质量控制

### 1. 实时查询结果验证

```python
def validate_trends_data(keyword: str, data: dict) -> bool:
    """验证Trends数据质量"""
    
    # 检查1: 数据不为空
    if not data or len(data) == 0:
        return False
    
    # 检查2: 热度值合理（0-100）
    if any(d['value'] < 0 or d['value'] > 100 for d in data):
        return False
    
    # 检查3: 时间序列完整
    if len(data) < 10:  # 至少10个数据点
        return False
    
    return True
```

### 2. 低质量词过滤

**不存入词库的情况**:
- 搜索量为0的词
- 数据不完整的词
- 明显的垃圾词（乱码、超长）


---

## 策略五：监控与优化

### 1. 关键指标监控

```python
# 每日统计
metrics = {
    "词库大小": count_keywords(),
    "词库命中率": cache_hit_rate(),
    "实时查询次数": real_time_queries_count(),
    "新增词数": new_keywords_today(),
    "API调用成本": api_cost_today()
}
```

**告警阈值**:
- 词库命中率 < 80% → 触发扩展
- 实时查询 > 1000次/天 → 成本告警
- API失败率 > 5% → 服务告警

### 2. 自动优化

**每月自动清理**:
- 删除6个月无人查询的低质量词
- 保留高频词和高分词
- 保持词库精简高效


---

## 完整策略总结

### 📊 词库增长预测

| 时间 | 词库规模 | 命中率 | 实时查询/天 |
|------|---------|--------|------------|
| 启动 | 26,573 | 60% | 500 |
| 1个月 | 35,000 | 75% | 300 |
| 3个月 | 50,000 | 85% | 150 |
| 6个月 | 80,000 | 90% | 100 |
| 1年 | 120,000+ | 95% | 50 |

### 💰 成本控制

**Google Trends API成本**:
- 免费额度: 无限（但有速率限制）
- 实际成本: 服务器带宽 + 时间
- 预估: $20-50/月（1000次实时查询）

**优化后**:
- 词库命中率 90% → 只需100次实时查询/天
- 月成本: $5-10

### 🎯 核心优势

1. **用户驱动增长**: 词库自动扩展，无需人工维护
2. **智能推荐**: 减少70%实时查询
3. **分层缓存**: 85%+命中率
4. **成本可控**: 月成本<$10

### 🚀 实施优先级

**Phase 1 (MVP)**:
- ✅ 基础词库（26k）
- ✅ 实时查询功能
- ✅ 异步存储

**Phase 2 (优化)**:
- ✅ Redis缓存
- ✅ 智能推荐
- ✅ 用户限流

**Phase 3 (扩展)**:
- ✅ 定期批量更新
- ✅ 数据质量控制
- ✅ 监控告警

---

## 用户体验流程图

```
用户输入关键词
    ↓
检查本地词库
    ├─ 命中 → 立即返回（<50ms）✅
    └─ 未命中
        ↓
    检查Redis缓存
        ├─ 命中 → 快速返回（<200ms）✅
        └─ 未命中
            ↓
        智能推荐相似词
            ├─ 有推荐 → 显示"您是否想查询..."
            └─ 无推荐
                ↓
            检查用户权限
                ├─ Free用户 → 提示升级
                └─ Paid用户
                    ↓
                实时调用Google Trends（2-5s）
                    ↓
                返回结果 + 异步存入词库
```

**关键点**: 
- 90%的查询在200ms内返回
- 10%的实时查询有明确的加载提示
- 用户体验流畅，不会感觉慢

