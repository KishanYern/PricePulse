from app.database import Base
from sqlalchemy import ForeignKey, String, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class PriceHistory(Base):
    __tablename__ = "price_histories"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        insert_default=func.now()
    )
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="price_history")

    def __repr__(self):
        return f"<PriceHistory(id={self.id}, product_id={self.product_id}, price={self.price})>"