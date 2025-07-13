from app.database import Base
from sqlalchemy import DateTime, ForeignKey, func, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class UserProduct(Base):
    __tablename__ = "user_products"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        nullable=False
    )
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    notify: Mapped[bool] = mapped_column(nullable=False)
    lower_threshold: Mapped[float] = mapped_column(nullable=True)
    upper_threshold: Mapped[float] = mapped_column(nullable=True)

    # Relationships
    product = relationship(back_populates="user_products")
    user = relationship(back_populates="user_products")

    def __repr__(self):
        return f"<Alert(id={self.id}, product_id={self.product_id}, user_id={self.user_id})>"