from app.database import Base
from sqlalchemy import DateTime, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class User(Base):
    """
    User model for the application.
    """
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        nullable=False
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    alerts = relationship( 
        "Alert",
        back_populates="user",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    user_products = relationship(
        "UserProduct",
        back_populates="user",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

# Notifications this user has RECEIVED
    received_notifications = relationship(
        "Notification",
        foreign_keys="[Notification.user_id]",
        back_populates="recipient",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    # Notifications this user has SENT
    sent_notifications = relationship(
        "Notification",
        foreign_keys="[Notification.from_user_id]",
        back_populates="sender",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
    