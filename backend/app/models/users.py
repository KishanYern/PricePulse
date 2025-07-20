from app.database import Base
from sqlalchemy import DateTime, String, func
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

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
    
    def verify_password(self, password: str) -> bool:
        """
        Verify the provided password against the stored hashed password.
        """
        from app.utils import verify_password
        return verify_password(password, self.password)
    