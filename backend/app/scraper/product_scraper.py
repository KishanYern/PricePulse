from time import sleep
import logging
from bs4 import BeautifulSoup
import requests
import random
from typing import Optional, Dict, Any
import re
from app.config import IPROYAL_PROXY_USERNAME, IPROYAL_PROXY_PASSWORD

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

proxy = 'geo.iproyal.com:12321'
proxy_auth = f'{IPROYAL_PROXY_USERNAME}:{IPROYAL_PROXY_PASSWORD}'
proxy_dict = {
    "http": f"http://{proxy_auth}@{proxy}",
    "https": f"https://{proxy_auth}@{proxy}",
}

# A list of real-world User-Agent strings
user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/126.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/125.0.0.0'
]

def _parse_amazon(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    """Parses HTML soup from an Amazon product page."""
    try:
        # Get elements
        title_element = soup.select_one('#productTitle')
        price_whole_element = soup.select_one('span.a-price-whole')
        price_fraction_element = soup.select_one('span.a-price-fraction')
        image_element = soup.select_one('#landingImage')

        # Get Attributes if they exist
        title = title_element.get_text(strip=True) if title_element else None
        price_whole = price_whole_element.get_text(strip=True) if price_whole_element else None
        price_fraction = price_fraction_element.get_text(strip=True) if price_fraction_element else None
        image_url = image_element.get('data-old-hires') or image_element.get('src') if image_element else None

        return {
            "name": title,
            "current_price": float(f"{price_whole}{price_fraction}") if price_whole and price_fraction else None,
            "image_url": image_url,
        }
    except AttributeError:
        # This catches errors if any of the .get_text() or .get() calls fail on a None object
        logger.warning("Could not find all required Amazon elements. Page layout may have changed or it's a CAPTCHA.")
        return None

def _parse_ebay(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    """
    Parses HTML soup from an eBay product page using robust selectors and fallbacks.
    """
    # 1. Define the best selectors for each piece of data
    title_selectors = ['.x-item-title__mainTitle']
    price_selectors = ['[data-testid="x-price-primary"]', '.x-price-primary']
    image_selectors = ['.ux-image-carousel-item.active img']

    # Helper function to find text using a list of selectors
    def find_element_text(selectors):
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        return None

    # 2. Update the image helper to get the high-resolution URL
    def find_image_url(selectors):
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                # Prioritize the high-quality zoom image, then fall back to src
                return element.get('data-zoom-src') or element.get('src')
        return None

    try:
        title = find_element_text(title_selectors)
        price_text = find_element_text(price_selectors)
        image_url = find_image_url(image_selectors)

        # Proceed only if the essential data (title and price) is found
        if title and price_text:
            # 3. Robustly parse the price string to extract the number
            price_match = re.search(r'[\d,]+\.\d{2}', price_text)
            current_price = float(price_match.group().replace(',', '')) if price_match else None

            if current_price is not None:
                return {
                    "name": title,
                    "current_price": current_price,
                    "image_url": image_url,
                }
    except Exception as e:
        logger.error(f"An unexpected error occurred during eBay parsing: {e}")
        return None
    
    # If any of the required data was not found, return None
    logger.warning("Could not find all required eBay elements. Page layout may have changed.")
    return None

PARSERS = {
    "Amazon": _parse_amazon,
    "eBay": _parse_ebay
}

headers = {
        # Pick a random User-Agent for each request
        'User-Agent': random.choice(user_agents),
        
    }

def scrape_product_data(product_url: str, source: str, retries: int = 3, delay: float = 2.0) -> Optional[Dict[str, Any]]:
    """
    Optimized scraping function using requests for better performance.
    Using Rotating Proxies for IP rotation.
    """

    parser = PARSERS.get(source)
    if not parser:
        logger.error(f"No parser found for source: {source}")
        return None
    
    with requests.Session() as session:
        session.proxies = proxy_dict
        session.headers.update({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive'
        })

        for attempt in range(retries):
            try:
                session.headers['User-Agent'] = random.choice(user_agents)

                logger.info(f"Scraping {source} product at URL: {product_url} (Attempt {attempt + 1})")
                response = session.get(product_url, timeout=20)
                response.raise_for_status()  # Raise an error for bad responses

                soup = BeautifulSoup(response.text, 'lxml')

                # Detect CAPTCHA
                if "captcha" in soup.text.lower():
                    logger.warning("CAPTCHA detected. Retrying...")
                    # Wait longer if a CAPTCHA is detected
                    sleep(delay * 2 + random.uniform(0, 2))
                    continue

                scraped_data = parser(soup)

                if scraped_data and scraped_data.get("current_price") and scraped_data.get("name"):
                    logger.info(f"Successfully scraped data from {source}: {scraped_data}")
                    return scraped_data
                else:
                    logger.warning(f"Parser failed to extract required data on attempt {attempt + 1}.")
                    logger.debug(f"Scraped data (if any): {scraped_data}")
                
            except requests.HTTPError as http_err:
                logger.error(f"HTTP error occurred while scraping {source}: {http_err}")

            except requests.exceptions.RequestException as e:
                logger.error(f"Request error on attempt {attempt + 1} for {product_url}: {e}")
                
            # If this is not the last attempt, use exponential backoff with jitter
            if attempt < retries - 1:
                sleep_time = delay * (2 ** attempt) + random.uniform(0, 2)
                logger.info(f"Retrying in {sleep_time:.2f} seconds...")
                sleep(sleep_time)
    logger.error(f"Failed to scrape {source} product after {retries} attempts.")
    return None

if __name__ == '__main__':
    # Example usage
    url = 'https://www.ebay.com/itm/116650489031?_trkparms=amclksrc%3DITM%26aid%3D777008%26algo%3DPERSONAL.TOPIC%26ao%3D1%26asc%3D20240603120050%26meid%3D4d83aed08f8948748822f9e9a97d83ee%26pid%3D102175%26rk%3D1%26rkt%3D1%26itm%3D116650489031%26pmt%3D0%26noa%3D1%26pg%3D4375194%26algv%3DNoSignalMostSearched%26brand%3DNike&_trksid=p4375194.c102175.m166538&_trkparms=parentrq%3Ac07cab051980a671559126cdfff83a9a%7Cpageci%3A19646207-7cb1-11f0-a4ff-d209e4114610%7Ciid%3A1%7Cvlpname%3Avlp_homepage'
    data = scrape_product_data(url, "eBay")
    if data:
        print(f"Scraped data: {data}")
    else:
        print("Failed to scrape product data.")
