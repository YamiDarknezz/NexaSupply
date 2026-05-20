"""Tests for admin endpoints — /dev/admin and /api/v1/admin."""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


class TestDevAdmin:
    """/dev/admin endpoints"""

    def test_admin_stats(self):
        """GET /dev/admin/stats should return totals."""
        # Create some data first
        email = _unique_email("adminstats")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Admin Stats Store",
            "owner_name": "Admin",
            "email": email,
            "password": "testpass123",
        })
        store_id = reg_resp.json()["store_id"]

        # Create an order
        products = client.get("/dev/products").json()
        client.post("/dev/orders", json={
            "items": [{"product_id": products[0]["id"], "quantity": 1}],
        }, headers={"X-Store-ID": store_id})

        # Get stats
        response = client.get("/dev/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_stores" in data
        assert "total_orders" in data
        assert "total_revenue" in data

    def test_admin_orders(self):
        """GET /dev/admin/orders should list all orders."""
        response = client.get("/dev/admin/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestApiV1Admin:
    """/api/v1/admin endpoints"""

    def test_stats_requires_auth(self):
        """GET /api/v1/admin/stats without token should return 401."""
        response = client.get("/api/v1/admin/stats")
        assert response.status_code == 401

    def test_stats_with_token(self):
        """GET /api/v1/admin/stats with token should work."""
        email = _unique_email("apiadmin")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "API Admin Store",
            "owner_name": "Admin",
            "email": email,
            "password": "testpass123",
        })
        token = reg_resp.json()["access_token"]

        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_stores" in data
        assert "total_orders" in data
