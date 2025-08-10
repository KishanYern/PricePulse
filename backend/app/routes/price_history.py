from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PriceHistory, Product, User, UserProduct
from app.auth import get_current_user
from app.schemas.price_history import ReturnSearchHistoryModel, NotificationFilter
from typing import Optional

router = APIRouter(
    prefix="/price-history",
    tags=["product_history"]
)

@router.get('/search-price-history', response_model=list[ReturnSearchHistoryModel])
def get_product_price_history(product_id: Optional[int | str],
                              name: Optional[str],
                              notifications: NotificationFilter,
                              user_filter: Optional[int] = None,
                              admin: Optional[bool] = None,
                              db: Session = Depends(get_db), 
                              current_user: User = Depends(get_current_user)):
    """
    Retrieve the price history of a product by the search parameters.
    """
    if product_id == '':
        product_id = None

    # Get the columns based on output model
    query = db.query(PriceHistory.id, 
                     User.email.label('user_email'),
                     Product.name, 
                     Product.id.label('product_id'), 
                     PriceHistory.price, 
                     PriceHistory.timestamp, 
                     PriceHistory.source, 
                     UserProduct.notify.label('notifications')).\
    join(Product, PriceHistory.product_id == Product.id).\
    join(UserProduct, UserProduct.product_id == Product.id).\
    join(User, User.id == UserProduct.user_id)

    # Common users will only be able to see their own price history
    if admin is not None and not admin:
        query = query.filter(UserProduct.user_id == current_user.id)
    else:
        # Admin users can see all price history if the user_filter is not passed in
        if user_filter is not None:
            query = query.filter(UserProduct.user_id == user_filter)

    if product_id is not None:
        query = query.filter(PriceHistory.product_id == product_id)
    if name:
        query = query.filter(Product.name.ilike(f"%{name}%"))
    if notifications is not NotificationFilter.all:
        query = query.filter(UserProduct.notify == (True if notifications == NotificationFilter.enabled else False))
    query = query.order_by(PriceHistory.timestamp.desc())  # Order by timestamp descending

    price_history = query.all()
    return price_history

@router.get('/', response_model=list[ReturnSearchHistoryModel])
def get_all_price_histories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve all price histories for products associated with the current user.
    """
    user_products = db.query(UserProduct).filter(UserProduct.user_id == current_user.id).all()
    if not user_products:
        return []

    product_ids = [up.product_id for up in user_products]
    all_price_histories = db.query(PriceHistory).filter(PriceHistory.product_id.in_(product_ids)).all()

    all_price_histories.sort(key = lambda x: x.timestamp, reverse=True)  # Sort by timestamp descending

    return all_price_histories