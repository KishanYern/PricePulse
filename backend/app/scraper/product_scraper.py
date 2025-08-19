import logging
from bs4 import BeautifulSoup
import requests
import random
from typing import Optional, Dict, Any
from urllib.parse import urlparse

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

PARSERS = {
    "www.amazon.com": _parse_amazon
}

def scrape_product_data(product_url: str) -> Optional[Dict[str, Any]]:
    """
    Optimized scraping function using requests for better performance.
    Using Rotating Proxies for IP rotation.
    """

    headers = {
        # Pick a random User-Agent for each request
        'User-Agent': random.choice(user_agents),
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
    }

    # Find the appropriate parser for the product URL
    parser = PARSERS.get(urlparse(product_url).netloc)
    if not parser:
        logger.warning(f"No parser found for {product_url}")
        return None

    try:
        response = requests.get(product_url, timeout=15, proxies=proxy_dict, headers=headers)
        response.raise_for_status()

        # Create a BeautifulSoup object to parse the HTML
        soup = BeautifulSoup(response.text, 'lxml')
        scraped_data = parser(soup)

        if scraped_data:
            scraped_data['url'] = product_url
            logger.info(f"Successfully scraped data from {product_url}")
            return scraped_data
        else:
            return None
    except requests.RequestException as e:
        logger.error(f"Request error while scraping {product_url}: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return None
    

if __name__ == '__main__':
    # Example usage
    url = 'https://www.amazon.com/Acqua-Giorgio-Armani-Toilette-Ounces/dp/B000E7YK5K/?_encoding=UTF8&pd_rd_w=TdJT0&content-id=amzn1.sym.9071a05a-ab8a-4eb5-82ca-461a3b81eab8%3Aamzn1.symc.a68f4ca3-28dc-4388-a2cf-24672c480d8f&pf_rd_p=9071a05a-ab8a-4eb5-82ca-461a3b81eab8&pf_rd_r=HNJXDPDA7WT0GEHZCXPZ&pd_rd_wg=Q96GF&pd_rd_r=8b5f1bc1-dd27-4186-8225-b5bc649f372a&ref_=pd_hp_d_atf_ci_mcx_mr_ca_hp_atf_d&th=1'
    data = scrape_product_data(url)
    if data:
        print(f"Scraped data: {data}")
    else:
        print("Failed to scrape product data.")
