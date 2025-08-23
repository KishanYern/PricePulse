import logging
from bs4 import BeautifulSoup
import httpx
import asyncio
import random
from typing import Optional, Dict, Any
import re
from app.config import IPROYAL_PROXY_USERNAME, IPROYAL_PROXY_PASSWORD

from app.models.products import EbayFailStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Proxy and Header Configuration ---
mounts = None
if IPROYAL_PROXY_USERNAME and IPROYAL_PROXY_USERNAME != "your_proxy_username":
    proxy_url = f"http://{IPROYAL_PROXY_USERNAME}:{IPROYAL_PROXY_PASSWORD}@geo.iproyal.com:12321"
    # Using 'mounts' is a robust way to configure transports for specific domains.
    # Here, we're routing all HTTP and HTTPS traffic through our proxy.
    mounts = {
        "http://": httpx.AsyncHTTPTransport(proxy=proxy_url),
        "https://": httpx.AsyncHTTPTransport(proxy=proxy_url),
    }

HEADERS_LIST = [
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1' # Do Not Track Request Header
    },
    {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/126.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    },
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/125.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
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

        current_price = None
        if price_whole and price_fraction:
            price_whole_cleaned = price_whole.replace(',', '')
            current_price = float(f"{price_whole_cleaned}{price_fraction}")

        return {
            "name": title,
            "current_price": current_price,
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
    # Check if the product is sold out or the listing has ended
    availability_element = soup.select_one('.d-quantity__availability-text')
    if availability_element and ('sold' in availability_element.text.lower() or 'out of stock' in availability_element.text.lower()):
        logger.warning("eBay product is sold out.")
        return {"name": EbayFailStatus.SOLD_OUT.value, "current_price": 0.0, "image_url": None}

    ended_listing_element = soup.select_one('#ended_msg')
    if ended_listing_element and 'this listing has ended' in ended_listing_element.text.lower():
        logger.warning("eBay listing has ended.")
        return {"name": EbayFailStatus.LISTING_ENDED.value, "current_price": 0.0, "image_url": None}

    # Define selectors for each piece of data
    title_selectors = ['.x-item-title__mainTitle', 'h1.d-item-title']
    price_selectors = ['[data-testid="x-price-primary"] .ux-textspans', '.x-price-primary .ux-textspans']
    image_selectors = ['.ux-image-carousel-item.active img', '#vi-img-main-img']

    def find_element_text(selectors):
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        return None

    def find_image_url(selectors):
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get('data-zoom-src') or element.get('src')
        return None

    try:
        title = find_element_text(title_selectors)
        price_text = find_element_text(price_selectors)
        image_url = find_image_url(image_selectors)

        if not title or not price_text:
            logger.warning("Could not find all required eBay elements (title/price).")
            return None

        price_match = re.search(r'[\d,]+\.\d{2}', price_text)
        current_price = float(price_match.group().replace(',', '')) if price_match else None
        
        if current_price is None:
            logger.warning(f"Could not parse price from string: '{price_text}'")
            return None

        return {
            "name": title,
            "current_price": current_price,
            "image_url": image_url,
        }
    except Exception as e:
        logger.error(f"An unexpected error occurred during eBay parsing: {e}")
        return None

PARSERS = {
    "Amazon": _parse_amazon,
    "eBay": _parse_ebay
}

async def scrape_product_data(product_url: str, source: str, retries: int = 3, delay: float = 2.0) -> Optional[Dict[str, Any]]:
    """
    Optimized scraping function using httpx for better performance.
    Using Rotating Proxies for IP rotation.
    """

    parser = PARSERS.get(source)
    if not parser:
        logger.error(f"No parser found for source: {source}")
        return None
    
    timeout = httpx.Timeout(20.0, read=25.0, connect=10.0)

    async with httpx.AsyncClient(mounts=mounts, timeout=timeout) as client:
        for attempt in range(retries):
            try:
                headers = random.choice(HEADERS_LIST)
                response = await client.get(product_url, headers=headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'lxml')
                
                if "captcha" in soup.text.lower():
                    logger.warning(f"CAPTCHA on attempt {attempt + 1} for {product_url}")
                    await asyncio.sleep(delay * 2 + random.uniform(0, 2))
                    continue

                scraped_data = parser(soup)
                if scraped_data and scraped_data.get("name") and scraped_data.get("current_price") is not None:
                    scraped_data['url'] = product_url
                    return scraped_data
                else:
                    logger.warning(f"Parser failed on attempt {attempt + 1} for {product_url}.")

            except httpx.RequestError as e:
                logger.error(f"Request error on attempt {attempt + 1} for {product_url}: {e}")
            
            if attempt < retries - 1:
                wait_time = delay * (2 ** attempt) + random.uniform(0, 1)
                await asyncio.sleep(wait_time)
                
    logger.error(f"Failed to scrape {product_url} after {retries} attempts.")
    return None

async def main():
    """Main function to run the scraper for demonstration."""
    # Example usage:
    # The client is no longer passed as an argument. The function handles it internally.
    url = 'https://www.ebay.com/itm/116650489031?_trkparms=amclksrc%3DITM%26aid%3D777008%26algo%3DPERSONAL.TOPIC%26ao%3D1%26asc%3D20240603120050%26meid%3D4d83aed08f8948748822f9e9a97d83ee%26pid%3D102175%26rk%3D1%26rkt%3D1%26itm%3D116650489031%26pmt%3D0%26noa%3D1%26pg%3D4375194%26algv%3DNoSignalMostSearched%26brand%3DNike&_trksid=p4375194.c102175.m166538&_trkparms=parentrq%3Ac07cab051980a671559126cdfff83a9a%7Cpageci%3A19646207-7cb1-11f0-a4ff-d209e4114610%7Ciid%3A1%7Cvlpname%3Avlp_homepage'
    data = await scrape_product_data(url, "eBay")
    if data:
        print(f"Scraped data: {data}")
    else:
        print("Failed to scrape product data.")

if __name__ == '__main__':
    # Run the main asynchronous function
    asyncio.run(main())
