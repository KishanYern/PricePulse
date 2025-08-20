from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, PriceHistory
from app.scraper.product_scraper import scrape_product_data
from datetime import datetime, timezone
import logging # For debugging purposes 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_product_prices_job():
    """
    Scheduled task to scrape and update the price for every tracked product.
    We will also create a new Price history record for each of the updated products.
    We will email the user with the updated price information if they have notifications enabled for that product and the price passes a lower/upper threshold.
    """
    logger.info("Starting scheduled job to update product prices...")

    # Get a new database session
    db = next(get_db())

    try:
        # Process products in batches to avoid loading all into memory at once
        batch_size = 100
        products_iterator = db.query(Product).yield_per(batch_size)
        for product in products_iterator:
            logger.info(f"Processing product: {product.name} (ID: {product.id}) at URL: {product.url}")
            scraped_data = scrape_product_data(product.url, product.source)

            if scraped_data:
                # Update the product details
                print(product)
                product.name = scraped_data['name']
                product.current_price = scraped_data['current_price']

                if product.lowest_price is None or scraped_data['current_price'] < product.lowest_price:
                    product.lowest_price = scraped_data['current_price']
                if product.highest_price is None or scraped_data['current_price'] > product.highest_price:
                    product.highest_price = scraped_data['current_price']
                
                product.last_updated = datetime.now(timezone.utc)

                # Create a new PriceHistory record
                price_history = PriceHistory(
                    product_id=product.id,
                    price=product.current_price,
                )
                db.add(price_history)
                logger.info(f"Successfully updated price for {product.name} to ${scraped_data['current_price']}.")
            else:
                logger.warning(f"Failed to scrape data for product: {product.name} (ID: {product.id})")

        db.commit()
    except Exception as e:
        logger.error(f"Error occurred while updating product prices: {e}")
        db.rollback()
    finally:
        db.close()

    logger.info("Scheduled job to update product prices completed.")