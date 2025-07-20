from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product
from app.schemas.product import ProductCreate, ProductOut
from app.scraper.product_scraper import scrape_product_data
from datetime import datetime, timezone

# Create a router for product-related endpoints
router = APIRouter(
    prefix="/products",
    tags=["products"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[ProductOut])
def get_all_products(db: Session = Depends(get_db)):
    """
    Retrieve all products.
    """
    products = db.query(Product).all()
    return products

@router.get('/{product_id}', response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a product by the given product ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product.

    Product details are scraped from the provided URL before saving.
    """
    # Check if product with the same URL already exists
    existing_product = db.query(Product).filter(Product.url == product.url).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this URL already exists")
    
    # Call the web scraping function to get the product details
    scraped_data = scrape_product_data(str(product.url))
    if not scraped_data:
        raise HTTPException(status_code=400, detail="Failed to retrieve product details")

    # Create new product
    now = datetime.now(timezone.utc)
    new_product = Product(
        name=scraped_data["name"],
        url=scraped_data["url"],
        current_price=scraped_data["current_price"],
        lowest_price=scraped_data["lowest_price"],
        highest_price=scraped_data["highest_price"],
        created_at=now,
        last_checked=now
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put('/{product_id}', response_model=ProductOut)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    """
    Update an existing product.

    The product details are refreshed by scraping the latest data from the provided URL.
    """
    existing_product = db.query(Product).filter(Product.id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing_product.url = str(product.url)

    # Call the web scraping function to update the product details
    scraped_data = scrape_product_data(str(product.url))
    if not scraped_data:
        raise HTTPException(status_code=400, detail="Failed to retrieve updated product details")
    
    # Update the product attributes
    existing_product.name = scraped_data["name"]
    existing_product.current_price = scraped_data["current_price"]
    existing_product.lowest_price = scraped_data["lowest_price"]
    existing_product.highest_price = scraped_data["highest_price"]
    existing_product.last_checked = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing_product)
    return existing_product

@router.delete('/{product_id}', response_model=dict)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Delete a product by the given product ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
