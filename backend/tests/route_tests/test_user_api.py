import pytest
import uuid
from app.schemas.user import LoginResponse, UserOut, Token, WholeUserOut

DELETE_USER_SUCCESS_MESSAGE = {"message": "User deleted successfully"}
INVALID_CREDENTIALS_ERROR = {"detail": "Invalid credentials"}
EMAIL_ALREADY_REGISTERED_MESSAGE = {"detail": "Email already registered"}

@pytest.fixture
def create_user_and_get_token(test_client):
    """Fixture to create a user and return the token and user data."""
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }
    response = test_client.post("/users/create", json=user_data)
    assert response.status_code == 201
    token = Token(**response.json())
    return {"token": token, "user_data": user_data}

def test_create_user(test_client):
    """
    Test the create_user endpoint returns a valid token.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }
    response = test_client.post("/users/create", json=user_data)
    assert response.status_code == 201

    token = Token(**response.json())
    assert token.access_token
    assert token.token_type == "bearer"

    # Verify user can be fetched with the new token
    headers = {"Authorization": f"Bearer {token.access_token}"}
    me_response = test_client.get("/users/me", headers=headers)
    assert me_response.status_code == 200
    user = UserOut(**me_response.json())
    assert user.email == user_data["email"]

def test_get_all_users(test_client, create_user_and_get_token):
    """
    Test the get_all_users endpoint.
    """
    response = test_client.get("/users/")
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    for user in users:
        WholeUserOut(**user)

def test_get_user(test_client, create_user_and_get_token):
    """
    Test the get_user endpoint.
    """
    token = create_user_and_get_token["token"]
    headers = {"Authorization": f"Bearer {token.access_token}"}
    me_response = test_client.get("/users/me", headers=headers)
    user_id = me_response.json()['id']

    get_user_response = test_client.get(f"/users/{user_id}")
    assert get_user_response.status_code == 200
    user = WholeUserOut(**get_user_response.json())
    assert user.id == user_id
    assert user.email == create_user_and_get_token["user_data"]["email"]

def test_update_user(test_client, create_user_and_get_token):
    """
    Test the update_user endpoint.
    """
    token = create_user_and_get_token["token"]
    headers = {"Authorization": f"Bearer {token.access_token}"}
    me_response = test_client.get("/users/me", headers=headers)
    user_id = me_response.json()['id']

    updated_data = {
        "email": f"updated_user_{uuid.uuid4()}@example.com",
        "password": "newsecurepassword"
    }
    update_response = test_client.put(f"/users/{user_id}", json=updated_data)
    assert update_response.status_code == 200
    updated_user = WholeUserOut(**update_response.json())
    assert updated_user.id == user_id
    assert updated_user.email == updated_data["email"]

def test_delete_user(test_client, create_user_and_get_token):
    """
    Test the delete_user endpoint.
    """
    token = create_user_and_get_token["token"]
    headers = {"Authorization": f"Bearer {token.access_token}"}
    me_response = test_client.get("/users/me", headers=headers)
    user_id = me_response.json()['id']

    delete_response = test_client.delete(f"/users/{user_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == DELETE_USER_SUCCESS_MESSAGE

    get_user_response = test_client.get(f"/users/{user_id}")
    assert get_user_response.status_code == 404

def test_create_user_with_existing_email(test_client, create_user_and_get_token):
    """
    Test creating a user with an email that already exists.
    """
    existing_email = create_user_and_get_token["user_data"]["email"]
    user_data = {"email": existing_email, "password": "somepassword"}

    duplicate_response = test_client.post("/users/create", json=user_data)
    assert duplicate_response.status_code == 400
    assert duplicate_response.json() == EMAIL_ALREADY_REGISTERED_MESSAGE

def test_login_user(test_client, create_user_and_get_token):
    """
    Test the login_user endpoint.
    """
    user_data = create_user_and_get_token["user_data"]

    login_response = test_client.post("/users/login", json=user_data)
    assert login_response.status_code == 200
    response = LoginResponse(**login_response.json())
    assert response.token
    assert response.token.access_token
    assert response.token.token_type == "bearer"

    # Test login with incorrect password
    incorrect_login_response = test_client.post("/users/login", json={
        "email": user_data["email"],
        "password": "wrongpassword"
    })
    assert incorrect_login_response.status_code == 400
    assert incorrect_login_response.json() == INVALID_CREDENTIALS_ERROR
