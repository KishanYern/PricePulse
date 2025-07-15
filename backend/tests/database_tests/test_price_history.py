from datetime import datetime
import uuid

from app.models import Product, PriceHistory

def test_create_price_history(test_db):
    """
    Test creating a new price history and verifying its attributes.
    """

    # Create a test product
    product = Product(
        name="Product for Price History Test 1",
        url=f"http://example.com/price_history_test_1-{uuid.uuid4()}",
        current_price=100.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    price_history_data = {
        "product_id": product_id,
        "price": 99.10,
        "source": "www.testpriceurl.com",
    }

    # Add the PriceHistory to the Database
    price_history = PriceHistory(**price_history_data)
    test_db.add(price_history)
    test_db.commit()
    test_db.refresh(price_history)

    # Check the values
    assert price_history.id is not None
    assert price_history.product_id == price_history_data["product_id"]
    assert price_history.price == price_history_data["price"]
    assert price_history.source == price_history_data["source"]

    # Check that the timestamp is the correct type
    assert isinstance(price_history.timestamp, datetime)

    # Check if the timestamps are valid (within 5 seconds of creating)
    assert datetime.now().timestamp() - price_history.timestamp.timestamp() < 5

def test_read_price_history(test_db):
    """
    Test reading an existing price history from the database.
    Using the same data from the first test case.
    """

    # Create a test product
    product = Product(
        name="Product for Price History Delete",
        url=f"http://example.com/price_history_test_2-{uuid.uuid4()}",
        current_price=300.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    price_history_data = {
        "product_id": product_id,
        "price": 99.10,
        "source": "www.testpriceurl.com",
    }

    # Add the PriceHistory to the Database
    price_history = PriceHistory(**price_history_data)
    test_db.add(price_history)
    test_db.commit()
    test_db.refresh(price_history)

    # Check the values
    retrieved_price_history = test_db.query(PriceHistory).filter(PriceHistory.id == price_history.id).first()
    assert retrieved_price_history is not None
    assert retrieved_price_history.product_id == price_history_data["product_id"]
    assert retrieved_price_history.price == price_history_data["price"]
    assert retrieved_price_history.source == price_history_data["source"]

def test_update_price_history(test_db):
    """
    Test updating an existing PriceHistory's attributes.
    """

    # Create a test product
    product = Product(
        name="Old Name",
        url=f"http://example.com/price_history_update-{uuid.uuid4()}",
        current_price=10.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    price_history_data = {
        "product_id": product_id,
        "price": 99.10,
        "source": "www.testpriceurl.com",
    }

    # Add the PriceHistory to the Database
    price_history = PriceHistory(**price_history_data)
    test_db.add(price_history)
    test_db.commit()
    test_db.refresh(price_history)

    # Changing the values
    new_price = 109.10
    new_source = "www.newtestpriceurl.com"
    price_history.price = new_price
    price_history.source = new_source

    # Update the database
    test_db.commit()
    test_db.refresh(price_history)

    # Check if the values were updated properly.
    updated_price_history = test_db.query(PriceHistory).filter(PriceHistory.id == price_history.id).first()
    assert updated_price_history.price == new_price
    assert updated_price_history.source == new_source

def test_delete_price_history(test_db):
    """
    Test deleting a price history from the database
    """

    # Create a test product
    product = Product(
        name="Old Name",
        url=f"http://example.com/price_history_delete-{uuid.uuid4()}",
        current_price=10.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    price_history_data = {
        "product_id": product_id,
        "price": 99.10,
        "source": "www.testpriceurl.com",
    }

    # Add the PriceHistory to the Database
    price_history = PriceHistory(**price_history_data)
    test_db.add(price_history)
    test_db.commit()
    test_db.refresh(price_history)

    price_history_id = price_history.id
    test_db.delete(price_history)
    test_db.commit()

    # Check if the item was deleted successfully
    deleted_price_history = test_db.query(PriceHistory).filter(PriceHistory.id == price_history_id).first()
    assert deleted_price_history is None

def test_nullable_fields(test_db):
    """
    Test that the "source" field can be NULL.
    """

    # Create a test product
    product = Product(
        name="Old Name",
        url="http://example.com/old_url",
        current_price=10.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    product_id = product.id

    price_history_data = {
        "product_id": product_id,
        "price": 99.10,
    }

    # Add the PriceHistory to the Database
    price_history = PriceHistory(**price_history_data)
    test_db.add(price_history)
    test_db.commit()
    test_db.refresh(price_history)

    assert price_history.source is None
