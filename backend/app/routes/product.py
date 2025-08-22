from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, PriceHistory, UserProduct, User
from app.schemas.product import ProductCreate, UserCreateProduct, ProductOut
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
async def _create_product_internal(product_data: ProductCreate, db: Session) -> Product | tuple[ProductStatus, Product] | ProductStatus:
    """
    Internal helper function to create a new product and its initial price history.
    Does not handle user association or HTTP exceptions directly.
    Returns:
        - Product if created successfully
        - (ProductStatus.PRODUCT_EXISTS, existing_product) if product exists
        - ProductStatus.PRODUCT_SCRAPER_FAILED if scraping fails
    """
    # Check if product with the same URL already exists
    existing_product = db.query(Product).filter(Product.url == str(product_data.url)).first()

    # If the product already exists, return the enum type exists and the product itself
    if existing_product:
        return (ProductStatus.PRODUCT_EXISTS, existing_product)

    # Call the web scraping function to get the product details
    scraped_data = await scrape_product_data(str(product_data.url), str(product_data.source))
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
        source=product_data.source,
        image_url=scraped_data["image_url"],
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
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve a product by the given product ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get the other data for this product
    user_product = db.query(UserProduct).filter(UserProduct.product_id == product_id, UserProduct.user_id == current_user.id).first()
    if not user_product:
        if current_user.admin:
            return ProductOut(
                id=product.id,
                url=product.url,
                name=product.name,
                currentPrice=product.current_price,
                lowestPrice=product.lowest_price,
                highestPrice=product.highest_price,
                notes=None,
                lowerThreshold=None,
                upperThreshold=None,
                notify=False,
                source=product.source,
                imageUrl=product.image_url,
                createdAt=product.created_at,
                lastChecked=product.last_checked
            )
        else:
            raise HTTPException(status_code=403, detail="You do not have permission to access this product")

    # Return the product with user-specific details
    return ProductOut(
        id=product.id,
        url=product.url,
        name=product.name,
        currentPrice=product.current_price,
        lowestPrice=product.lowest_price,
        highestPrice=product.highest_price,
        notes=user_product.notes,
        lowerThreshold=user_product.lower_threshold,
        upperThreshold=user_product.upper_threshold,
        notify=user_product.notify,
        source=product.source,
        imageUrl=product.image_url,
        createdAt=product.created_at,
        lastChecked=product.last_checked
    )

@router.get('/{user_id}/user-products', response_model=list[ProductOut])
def get_user_products(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve all products associated with a specific user by user ID.
    """

    # Ensure the user is authenticated and has permission to access this data
    if current_user.id != user_id and not current_user.admin:
        raise HTTPException(status_code=403, detail="You do not have permission to access this user's products")

    # If the user is an admin and is looking for all products, return all products
    if current_user.admin and user_id == 0:
        return db.query(Product).all()

    # If the user is not an admin, return only their products
    # Query to get all UserProduct entries for the given user_id
    user_products = db.query(UserProduct).filter(UserProduct.user_id == user_id).all()
    if not user_products:
        return []
    
    product_ids = [up.product_id for up in user_products]
    
    # Query to get all products associated with the product_ids
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()

    # Create a dictionary for O(1) lookups of user_products by product_id
    user_product_map = {up.product_id: up for up in user_products}

    output_products = []
    for product in products:
        user_product_entry = user_product_map.get(product.id)
        if user_product_entry:
            output_products.append(ProductOut(
                id=product.id,
                url=product.url,
                name=product.name,
                currentPrice=product.current_price,
                lowestPrice=product.lowest_price,
                highestPrice=product.highest_price,
                notes=user_product_entry.notes,
                lowerThreshold=user_product_entry.lower_threshold,
                upperThreshold=user_product_entry.upper_threshold,
                notify=user_product_entry.notify,
                source=product.source,
                imageUrl=product.image_url,
                createdAt=product.created_at,
                lastChecked=product.last_checked
            ))

    return output_products

@router.post('/create-product', status_code=status.HTTP_201_CREATED, response_model=ProductOut)
async def create_product(user_product_data: UserCreateProduct, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Create a new product associated with the authenticated user.
    """

    # Start a transaction to ensure atomicity
    # All database operations within this block will be committed or rolled back together.
    try:
        #Create the base Product and PriceHistory
        product_result = await _create_product_internal(user_product_data.product, db)
        print(product_result)

        # Return cases
        if isinstance(product_result, tuple) and product_result[0] is ProductStatus.PRODUCT_EXISTS:
            product = product_result[1]
        elif product_result is ProductStatus.PRODUCT_SCRAPER_FAILED:
            raise HTTPException(status_code=400, detail="Failed to scrape product data")
        elif isinstance(product_result, Product):
            product = product_result
        else:
            raise HTTPException(status_code=500, detail="Unexpected product creation result")

        # Associate the product with the user
        user_product_entry = UserProduct(
            user_id=current_user.id,
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
            notes=user_product_entry.notes,
            lowerThreshold=user_product_entry.lower_threshold,
            upperThreshold=user_product_entry.upper_threshold,
            notify=user_product_entry.notify,
            source=product.source,
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
async def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    """
    Update an existing product.

    The product details are refreshed by scraping the latest data from the provided URL.
    """
    existing_product = db.query(Product).filter(Product.id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing_product.url = str(product.url)

    # Call the web scraping function to update the product details
    scraped_data = await scrape_product_data(str(product.url), str(product.source))
    if not scraped_data:
        raise HTTPException(status_code=400, detail="Failed to retrieve updated product details")
    
    # Update the product attributes
    existing_product.name = scraped_data["name"]
    existing_product.current_price = scraped_data["current_price"]
    if existing_product.lowest_price is None or scraped_data["current_price"] < existing_product.lowest_price:
        existing_product.lowest_price = scraped_data["current_price"]
    if existing_product.highest_price is None or scraped_data["current_price"] > existing_product.highest_price:
        existing_product.highest_price = scraped_data["current_price"]
    existing_product.image_url = scraped_data["image_url"]
    existing_product.last_checked = datetime.now(timezone.utc)

    # Create a new entry in the price history
    price_history = PriceHistory(
        product_id=existing_product.id,
        price=scraped_data["current_price"],
        timestamp=datetime.now(timezone.utc),
    )

    db.add(price_history)
    db.merge(existing_product)
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
