from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import logging

from backend.models.database import get_db, DBXPEvent, DBNotification
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/vibescore", tags=["VibeScore"])
logger = logging.getLogger("vibescore_router")

class AwardRequest(BaseModel):
    user_id: str
    event_type: str
    xp_amount: float

def get_total_xp(db: Session, user_id: str) -> float:
    total = db.query(func.sum(DBXPEvent.xp_amount)).filter(DBXPEvent.user_id == user_id).scalar()
    return total or 0.0

def get_tier(xp: float) -> str:
    if xp < 100:
        return "Paper Hands Beginner"
    elif xp < 300:
        return "Vibe Checker"
    elif xp < 600:
        return "Diamond Hands HODLer"
    else:
        return "Vibe Score"

@router.post("/award")
async def award_xp(req: AwardRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = user_id if user_id != "default_user" else req.user_id
    # 1. Get current XP before adding new event
    old_xp = get_total_xp(db, uid)
    old_tier = get_tier(old_xp)
    
    # 2. Add new XP event
    event = DBXPEvent(
        user_id=uid,
        event_type=req.event_type,
        xp_amount=req.xp_amount
    )
    db.add(event)
    
    # Check for specific event type notifications
    if req.event_type == "stress_test_run":
        stress_notif = DBNotification(
            user_id=uid,
            type="stress_test_complete",
            message="Stress Test Complete: simulated macro-shocks on your holdings successfully. +25 XP! ⚡"
        )
        db.add(stress_notif)
        
    db.commit()
    db.refresh(event)
    
    # 3. Get new total XP and tier
    new_xp = old_xp + req.xp_amount
    new_tier = get_tier(new_xp)
    
    # 4. Check for level up milestones
    level_up = False
    if old_tier != new_tier:
        level_up = True
        milestone_notification = DBNotification(
            user_id=uid,
            type="xp_milestone",
            message=f"Congrats! You leveled up to '{new_tier}'! ⚡"
        )
        db.add(milestone_notification)
        db.commit()
        
    return {
        "success": True,
        "event_id": event.id,
        "xp_awarded": req.xp_amount,
        "new_score": new_xp,
        "tier": new_tier,
        "level_up": level_up
    }

@router.get("/{user_id}")
async def get_vibescore(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id not in ("default_user", "guest_user") and auth_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's vibe score")
    total_xp = get_total_xp(db, user_id)
    tier = get_tier(total_xp)
    
    events = db.query(DBXPEvent).filter(DBXPEvent.user_id == user_id).order_by(DBXPEvent.created_at.desc()).limit(15).all()
    history = []
    for ev in events:
        history.append({
            "id": ev.id,
            "event_type": ev.event_type,
            "xp_amount": ev.xp_amount,
            "created_at": ev.created_at.isoformat()
        })
        
    return {
        "user_id": user_id,
        "current_score": total_xp,
        "tier": tier,
        "xp_history": history
    }

@router.get("/notifications/{user_id}")
async def get_notifications(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id not in ("default_user", "guest_user") and auth_user_id != user_id and user_id not in ("guest_user", "default_user"):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's notifications")
    notifications = db.query(DBNotification).filter(DBNotification.user_id == user_id).order_by(DBNotification.created_at.desc()).limit(10).all()
    unread_count = db.query(DBNotification).filter(DBNotification.user_id == user_id, DBNotification.is_read == False).count()
    
    res = []
    for n in notifications:
        res.append({
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        })
        
    return {
        "unread_count": unread_count,
        "notifications": res
    }

@router.post("/notifications/read/{user_id}")
async def mark_notifications_read(user_id: str, auth_user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if auth_user_id not in ("default_user", "guest_user") and auth_user_id != user_id and user_id not in ("guest_user", "default_user"):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's notifications")
    db.query(DBNotification).filter(DBNotification.user_id == user_id, DBNotification.is_read == False).update({DBNotification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"success": True}
