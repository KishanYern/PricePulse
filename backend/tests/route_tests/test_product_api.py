import pytest
import uuid
from app.schemas.product import ProductCreate, ProductOut

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
    assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None
    
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
        assert validated_product.current_price is not None

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
    assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None

    # We did not insert these fields, so they should be None
    assert validated_product.lowest_price is None
    assert validated_product.highest_price is None

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
    assert duplicate_response.json() == {"detail": "Product with this URL already exists"}

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
    assert validated_product.current_price is not None
    assert validated_product.created_at is not None
    assert validated_product.last_checked is not None
    
    # We did not insert these fields, so they should be None
    assert validated_product.lowest_price is None
    assert validated_product.highest_price is None
    # Check if the product's last_checked field is updated
    assert updated_product['last_checked'] > created_product['last_checked']

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
    assert delete_response.json() == {"message": "Product deleted successfully"}

    # Attempt to retrieve the deleted product
    get_response = test_client.get(f'/products/{product_id}')
    assert get_response.status_code == 404
    assert get_response.json() == {"detail": "Product not found"}
