import pytest
import uuid
from app.main import app
from app.schemas.user import UserOut
from fastapi.testclient import TestClient

# Test client for FastAPI
client = TestClient(app)

def test_create_user():
    """
    Test the create_user endpoint.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }
    response = client.post("/users/create", json=user_data)

    # Validate the response
    assert response.status_code == 200
    user = response.json()
    validated_user = UserOut(**user)
    assert isinstance(validated_user, UserOut)
    assert validated_user.email == user_data["email"]
    assert validated_user.id is not None

    # Delete the user after test
    delete_response = client.delete(f"/users/{validated_user.id}")
    assert delete_response.status_code == 200

def test_get_all_users():
    """
    Test the get_all_users endpoint.
    """
    response = client.get("/users/")
    assert response.status_code == 200
    users = response.json()

    # Validate that the response is a list of UserOut schemas
    assert isinstance(users, list)
    for user in users:
        validated_user = UserOut(**user)
        assert isinstance(validated_user, UserOut)
        assert validated_user.id is not None
        assert validated_user.email is not None

def test_get_user():
    """
    Test the get_user endpoint. 
    First we create a user, then attempt to retrieve that user_id
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }

    # First we create a user
    create_user_response = client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 200
    created_user = create_user_response.json()
    user_id = created_user['id']

    # Now we retrieve the user by ID
    get_user_response = client.get(f"/users/{user_id}")
    assert get_user_response.status_code == 200
    user = get_user_response.json()

    # Validate the retrieved user
    validated_user = UserOut(**user)
    assert isinstance(validated_user, UserOut)
    assert validated_user.id is not None
    assert validated_user.email is not None
    assert validated_user.id == user_id
    assert validated_user.email == user_data["email"]

    # Delete the user after test
    delete_response = client.delete(f"/users/{validated_user.id}")
    assert delete_response.status_code == 200

def test_update_user():
    """
    Test the update_user endpoint.
    First we create a user, then update that user's email and password.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }

    # Create a user
    create_user_response = client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 200
    created_user = create_user_response.json()
    user_id = created_user['id']

    # Update the user's email and password
    updated_data = {
        "email": f"updated_user_{uuid.uuid4()}@example.com",
        "password": "newsecurepassword"
    }
    update_response = client.put(f"/users/{user_id}", json=updated_data)
    assert update_response.status_code == 200
    updated_user = update_response.json()

    # Validate the updated user
    validated_user = UserOut(**updated_user)
    assert isinstance(validated_user, UserOut)
    assert validated_user.id == user_id
    assert validated_user.email == updated_data["email"]

    # Delete the user after test
    delete_response = client.delete(f"/users/{validated_user.id}")
    assert delete_response.status_code == 200

def test_delete_user():
    """
    Test the delete_user endpoint.
    First we create a user, then delete that user by ID.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }

    # Create a user
    create_user_response = client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 200
    created_user = create_user_response.json()
    user_id = created_user['id']

    # Delete the user
    delete_response = client.delete(f"/users/{user_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "User deleted successfully"}

    # Attempt to retrieve the deleted user
    get_user_response = client.get(f"/users/{user_id}")
    assert get_user_response.status_code == 404
    assert get_user_response.json() == {"detail": "There is no user with this ID"}

def test_create_user_with_existing_email():
    """
    Test creating a user with an email that already exists.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }

    # Create the first user
    create_user_response = client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 200

    # Attempt to create a second user with the same email
    duplicate_response = client.post("/users/create", json=user_data)
    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == {"detail": "Email already registered"}

    # Clean up by deleting the first user
    created_user = create_user_response.json()
    delete_response = client.delete(f"/users/{created_user['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "User deleted successfully"}

def test_login_user():
    """
    Test the login_user endpoint.
    First we create a user, then attempt to log in with that user's credentials.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }

    # Create a user
    create_user_response = client.post("/users/create", json=user_data)
    assert create_user_response.status_code == 200
    created_user = create_user_response.json()

    # Log in with the user's credentials
    login_response = client.post("/users/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert login_response.status_code == 200
    logged_in_user = login_response.json()

    # Validate the logged-in user
    validated_user = UserOut(**logged_in_user)
    assert isinstance(validated_user, UserOut)
    assert validated_user.id == created_user['id']
    assert validated_user.email == user_data["email"]

    # Try to log in with incorrect credentials
    incorrect_login_response = client.post("/users/login", json={
        "email": user_data["email"],
        "password": "wrongpassword"
    })
    assert incorrect_login_response.status_code == 400
    assert incorrect_login_response.json() == {'detail': 'Invalid credentials'}

    # Clean up by deleting the user
    delete_response = client.delete(f"/users/{validated_user.id}")
    assert delete_response.status_code == 200

