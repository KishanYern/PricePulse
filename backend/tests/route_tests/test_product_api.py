# Current price check will be implemented when the scraping function is ready

import pytest
import uuid
from app.schemas.product import ProductOut

def test_create_product(test_client):
    """
    Test the create_product endpoints.
    """
    product_data = {
        "url": f"https://example.com/product_{uuid.uuid4()}",
        "source": "Example Source"
    }

    response = test_client.post('/products/create', json=product_data)
    assert response.status_code == 201

    product = response.json()
    validated_product = ProductOut(**product)
    assert isinstance(validated_product, ProductOut)
    assert validated_product.id is not None
    assert str(validated_product.url) == product_data["url"]
    assert validated_product.name is not None
    #assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None

    # We did not insert these fields, so they should be None.
    #assert validated_product.lowest_price is None
    #assert validated_product.highest_price is None

    # Check if the product's price history is created
    price_history_response = test_client.get(f'/products/{validated_product.id}/price-history')
    assert price_history_response.status_code == 200
    price_history = price_history_response.json()
    assert isinstance(price_history, list)
    assert len(price_history) > 0
    for entry in price_history:
        assert "id" in entry and entry["id"] is not None
        assert "product_id" in entry and entry["product_id"] == validated_product.id
        assert "price" in entry and isinstance(entry["price"], float)
        assert "timestamp" in entry and isinstance(entry["timestamp"], str)
        assert "source" in entry and (entry["source"] is None or isinstance(entry["source"], str))

def test_get_all_products(test_client):
    """
    Test the get_all_products endpoint.
    """
    response = test_client.get('/products/')
    assert response.status_code == 200

    products = response.json()
    assert isinstance(products, list)
    for product in products:
        validated_product = ProductOut(**product)
        assert isinstance(validated_product, ProductOut)
        assert validated_product.id is not None
        assert validated_product.url is not None
        assert validated_product.name is not None
        #assert validated_product.current_price is not None

def test_get_product(test_client):
    """
    Test the get_product endpoint.
    """
    product_data = {
        "url": f"https://example.com/product_{uuid.uuid4()}",
        "source": "Example Source"
    }

    # First we create a product
    create_response = test_client.post('/products/create', json=product_data)
    assert create_response.status_code == 201
    created_product = create_response.json()
    product_id = created_product['id']

    # Now we retrieve the product by ID
    get_response = test_client.get(f'/products/{product_id}')
    assert get_response.status_code == 200
    product = get_response.json()

    validated_product = ProductOut(**product)
    assert isinstance(validated_product, ProductOut)
    assert validated_product.id == product_id
    assert str(validated_product.url) == product_data["url"]
    assert validated_product.name is not None
    #assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None

    # We did not insert these fields, so they should be None.
    # lowest_price and highest_price are only set if price history tracking is implemented,
    # so after creation or update, they should remain None.
    #assert validated_product.lowest_price is None
    #assert validated_product.highest_price is None

def test_create_product_duplicate(test_client):
    """
    Test creating a product with a duplicate URL.
    """
    product_data = {
        "url": f"https://example.com/product_{uuid.uuid4()}",
        "source": "Example Source"
    }

    # Create the first product
    create_response = test_client.post('/products/create', json=product_data)
    assert create_response.status_code == 201

    # Attempt to create a second product with the same URL
    duplicate_response = test_client.post('/products/create', json=product_data)
    assert duplicate_response.status_code == 400
    assert duplicate_response.status_code == 400
    assert "Product with this URL already exists" in duplicate_response.json().get("detail", "")

def test_update_product(test_client):
    """
    Test the update_product endpoint.
    """
    product_data = {
        "url": f"https://example.com/product_{uuid.uuid4()}",
        "source": "Example Source"
    }

    # First we create a product
    create_response = test_client.post('/products/create', json=product_data)
    assert create_response.status_code == 201
    created_product = create_response.json()
    product_id = created_product['id']

    # Now we update the product
    updated_data = {
        "url": f"https://example.com/updated_product_{uuid.uuid4()}",
        "source": "Updated Source"
    }
    
    update_response = test_client.put(f'/products/{product_id}', json=updated_data)
    assert update_response.status_code == 200

    updated_product = update_response.json()
    validated_product = ProductOut(**updated_product)
    assert isinstance(validated_product, ProductOut)
    assert validated_product.id == product_id
    assert str(validated_product.url) == updated_data["url"]
    assert validated_product.name is not None
    #assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None
    
    # We did not insert these fields, so they should be None
    #assert validated_product.lowest_price is None
    #assert validated_product.highest_price is None

    # Check if the product's last_checked field is updated
    from datetime import datetime
    updated_last_checked = datetime.fromisoformat(updated_product['last_checked'])
    created_last_checked = datetime.fromisoformat(created_product['last_checked'])
    assert updated_last_checked > created_last_checked

    # Check if the new price history entry is created
    price_history_response = test_client.get(f'/products/{product_id}/price-history')
    assert price_history_response.status_code == 200
    price_history = price_history_response.json()
    newest_entry = price_history[-1] 
    assert newest_entry['product_id'] == product_id
    assert newest_entry['price'] == updated_data.get('current_price', created_product['current_price'])
    assert newest_entry['timestamp'] is not None
    assert newest_entry.get('source') == updated_data["source"]

def test_delete_product(test_client):
    """
    Test the delete_product endpoint.
    First we create a product, then delete that product by ID.
    """
    product_data = {
        "url": f"https://example.com/product_{uuid.uuid4()}",
        "source": "Example Source"
    }

    # Create a product
    create_response = test_client.post('/products/create', json=product_data)
    assert create_response.status_code == 201
    created_product = create_response.json()
    product_id = created_product['id']

    # Delete the product
    delete_response = test_client.delete(f'/products/{product_id}')
    assert delete_response.status_code == 200
    assert "deleted" in delete_response.json().get("message", "").lower()
    assert delete_response.json() == {"message": "Product deleted successfully"}

    # Attempt to retrieve the deleted product
    get_response = test_client.get(f'/products/{product_id}')
    assert get_response.status_code == 404
    assert get_response.json() == {"detail": "Product not found"}

    # Check if the product price history is also deleted
    price_history_response = test_client.get(f'/products/{product_id}/price-history')
    assert price_history_response.status_code == 404
