"""Tests for subscription endpoints — /dev/subscriptions and /api/v1/subscriptions."""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


class TestDevSubscriptions:
    """/dev/subscriptions endpoints"""

    def test_create_subscription(self):
        """POST /dev/subscriptions should create a subscription."""
        email = _unique_email("sub")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Sub Tester",
            "owner_name": "Tester",
            "email": email,
            "password": "testpass123",
        })
        store_id = reg_resp.json()["store_id"]

        response = client.post(
            "/dev/subscriptions",
            json={"plan": "premium"},
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["plan"] == "premium"
        assert data["status"] == "active"

    def test_get_subscription_me(self):
        """GET /dev/subscriptions/me should return current subscription."""
        email = _unique_email("subme")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Sub Me Tester",
            "owner_name": "Tester",
            "email": email,
            "password": "testpass123",
        })
        store_id = reg_resp.json()["store_id"]

        # Create subscription first
        client.post(
            "/dev/subscriptions",
            json={"plan": "basic"},
            headers={"X-Store-ID": store_id},
        )

        # Get subscription
        response = client.get(
            "/dev/subscriptions/me",
            headers={"X-Store-ID": store_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] in ("basic", "premium")
        assert "status" in data


class TestApiV1Subscriptions:
    """/api/v1/subscriptions endpoints"""

    def test_create_requires_auth(self):
        """POST /api/v1/subscriptions without token should return 401."""
        response = client.post("/api/v1/subscriptions", json={"plan": "basic"})
        assert response.status_code == 401

    def test_create_with_valid_token(self):
        """POST /api/v1/subscriptions with valid token should work."""
        email = _unique_email("apisub")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "API Sub Tester",
            "owner_name": "Tester",
            "email": email,
            "password": "testpass123",
        })
        token = reg_resp.json()["access_token"]

        response = client.post(
            "/api/v1/subscriptions",
            json={"plan": "premium"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["plan"] == "premium"
