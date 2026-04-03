from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.trends import TrendsDataService

router = APIRouter(prefix="/api/keywords", tags=["keywords"])

# 初始化数据服务
DATA_PATH = "/root/.openclaw/workspace/projects/google-trends/data/test_100_results.jsonl"
trends_service = TrendsDataService(DATA_PATH)

@router.get("/search")
async def search_keywords(
    q: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(20, ge=1, le=100)
):
    """搜索关键词"""
    results = trends_service.search(q, limit)
    return {
        "query": q,
        "results": results,
        "total": len(results)
    }

@router.get("/trending")
async def get_trending(limit: int = Query(20, ge=1, le=100)):
    """获取热门趋势"""
    trends = trends_service.get_trending(limit)
    return {
        "trends": trends,
        "total": len(trends)
    }
