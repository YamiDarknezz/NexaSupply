"""Dev subscriptions router — no auth, uses X-Store-ID header."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.subscription import Subscription

router = APIRouter()


def _get_dev_store_id(x_store_id: str = Header(None)) -> str:
    if not x_store_id:
        raise HTTPException(401, "X-Store-ID header requerido para modo dev")
    return x_store_id


@router.post("", status_code=201)
def dev_create_subscription(
    payload: dict,
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    plan = payload.get("plan", "basic")
    if plan not in ("basic", "premium"):
        raise HTTPException(400, "Plan inválido. Use 'basic' o 'premium'")

    # Check if store already has active subscription
    existing = db.query(Subscription).filter(
        Subscription.store_id == store_id,
        Subscription.status == "active",
    ).first()
    if existing:
        # Upgrade existing
        existing.plan = plan
        existing.end_date = datetime.now(timezone.utc) + timedelta(days=30)
        db.commit()
        return {
            "id": str(existing.id),
            "plan": existing.plan,
            "status": existing.status,
            "start_date": existing.start_date.isoformat() if existing.start_date else None,
            "end_date": existing.end_date.isoformat() if existing.end_date else None,
        }

    sub = Subscription(
        store_id=store_id,
        plan=plan,
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub.end_date else None,
    }


@router.get("/me")
def dev_get_subscription(
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(
        Subscription.store_id == store_id,
        Subscription.status == "active",
    ).first()
    if not sub:
        raise HTTPException(404, "No tienes una suscripción activa")
    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub.end_date else None,
    }
