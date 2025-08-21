import logging
from sqlalchemy.orm import Session
from app.models import Product, UserProduct, Notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def notify_users_and_delete_product(db: Session, product: Product, reason: str):
    """
    Notifies all users tracking a product that it's no longer available
    and then deletes the product from the database.

    Args:
        db (Session): The database session.
        product (Product): The product that is no longer available.
        reason (str): The reason the product is being removed (e.g., "listing ended", "sold out").
    """
    # Find all users who are tracking this product
    user_product_links = db.query(UserProduct).filter(UserProduct.product_id == product.id).all()
    
    if not user_product_links:
        logger.warning(f"No users found tracking product ID {product.id}. Deleting product without notification.")
    else:
        # Create a notification for each user
        for link in user_product_links:
            message = f"The eBay listing for '{product.name}' has been removed because it has {reason}."
            notification = Notification(
                user_id=link.user_id,
                message=message
            )
            db.add(notification)
            logger.info(f"Created notification for user {link.user_id} about product {product.id}.")

    # Once notifications are created, delete the product
    logger.info(f"Deleting product {product.id} ('{product.name}') from the database.")
    db.delete(product)
