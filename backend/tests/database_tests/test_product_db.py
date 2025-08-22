import pytest
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid

from app.models import Product, PriceHistory, Alert, UserProduct, User

def test_create_product(test_db):
    """
    Test creating a new product and verifying its attributes.
    """
    product_data = {
        "name": "Test Product 1",
        "url": f"http://example.com/product2-{uuid.uuid4()}",
        "current_price": 99.99,
        "lowest_price": 50.99,
        "highest_price": 99.99,
        "source": "Test"
    }

    product = Product(**product_data)
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    # Check the values
    assert product.id is not None
    assert product.name == product_data["name"]
    assert product.url == product_data["url"]
    assert product.current_price == product_data["current_price"]
    assert product.lowest_price == product_data["lowest_price"]
    assert product.highest_price == product_data["highest_price"]

    # Check the timestamps datatype
    assert isinstance(product.created_at, datetime)
    assert isinstance(product.last_checked, datetime)

    # Check if the timestamps are valid (within 5 seconds of creating)
    assert datetime.now().timestamp() - product.created_at.timestamp() < 5
    assert datetime.now().timestamp() - product.last_checked.timestamp() < 5

def test_read_product(test_db):
    """
    Test reading an existing product from the database.
    """
    product_data = {
        "name": "Test Product 2",
        "url": f"http://example.com/product2-{uuid.uuid4()}",
        "current_price": 150.00,
        "source": "Test"
    }
    product = Product(**product_data)
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    # Check the values
    retrieved_product = test_db.query(Product).filter(Product.id == product.id).first()
    assert retrieved_product is not None
    assert retrieved_product.name == product_data["name"]
    assert retrieved_product.url == product_data["url"]
    assert retrieved_product.current_price == product_data["current_price"]
    assert retrieved_product.lowest_price is None
    assert retrieved_product.highest_price is None

def test_update_product(test_db):
    """
    Test updating an existing product's attributes.
    """
    product = Product(
        name="Old Name",
        url=f"http://example.com/old_url-{uuid.uuid4()}",
        current_price=10.00,
        source="Test"
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    new_name = "New Name"
    new_price = 25.50
    product.name = new_name
    product.current_price = new_price
    test_db.commit()
    test_db.refresh(product)

    # Check if the values were updated properly
    updated_product = test_db.query(Product).filter(Product.id == product.id).first()
    assert updated_product.name == new_name
    assert updated_product.current_price == new_price

def test_delete_product(test_db):
    """
    Test deleting a product from the database.
    """
    product = Product(
        name="Product to Delete",
        url=f"http://example.com/to_delete-{uuid.uuid4()}",
        current_price=50.00,
        source="Test"
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id
    test_db.delete(product)
    test_db.commit()

    # Check if the item was deleted successfully
    deleted_product = test_db.query(Product).filter(Product.id == product_id).first()
    assert deleted_product is None

def test_unique_url_constraint(test_db):
    """
    Test that the 'url' field enforces a unique constraint.
    """

    base_url = f"http://example.com/shared_url_test-{uuid.uuid4()}"
    product1 = Product(
        name="Product A",
        url=base_url,
        current_price=100.00,
        source="Test"
    )
    test_db.add(product1)
    test_db.commit()
    test_db.refresh(product1)

    product2 = Product(
        name="Product B",
        url=base_url, # Duplicate URL
        current_price=200.00,
        source="Test"
    )
    test_db.add(product2)

    with pytest.raises(IntegrityError):
        test_db.commit()
    test_db.rollback() # Rollback the session after the failed commit

def test_nullable_fields(test_db):
    """
    Test that 'lowest_price' and 'highest_price' can be null.
    """
    product = Product(
        name="Product with Nulls",
        url=f"http://example.com/null_prices-{uuid.uuid4()}",
        current_price=75.00,
        source="Test"
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    assert product.lowest_price is None
    assert product.highest_price is None

def test_cascade_delete(test_db):
    """
    Test that deleting a Product cascades to delete associated PriceHistory, Alert, and UserProduct records.
    """
    # Create a product
    product = Product(
        name="Product for Cascade Test",
        url=f"http://example.com/cascade-{uuid.uuid4()}",
        current_price=100.00,
        source="Test"
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    # Create a user, as Alert and UserProduct depend on it
    user = User(email=f"test_user_{uuid.uuid4()}@example.com", password="hashedpassword")
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    user_id = user.id

    # Create associated records
    price_history = PriceHistory(product_id=product_id, price=99.00)
    alert = Alert(product_id=product_id, user_id=user_id, target_price=90.00)
    user_product = UserProduct(product_id=product_id, user_id=user_id, notify=True)

    test_db.add_all([price_history, alert, user_product])
    test_db.commit()
    test_db.refresh(price_history)
    test_db.refresh(alert)
    test_db.refresh(user_product)

    # Verify associated records exist
    assert test_db.query(PriceHistory).filter_by(product_id=product_id).count() == 1
    assert test_db.query(Alert).filter_by(product_id=product_id).count() == 1
    assert test_db.query(UserProduct).filter_by(product_id=product_id).count() == 1

    # Delete the product
    test_db.delete(product)
    test_db.commit()

    # Verify product is deleted
    assert test_db.query(Product).filter_by(id=product_id).first() is None

    # Verify associated records are also deleted due to cascade
    assert test_db.query(PriceHistory).filter_by(product_id=product_id).count() == 0
    assert test_db.query(Alert).filter_by(product_id=product_id).count() == 0
    assert test_db.query(UserProduct).filter_by(product_id=product_id).count() == 0

    # The user should still exist as Product does not have a relationship to delete the User
    assert test_db.query(User).filter_by(id=user_id).first() is not None

def test_default_timestamps(test_db):
    """
    Test that created_at and last_checked are automatically populated on creation.
    """
    product = Product(
        name="Timestamp Test",
        url=f"http://example.com/timestamps-{uuid.uuid4()}",
        current_price=123.45,
        source="Test"
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    assert product.created_at is not None
    assert product.last_checked is not None
    assert isinstance(product.created_at, datetime)
    assert isinstance(product.last_checked, datetime)
    # Check that they are very close to each other (within a second)
    assert abs((product.created_at - product.last_checked).total_seconds()) < 1

    # Simulate an update and check last_checked
    import time
    time.sleep(0.1) # Small delay to ensure last_checked changes if it were updated
    original_last_checked = product.last_checked
    product.current_price = 125.00
    product.last_checked = datetime.now()
    test_db.commit()
    test_db.refresh(product)
    
    # For this test, we confirm it's set on creation.
    assert product.created_at == original_last_checked # Confirm it's still the same as it's not designed to update on modify by default.
    assert product.last_checked != original_last_checked # Confirm change on last checked timestamp.
