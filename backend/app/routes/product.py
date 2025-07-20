from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product
from app.schemas.product import ProductCreate, ProductOut
from app.scraper.product_scraper import scrape_product_data

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
    new_product = Product(
        name=scraped_data["name"],
        url=scraped_data["url"],
        current_price=scraped_data["current_price"],
        lowest_price=scraped_data["lowest_price"],
        highest_price=scraped_data["highest_price"]
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product