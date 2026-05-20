"""Tests for inventory endpoints — /dev/inventory and /api/v1/inventory."""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


class TestDevInventory:
    """/dev/inventory endpoints"""

    def test_list_inventory(self):
        """GET /dev/inventory should return stock for all products."""
        response = client.get("/dev/inventory")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 12  # At least the seeded products

    def test_get_inventory_has_keys(self):
        """Inventory items should have product info and stock."""
        response = client.get("/dev/inventory")
        data = response.json()
        if data:
            item = data[0]
            assert "product_id" in item
            assert "product_name" in item
            assert "quantity" in item

    def test_adjust_stock(self):
        """PATCH /dev/inventory/{product_id} should adjust stock."""
        # Get a product
        products = client.get("/dev/products").json()
        product = products[0]
        product_id = product["id"]
        current_stock = product["stock"]

        # Adjust stock by +10
        response = client.patch(
            f"/dev/inventory/{product_id}",
            json={"quantity": current_stock + 10},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == current_stock + 10

        # Verify via products endpoint
        updated = client.get(f"/dev/products/{product_id}").json()
        assert updated["stock"] == current_stock + 10


class TestApiV1Inventory:
    """/api/v1/inventory endpoints"""

    def test_list_requires_auth(self):
        """GET /api/v1/inventory without token should return 401."""
        response = client.get("/api/v1/inventory")
        assert response.status_code == 401

    def test_list_with_valid_token(self):
        """GET /api/v1/inventory with valid token should work."""
        email = _unique_email("inv")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Inv Tester",
            "owner_name": "Tester",
            "email": email,
            "password": "testpass123",
        })
        token = reg_resp.json()["access_token"]

        response = client.get(
            "/api/v1/inventory",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
