"""Tests for product endpoints — /dev/products and /api/v1/products."""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


class TestDevProductsList:
    """GET /dev/products"""

    def test_list_all_products(self):
        """Should return a list of products."""
        response = client.get("/dev/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # At least the 12 seeded products
        assert len(data) >= 12

    def test_list_products_with_category_filter(self):
        """Should filter by category."""
        response = client.get("/dev/products?category=Bebidas")
        assert response.status_code == 200
        data = response.json()
        assert all(p["category"] == "Bebidas" for p in data)

    def test_list_products_with_search(self):
        """Should search by name."""
        response = client.get("/dev/products?search=Cristal")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "Cristal" in data[0]["name"]


class TestDevProductsGet:
    """GET /dev/products/{id}"""

    def test_get_product_by_id(self):
        """Should return a single product."""
        # Get first product from list
        products = client.get("/dev/products").json()
        assert len(products) > 0
        product_id = products[0]["id"]

        response = client.get(f"/dev/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert "name" in data
        assert "price" in data

    def test_get_product_not_found(self):
        """Should return 404 for non-existent product."""
        response = client.get("/dev/products/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404


class TestDevProductsCreate:
    """POST /dev/products — admin create"""

    def test_create_product(self):
        """Should create a new product."""
        payload = {
            "name": "Test Product",
            "description": "A test product",
            "price": 99.99,
            "category": "Testing",
            "stock": 100,
            "image_url": "/assets/products/test.jpg",
        }
        response = client.post("/dev/products", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Product"
        assert data["price"] == 99.99
        assert data["stock"] == 100


class TestApiV1Products:
    """/api/v1/products endpoints (with auth)"""

    def test_list_requires_auth(self):
        """GET /api/v1/products without token should return 401."""
        response = client.get("/api/v1/products")
        assert response.status_code == 401

    def test_list_with_valid_token(self):
        """GET /api/v1/products with valid token should return products."""
        # Register and get token
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Products Tester",
            "owner_name": "Tester",
            "email": _unique_email("products"),
            "password": "testpass123",
        })
        token = reg_resp.json()["access_token"]

        response = client.get(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 12
