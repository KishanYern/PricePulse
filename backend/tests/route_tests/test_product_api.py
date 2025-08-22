import pytest
import uuid
from app.schemas.product import ProductOut
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient

@pytest.fixture
def mock_scraper(mocker):
    """Fixture to mock the product scraper dynamically."""
    async def mock_scrape_func(url, source):
        return {
            "name": "Mocked Product Name",
            "url": url,
            "current_price": 123.45,
            "image_url": "https://mocked.com/image.png"
        }

    return mocker.patch(
        "app.routes.product.scrape_product_data",
        side_effect=mock_scrape_func
    )

def test_create_product(authenticated_client, mock_scraper):
    """
    Test the create_product endpoint with an authenticated user.
    """
    url_to_create = f"https://example.com/product_{uuid.uuid4()}"
    product_data = {
        "product": {
            "url": url_to_create,
            "source": "Test"
        },
        "notes": "These are test notes.",
        "lower_threshold": 100.0,
        "upper_threshold": 200.0,
        "notify": True
    }

    response = authenticated_client.post('/products/create-product', json=product_data)
    assert response.status_code == 201, response.text

    product = response.json()
    validated_product = ProductOut(**product)

    assert validated_product.id is not None
    assert str(validated_product.url) == url_to_create
    assert validated_product.current_price == 123.45
    assert validated_product.notes == product_data["notes"]
    assert validated_product.lower_threshold == product_data["lower_threshold"]
    assert validated_product.upper_threshold == product_data["upper_threshold"]
    assert validated_product.notify is True
    assert validated_product.source == product_data["product"]["source"]
    assert str(validated_product.image_url) == "https://mocked.com/image.png"

def test_get_user_products(authenticated_client, mock_scraper):
    """
    Test the get_user_products endpoint.
    """
    product_data = {"product": {"url": f"https://example.com/product_{uuid.uuid4()}", "source": "Test"}}
    create_response = authenticated_client.post('/products/create-product', json=product_data)
    assert create_response.status_code == 201

    me_response = authenticated_client.get("/users/me")
    assert me_response.status_code == 200
    user_id = me_response.json()['id']

    response = authenticated_client.get(f'/products/{user_id}/user-products')
    assert response.status_code == 200

    products = response.json()
    assert isinstance(products, list)
    assert len(products) >= 1
    for product in products:
        ProductOut(**product)

def test_get_product(authenticated_client, mock_scraper):
    """
    Test the get_product endpoint for a product associated with the user.
    """
    product_data = {"product": {"url": f"https://example.com/product_{uuid.uuid4()}", "source": "Test"}}
    create_response = authenticated_client.post('/products/create-product', json=product_data)
    created_product_id = create_response.json()['id']

    get_response = authenticated_client.get(f'/products/{created_product_id}')
    assert get_response.status_code == 200

    product = get_response.json()
    validated_product = ProductOut(**product)
    assert validated_product.id == created_product_id
    assert validated_product.name == "Mocked Product Name"

def test_create_product_duplicate_url_associates_existing_product(authenticated_client, mock_scraper, test_client: TestClient):
    """
    Test that creating a product with a duplicate URL with a different user
    associates the existing product with the new user.
    """
    shared_url = f"https://example.com/shared_product_{uuid.uuid4()}"

    product_data_1 = {"product": {"url": shared_url, "source": "Test"}}
    response1 = authenticated_client.post('/products/create-product', json=product_data_1)
    assert response1.status_code == 201
    product1_id = response1.json()['id']

    email = f"testuser2_{uuid.uuid4()}@example.com"
    password = "testpassword2"
    user_data = {"email": email, "password": password}

    create_user_response = test_client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 201
    token = create_user_response.json()["access_token"]

    test_client.headers["Authorization"] = f"Bearer {token}"

    product_data_2 = {"product": {"url": shared_url, "source": "Test"}, "notes": "Second user's notes"}
    response2 = test_client.post('/products/create-product', json=product_data_2)
    assert response2.status_code == 201, response2.text
    product2_id = response2.json()['id']

    assert product1_id == product2_id
    assert response2.json()['notes'] == "Second user's notes"

    test_client.headers.pop("Authorization", None)


def test_update_product(authenticated_client, mocker):
    """
    Test the update_product endpoint.
    """
    url_to_create = f"https://example.com/product_{uuid.uuid4()}"

    create_scraped_data = {
        "name": "Original Name", "url": url_to_create, "current_price": 123.45,
        "image_url": "https://mocked.com/image.png"
    }
    update_scraped_data = {
        "name": "Updated Product Name", "url": url_to_create, "current_price": 42.42,
        "image_url": "https://mocked.com/updated-image.png"
    }

    mocker.patch(
        "app.routes.product.scrape_product_data",
        side_effect=[create_scraped_data, update_scraped_data]
    )

    product_data = {"product": {"url": url_to_create, "source": "Test"}}
    create_response = authenticated_client.post('/products/create-product', json=product_data)
    assert create_response.status_code == 201
    created_product = create_response.json()
    product_id = created_product['id']
    assert created_product['name'] == "Original Name"

    updated_data = {"url": url_to_create, "source": "UpdatedSource"}
    update_response = authenticated_client.put(f'/products/{product_id}', json=updated_data)
    assert update_response.status_code == 200, update_response.text

    updated_product_json = update_response.json()
    validated_product = ProductOut(**updated_product_json)
    assert validated_product.name == "Updated Product Name"
    assert validated_product.current_price == 42.42
    assert validated_product.source == "UpdatedSource"

def test_delete_product(authenticated_client, mock_scraper):
    """
    Test the delete_product endpoint.
    """
    product_data = {"product": {"url": f"https://example.com/product_{uuid.uuid4()}", "source": "Test"}}
    create_response = authenticated_client.post('/products/create-product', json=product_data)
    product_id = create_response.json()['id']

    delete_response = authenticated_client.delete(f'/products/{product_id}')
    assert delete_response.status_code == 200
    assert "deleted successfully" in delete_response.json().get("message", "").lower()

    get_response = authenticated_client.get(f'/products/{product_id}')
    assert get_response.status_code == 404
