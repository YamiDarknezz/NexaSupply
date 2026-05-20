"""Dev router - mirrors /api/v1 but without auth. For testing."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def dev_health():
    return {"status": "ok", "service": "nexasupply-api"}
