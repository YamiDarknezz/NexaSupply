"""API v1 router - production endpoints with JWT auth."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def api_health():
    return {"status": "ok", "service": "nexasupply-api"}
