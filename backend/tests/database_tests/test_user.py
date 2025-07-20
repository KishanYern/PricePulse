import pytest
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid

from app.models import User, Product, Alert, UserProduct, AlertType

def test_create_user(test_db):
    """
    Test creating a new user and verifying its attributes.
    """
    user_data = {
        "email": f"test_user_{uuid.uuid4()}@example.com",
        "password": "securepassword123"
    }
    user = User(**user_data)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.id is not None
    assert user.email == user_data["email"]
    assert user.password == user_data["password"]
    assert isinstance(user.created_at, datetime)
    assert user.last_login is None # Should be None initially

    # Check if the created_at is recent (within 5 seconds of creating)
    assert datetime.now().timestamp() - user.created_at.timestamp() < 5

def test_read_user(test_db):
    """
    Test reading an existing user from the database.
    """
    user_data = {
        "email": f"read_user_{uuid.uuid4()}@example.com",
        "password": "anothersecurepassword"
    }
    user = User(**user_data)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    retrieved_user = test_db.query(User).filter(User.id == user.id).first()
    assert retrieved_user is not None
    assert retrieved_user.email == user_data["email"]
    assert retrieved_user.password == user_data["password"]

def test_update_user(test_db):
    """
    Test updating an existing user's attributes.
    """
    user = User(
        email=f"update_user_{uuid.uuid4()}@example.com",
        password="oldpassword"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    new_email = f"updated_user_{uuid.uuid4()}@example.com"
    new_password = "newsecurepassword"
    now = datetime.now()

    user.email = new_email
    user.password = new_password
    user.last_login = now
    test_db.commit()
    test_db.refresh(user)

    updated_user = test_db.query(User).filter(User.id == user.id).first()
    assert updated_user.email == new_email
    assert updated_user.password == new_password
    assert updated_user.last_login is not None
    assert abs((updated_user.last_login - now).total_seconds()) < 1 # Check if last_login is close to 'now'

def test_delete_user(test_db):
    """
    Test deleting a user from the database.
    """
    user = User(
        email=f"delete_user_{uuid.uuid4()}@example.com",
        password="todeletepassword"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    user_id = user.id
    test_db.delete(user)
    test_db.commit()

    deleted_user = test_db.query(User).filter(User.id == user_id).first()
    assert deleted_user is None

def test_unique_email_constraint(test_db):
    """
    Test that the 'email' field enforces a unique constraint.
    """
    shared_email = f"shared_email_{uuid.uuid4()}@example.com"

    user1 = User(
        email=shared_email,
        password="pass1"
    )
    test_db.add(user1)
    test_db.commit()
    test_db.refresh(user1)

    user2 = User(
        email=shared_email, # Duplicate email
        password="pass2"
    )
    test_db.add(user2)

    with pytest.raises(IntegrityError):
        test_db.commit()
    test_db.rollback() # Rollback the session after the failed commit

def test_default_created_at_timestamp(test_db):
    """
    Test that created_at is automatically populated on user creation.
    """
    user = User(
        email=f"timestamp_user_{uuid.uuid4()}@example.com",
        password="timestamp_pass"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.created_at is not None
    assert isinstance(user.created_at, datetime)
    # Check that it's recent
    assert datetime.now().timestamp() - user.created_at.timestamp() < 5

def test_cascade_delete_user_relationships(test_db):
    """
    Test that deleting a User cascades to delete associated Alert and UserProduct records.
    """
    # Create a user
    user = User(
        email=f"cascade_user_{uuid.uuid4()}@example.com",
        password="cascade_pass"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    user_id = user.id

    # Create a product (Alert and UserProduct also depend on Product)
    product = Product(
        name="Product for User Cascade Test",
        url=f"http://example.com/user_cascade_product-{uuid.uuid4()}",
        current_price=500.00
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)
    product_id = product.id

    # Create associated records for the user
    alert = Alert(
        product_id=product_id,
        user_id=user_id,
        target_price=450.00,
        alert_type=AlertType.DROP
    )
    user_product = UserProduct(
        product_id=product_id,
        user_id=user_id,
        notify=True,
        notes="Watching this product"
    )

    test_db.add_all([alert, user_product])
    test_db.commit()
    test_db.refresh(alert)
    test_db.refresh(user_product)

    # Verify associated records exist
    assert test_db.query(Alert).filter_by(user_id=user_id).count() == 1
    assert test_db.query(UserProduct).filter_by(user_id=user_id).count() == 1

    # Delete the user
    test_db.delete(user)
    test_db.commit()

    # Verify user is deleted
    assert test_db.query(User).filter_by(id=user_id).first() is None

    # Verify associated records are also deleted due to cascade
    assert test_db.query(Alert).filter_by(user_id=user_id).count() == 0
    assert test_db.query(UserProduct).filter_by(user_id=user_id).count() == 0
    # The product should still exist as User does not have a relationship to delete the Product
    assert test_db.query(Product).filter_by(id=product_id).first() is not None
