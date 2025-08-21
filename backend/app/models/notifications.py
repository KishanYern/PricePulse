from app.database import Base
from sqlalchemy import DateTime, String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.models.users import User

class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(primary_key=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False
    )

    # Relationships
    # Defines the 'recipient' property that links back to the User model.
    recipient: Mapped["User"] = relationship(
        foreign_keys=[user_id], 
        back_populates="received_notifications"
    )
    
    # Defines the 'sender' property that links back to the User model.
    sender: Mapped["User"] = relationship(
        foreign_keys=[from_user_id], 
        back_populates="sent_notifications"
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, message={self.message}, created_at={self.created_at})>"