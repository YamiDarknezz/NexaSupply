"""Tests for order endpoints — /dev/orders and /api/v1/orders."""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


def _register_store():
    """Helper: register a store and return (token, store_id, store_name)."""
    email = _unique_email("order")
    resp = client.post("/dev/auth/register", json={
        "store_name": "Order Test Store",
        "owner_name": "Order Tester",
        "email": email,
        "password": "testpass123",
    })
    data = resp.json()
    return data["access_token"], data["store_id"], data["store_name"]


class TestDevOrdersCreate:
    """POST /dev/orders"""

    def test_create_order_from_cart(self):
        """Should create an order and decrement stock."""
        token, store_id, _ = _register_store()

        # First, get a product
        products = client.get("/dev/products").json()
        product = products[0]
        product_id = product["id"]
        initial_stock = product["stock"]

        # Create order with items
        response = client.post(
            "/dev/orders",
            json={
                "items": [{"product_id": product_id, "quantity": 2}],
            },
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code == 201
        data = response.json()
        assert "order_id" in data
        assert data["status"] == "confirmed"

        # Verify stock was decremented
        updated = client.get(f"/dev/products/{product_id}").json()
        assert updated["stock"] == initial_stock - 2

    def test_create_order_insufficient_stock(self):
        """Should reject order when stock is insufficient."""
        token, store_id, _ = _register_store()

        products = client.get("/dev/products").json()
        product = products[0]

        # Request more than available stock
        response = client.post(
            "/dev/orders",
            json={
                "items": [{"product_id": product["id"], "quantity": 99999}],
            },
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code in (400, 422)
        assert "stock" in response.text.lower() or "insuficiente" in response.text.lower()


class TestDevOrdersList:
    """GET /dev/orders"""

    def test_list_orders(self):
        """Should list orders for a store."""
        token, store_id, _ = _register_store()

        # Create an order first
        products = client.get("/dev/products").json()
        client.post(
            "/dev/orders",
            json={"items": [{"product_id": products[0]["id"], "quantity": 1}]},
            headers={"X-Store-ID": store_id},
        )

        # List orders
        response = client.get(
            "/dev/orders",
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1


class TestDevOrdersStatus:
    """PATCH /dev/orders/{id}/status"""

    def test_update_order_status(self):
        """Should update order tracking status."""
        token, store_id, _ = _register_store()

        products = client.get("/dev/products").json()
        create_resp = client.post(
            "/dev/orders",
            json={"items": [{"product_id": products[0]["id"], "quantity": 1}]},
            headers={"X-Store-ID": store_id},
        )
        order_id = create_resp.json()["order_id"]

        # Update status
        response = client.patch(
            f"/dev/orders/{order_id}/status",
            json={"status": "shipped"},
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tracking_status"] == "shipped"


class TestApiV1Orders:
    """/api/v1/orders endpoints"""

    def test_list_requires_auth(self):
        """GET /api/v1/orders without token should return 401."""
        response = client.get("/api/v1/orders")
        assert response.status_code == 401

    def test_create_with_valid_token(self):
        """POST /api/v1/orders with valid token should work."""
        token, store_id, _ = _register_store()

        products = client.get("/dev/products").json()
        response = client.post(
            "/api/v1/orders",
            json={"items": [{"product_id": products[0]["id"], "quantity": 1}]},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "order_id" in data
