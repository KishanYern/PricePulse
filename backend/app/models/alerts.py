from app.database import Base
from sqlalchemy import DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

class AlertType(enum.Enum):
    DROP = "price_drop",
    INCREASE= "price_increase"

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_price: Mapped[float] = mapped_column(nullable=True) # If the user set a price (lower/upper threshold), this would be the value that crossed
    alert_type: Mapped[AlertType | None] = mapped_column(Enum(AlertType), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        nullable=False
    )

    # Relationships
    product = relationship("Product", back_populates="alerts")
    user = relationship("User", back_populates="alerts")

    def __repr__(self):
        return f"<Alert(id={self.id}, product_id={self.product_id}, user_id={self.user_id}, type={self.alert_type.value if self.alert_type else 'None'})>"
