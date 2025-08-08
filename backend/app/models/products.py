from app.database import Base
from sqlalchemy import DateTime, String, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True) 
    url: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True, index=True) 
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    lowest_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    highest_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        insert_default=func.now()
    )
    last_checked: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        insert_default=func.now()
    )

    # Relationships
    # When a product is deleted, delete all of the price history related to that product.
    price_history = relationship(
        "PriceHistory",
        back_populates="product",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    # When a product is deleted, delete all the alerts related to that product.
    alerts = relationship(
        "Alert",
        back_populates="product",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    # When a product is deleted, delete all the user-product associations related to that product.
    user_products = relationship(
        "UserProduct",
        back_populates="product",
        cascade="all, delete, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', url='{self.url}')>"