from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notification, User
from app.auth import get_current_user
from app.schemas.notification import NotificationCreate, NotificationResponse

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

@router.post("/create_notification", response_model=NotificationResponse)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_notification = Notification(**notification.model_dump(), user_id=current_user.id)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.patch("/{notification_id}/update_read", response_model=NotificationResponse)
def update_notification_read_status(notification_id: int, new_is_read: bool = True, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db_notification.is_read = new_is_read
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.delete("/{notification_id}/delete", response_model=NotificationResponse)
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(db_notification)
    db.commit()
    return db_notification