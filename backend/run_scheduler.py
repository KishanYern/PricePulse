import asyncio
from app.scheduler.products import update_product_prices_job
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Starting the standalone scheduler job...")
    try:
        asyncio.run(update_product_prices_job())
        logger.info("Standalone scheduler job finished successfully.")
    except Exception as e:
        logger.error(f"An error occurred during the scheduler job: {e}")

