# Web scrape given a product URL and return product details.
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException
from typing import Optional, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def scrape_product_data(product_url: str) -> Optional[Dict[str, Any]]:
    """
    Optimized Selenium scraping with better error handling and performance.
    """
    options = webdriver.ChromeOptions()
    
    # Performance optimizations
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-extensions')
    options.add_argument('--disable-plugins')
    options.add_argument('--disable-css') # Don't load CSS
    options.add_argument('--disable-javascript') # Don't load JavaScript
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=ChromeNotifications')
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--disable-background-timer-throttling')
    options.add_argument('--disable-backgrounding-occluded-windows')
    options.add_argument('--disable-renderer-backgrounding')
    options.add_argument('--disable-field-trial-config')
    options.add_argument('--disable-client-side-phishing-detection')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')  # Suppress all logs except errors
    options.add_argument('--silent') 

    # Disable all graphics/GPU features
    options.add_argument('--disable-webgl')
    options.add_argument('--disable-webgl2')
    options.add_argument('--disable-3d-apis')
    options.add_argument('--use-gl=swiftshader')
    
    # Memory optimizations
    options.add_argument('--memory-pressure-off')
    options.add_argument('--max_old_space_size=4096')
    
    # Network optimizations
    options.add_argument('--aggressive-cache-discard')
    options.add_argument('--disable-background-networking')
    
    # Faster page load strategy
    options.page_load_strategy = 'eager'  # Only load the DOM, not all resources
    
    # Set user agent to avoid bot detection
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = None
    try:
        # Initialize driver with shorter timeouts
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(8)  # Set shorter page load timeout
        driver.implicitly_wait(3)  # Set implicit wait for elements
        
        logger.info(f"Starting to scrape: {product_url}")
        driver.get(product_url)
        
        # Wait for the title element with shorter timeout
        wait = WebDriverWait(driver, 5)
        
        # Try multiple possible selectors for product title
        logger.info("Attempting to scrape product title...")
        title_selectors = [
            (By.ID, "productTitle"),
            (By.ID, "title"),
            (By.ID, "titleSection"),
            (By.CSS_SELECTOR, "h1[data-automation-id='product-title']"),
            (By.CSS_SELECTOR, "h1.product-title"),
            (By.CSS_SELECTOR, ".product-title"),
            (By.CSS_SELECTOR, "[data-testid='product-title']")
        ]
        
        product_title = None
        for selector_type, selector_value in title_selectors:
            try:
                title_element = wait.until(
                    EC.presence_of_element_located((selector_type, selector_value))
                )
                product_title = title_element.text.strip()
                if product_title:  # If we found a non-empty title, break
                    logger.info(f"Found title using selector: {selector_type}={selector_value}")
                    break
            except TimeoutException:
                continue
        
        if not product_title:
            logger.warning(f"Could not find product title for {product_url}")
            return None

        # Try to extract price: Whole and fraction prices
        logger.info("Attempting to scrape product price...")
        current_price_whole = None
        current_price_fraction = None
        price_selectors_whole = [
            (By.CSS_SELECTOR, ".a-price-whole"),
            (By.CSS_SELECTOR, ".price"),
            (By.CSS_SELECTOR, "[data-testid='price']"),
            (By.CSS_SELECTOR, ".product-price"),
        ]

        price_selectors_fraction = [
            (By.CSS_SELECTOR, ".a-price-fraction"),
            (By.CSS_SELECTOR, ".fraction"),
            (By.CSS_SELECTOR, "[data-testid='fraction']"),
            (By.CSS_SELECTOR, ".product-price-fraction"),
        ]
        
        for selector_type, selector_value in price_selectors_whole:
            try:
                price_element = driver.find_element(selector_type, selector_value)
                price_text = price_element.text.strip()
                # Basic price extraction
                import re
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace('$', '').replace(',', ''))
                if price_match:
                    current_price_whole = float(price_match.group())
                    logger.info(f"Found whole price using selector: {selector_type}={selector_value}")
                    logger.info(f"Found whole price: ${current_price_whole}")
                    break
            except Exception:
                continue

        for selector_type, selector_value in price_selectors_fraction:
            try:
                fraction_element = driver.find_element(selector_type, selector_value)
                fraction_text = fraction_element.text.strip()
                # Basic price extraction
                import re
                fraction_match = re.search(r'[\d,]+\.?\d*', fraction_text.replace('$', '').replace(',', ''))
                if fraction_match:
                    current_price_fraction = float(fraction_match.group())
                    logger.info(f"Found fraction price using selector: {selector_type}={selector_value}")
                    logger.info(f"Found fraction price: ${current_price_fraction / 100}")
                    break
            except Exception:
                continue
        
        # Trying to scrape the product image url
        logger.info("Attempting to scrape product image URL...")
        image_selectors = [
            (By.CSS_SELECTOR, "#a-dynamic-image"),
            (By.CSS_SELECTOR, ".a-dynamic-image"),
            (By.CSS_SELECTOR, "#product-image"),
            (By.CSS_SELECTOR, "#landingImage"),
            (By.CSS_SELECTOR, ".product-image"),
            (By.CSS_SELECTOR, "[data-testid='product-image']"),
        ]

        product_image_url = None
        for selector_type, selector_value in image_selectors:
            try:
                image_element = wait.until(
                    EC.presence_of_element_located((selector_type, selector_value))
                )
                product_image_url = image_element.get_attribute("src")
                if product_image_url:
                    logger.info(f"Found image URL using selector: {selector_type}={selector_value}")
                    logger.info(f"Product image URL: {product_image_url}")
                    break
            except TimeoutException:
                continue
        logger.info(f"Successfully scraped: {product_title[:50]}...")

        if current_price_whole is None:
            logger.warning(f"Could not find current whole price for {product_url}")
            return None
        
        # If fraction price is not found, use whole price
        if current_price_fraction is None:
            logger.warning(f"Could not find current fraction price for {product_url}")
            current_price = current_price_whole
        else:
            current_price = current_price_whole + (current_price_fraction / 100)

        # Make the product title more readable if over 255 characters
        if len(product_title) > 255:
            product_title = product_title[:255] + "..."

        # Return the scraped data
        return {
            "name": product_title,
            "url": product_url,
            "image_url": product_image_url,
            "current_price": current_price,
        }
        
    except TimeoutException:
        logger.error(f"Timeout while scraping {product_url}")
        return None
    except WebDriverException as e:
        logger.error(f"WebDriver error scraping {product_url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error scraping {product_url}: {e}")
        return None
        
    finally:
        if driver:
            try:
                driver.quit()
            except Exception as e:
                logger.error(f"Error closing driver: {e}")

if __name__ == "__main__":
    # Example usage
    url = input("Enter product URL to scrape: ")
    product_data = scrape_product_data(url)
    if product_data:
        print("Scraped product data:", product_data['name'], product_data['current_price'])
    else:
        print("Failed to scrape product data.")