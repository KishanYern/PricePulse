from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, PriceHistory, UserProduct, User
from app.schemas.product import ProductCreate, UserCreateProduct, ProductOut
from app.schemas.price_history import PriceHistoryOut
from app.scraper.product_scraper import scrape_product_data
from app.auth import get_current_user
from datetime import datetime, timezone
from enum import Enum

# Create Enum for product status
class ProductStatus(str, Enum):
    PRODUCT_EXISTS = "Product already exists"
    PRODUCT_SCRAPER_FAILED = "Failed to scrape product data"

# Create a router for product-related endpoints
router = APIRouter(
    prefix="/products",
    tags=["products"],
)

# Helper function to create a product
def _create_product_internal(product_data: ProductCreate, db: Session) -> Product | ProductStatus:
    """
    Internal helper function to create a new product and its initial price history.
    Does not handle user association or HTTP exceptions directly.
    """
    # Check if product with the same URL already exists
    existing_product = db.query(Product).filter(Product.url == str(product_data.url)).first()
    if existing_product:
        return ProductStatus.PRODUCT_EXISTS

    # Call the web scraping function to get the product details
    scraped_data = scrape_product_data(str(product_data.url))
    if not scraped_data:
        return ProductStatus.PRODUCT_SCRAPER_FAILED

    # Create new product
    now = datetime.now(timezone.utc)
    new_product = Product(
        name=scraped_data["name"],
        url=scraped_data["url"],
        current_price=scraped_data["current_price"],
        lowest_price=scraped_data["current_price"],
        highest_price=scraped_data["current_price"],
        created_at=now,
        last_checked=now
    )

    db.add(new_product)
    db.flush() # Use flush to get the new_product.id before committing

    # Add the new product's price history
    price_history = PriceHistory(
        product_id=new_product.id,
        price=scraped_data["current_price"],
        timestamp=now,
        source=product_data.source if product_data.source else None
    )

    db.add(price_history)

    return new_product

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

@router.get('/{user_id}/user-products', response_model=list[ProductOut])
def get_user_products(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve all products associated with a specific user by user ID.
    """

    # Ensure the user is authenticated and has permission to access this data
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this user's products")
    
    # Query to get all UserProduct entries for the given user_id
    user_products = db.query(UserProduct).filter(UserProduct.user_id == user_id).all()
    if not user_products:
        raise HTTPException(status_code=404, detail="No products found for this user")

    product_ids = [up.product_id for up in user_products]
    
    # Extract product IDs from UserProduct entries
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found for this user")
    return products

@router.post('/create-product', status_code=status.HTTP_201_CREATED, response_model=ProductOut)
def create_product(user_product_data: UserCreateProduct, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Create a new product associated with the authenticated user.
    """
    # Use the current_user's ID, not the one from the request body
    print(f"Current user ID: {current_user.id}")
    user_id_to_associate = current_user.id

    # Start a transaction to ensure atomicity
    # All database operations within this block will be committed or rolled back together.
    try:
        #Create the base Product and PriceHistory
        product = _create_product_internal(user_product_data.product, db)

        if product is ProductStatus.PRODUCT_EXISTS:
            raise HTTPException(status_code=400, detail="Product already exists")
        elif product is ProductStatus.PRODUCT_SCRAPER_FAILED:
            raise HTTPException(status_code=400, detail="Failed to scrape product data")

        # Associate the product with the user
        user_product_entry = UserProduct(
            user_id=user_id_to_associate,
            product_id=product.id,
            notes=user_product_data.notes,
            notify=user_product_data.notify,
            lower_threshold=user_product_data.lower_threshold,
            upper_threshold=user_product_data.upper_threshold
        )
        db.add(user_product_entry)

        # Commit all changes at once
        db.commit()

        # Refresh the objects to get any updated fields (e.g., auto-generated IDs for UserProduct)
        db.refresh(product)
        db.refresh(user_product_entry)

        # Return a response model that includes user-specific product details
        return ProductOut(
            id=product.id,
            url=product.url,
            name=product.name,
            currentPrice=product.current_price,
            lowestPrice=product.lowest_price,
            highestPrice=product.highest_price,
            createdAt=product.created_at,
            lastChecked=product.last_checked,
        )
    
    except HTTPException:
        # Re-raise HTTPExceptions from previous checks
        db.rollback() # Rollback if an HTTPException occurred before commit
        raise
    except Exception as e:
        # Catch any other unexpected errors and rollback
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


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
    if existing_product.lowest_price is None or scraped_data["current_price"] < existing_product.lowest_price:
        existing_product.lowest_price = scraped_data["current_price"]
    if existing_product.highest_price is None or scraped_data["current_price"] > existing_product.highest_price:
        existing_product.highest_price = scraped_data["current_price"]
    existing_product.last_checked = datetime.now(timezone.utc)

    # Create a new entry in the price history
    price_history = PriceHistory(
        product_id=existing_product.id,
        price=scraped_data["current_price"],
        timestamp=datetime.now(timezone.utc),
        source=product.source if product.source else None
    )

    db.add(price_history)
    db.merge(existing_product)
    db.commit()
    db.refresh(existing_product)
    return existing_product

@router.get('/{product_id}/price-history', response_model=list[PriceHistoryOut])
def get_product_price_history(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve the price history of a product by the given product ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    price_history = db.query(PriceHistory).filter(PriceHistory.product_id == product_id).all()
    return price_history

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
