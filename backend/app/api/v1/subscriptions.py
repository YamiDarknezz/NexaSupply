"""API v1 subscriptions router — production, requires valid JWT."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.subscription import Subscription
from ...models.store import Store
from .auth import get_current_user

router = APIRouter()


@router.post("", status_code=201)
def api_create_subscription(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    store_id = str(current_user.id)
    plan = payload.get("plan", "basic")
    if plan not in ("basic", "premium"):
        raise HTTPException(400, "Plan inválido. Use 'basic' o 'premium'")

    existing = db.query(Subscription).filter(
        Subscription.store_id == store_id,
        Subscription.status == "active",
    ).first()
    if existing:
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
def api_get_subscription(
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    store_id = str(current_user.id)
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
