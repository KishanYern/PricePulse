from sqlalchemy.orm import Session
from app.database import get_session_local
from app.models import Product, PriceHistory
from app.scraper.product_scraper import scrape_product_data
from datetime import datetime, timezone
import logging # For debugging purposes
from app.models.products import EbayFailStatus 
from app.routes.notification_utils import notify_users_and_delete_product
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EBAY_FAIL_STATUSES = [EbayFailStatus.SOLD_OUT.value, EbayFailStatus.LISTING_ENDED.value]

async def process_product(db: Session, product: Product):
    """
    Handles scraping and database preparation for a single product.
    """
    scraped_data = await scrape_product_data(product.url, product.source)

    if not scraped_data:
        logger.warning(f"Failed to scrape data for product: {product.name} (ID: {product.id})")
        return

    # Handle unavailable eBay products
    if product.source == "eBay" and scraped_data['name'] in EBAY_FAIL_STATUSES:
        reason = "ended" if scraped_data['name'] == EbayFailStatus.LISTING_ENDED.value else "sold out"
        notify_users_and_delete_product(db, product, reason)
        return

    # --- Update Product Details in the Session ---
    product.name = scraped_data['name']
    product.current_price = scraped_data['current_price']
    if product.lowest_price is None or scraped_data['current_price'] < product.lowest_price:
        product.lowest_price = scraped_data['current_price']
    if product.highest_price is None or scraped_data['current_price'] > product.highest_price:
        product.highest_price = scraped_data['current_price']
    product.last_checked = datetime.now(timezone.utc)

    # Create a new PriceHistory record
    price_history = PriceHistory(product_id=product.id, price=product.current_price)
    db.add(price_history)
    logger.info(f"Successfully updated price for {product.name} to ${scraped_data['current_price']}.")

async def update_product_prices_job():
    """
    Asynchronously scrapes all products and updates their prices in the database.
    """
    logger.info("Starting async scheduled job to update product prices...")
    
    # We need a new session for this async job context
    db = get_session_local()()
    
    try:
        products_to_process = db.query(Product).all()
        if not products_to_process:
            logger.info("No products to update.")
            return

        # Create a list of concurrent tasks 
        tasks = [process_product(db, product) for product in products_to_process]

        # Run all scraping tasks concurrently
        await asyncio.gather(*tasks)

        # Commit all the changes made in the session at once
        db.commit()
        logger.info("Database commit successful.")

    except Exception as e:
        logger.error(f"An error occurred during the async job: {e}")
        db.rollback()
    finally:
        db.close()

    logger.info("Async scheduled job completed.")