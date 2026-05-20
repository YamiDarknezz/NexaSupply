"""Tests for auth endpoints — /dev/auth and /api/v1/auth."""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    """Generate a unique email for each test run."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}@nexasupply.com"


class TestDevAuthRegister:
    """POST /dev/auth/register"""

    def test_register_creates_user_and_returns_token(self):
        """Register with valid data should return 201 with token."""
        email = _unique_email("register")
        payload = {
            "store_name": "Test Store",
            "owner_name": "Test Owner",
            "email": email,
            "password": "testpass123",
            "plan": "basic",
        }
        response = client.post("/dev/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["store_name"] == "Test Store"

    def test_register_duplicate_email_returns_409(self):
        """Registering with an existing email should return 400/409."""
        email = _unique_email("dupe")
        payload = {
            "store_name": "Duplicate Store",
            "owner_name": "Owner",
            "email": email,
            "password": "testpass123",
        }
        # First registration should succeed
        client.post("/dev/auth/register", json=payload)
        # Second should fail
        response = client.post("/dev/auth/register", json=payload)
        assert response.status_code in (400, 409)
        assert "registrado" in response.json()["detail"].lower()


class TestDevAuthLogin:
    """POST /dev/auth/login"""

    def _create_user(self):
        self.email = _unique_email("login")
        self.password = "testpass123"
        payload = {
            "store_name": "Login Test Store",
            "owner_name": "Login Owner",
            "email": self.email,
            "password": self.password,
        }
        client.post("/dev/auth/register", json=payload)

    def test_login_valid_returns_200_with_token(self):
        """Valid credentials should return 200 with access_token."""
        self._create_user()
        response = client.post("/dev/auth/login", json={
            "email": self.email,
            "password": self.password,
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["store_name"] == "Login Test Store"

    def test_login_invalid_password_returns_401(self):
        """Wrong password should return 401."""
        self._create_user()
        response = client.post("/dev/auth/login", json={
            "email": self.email,
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_nonexistent_email_returns_401(self):
        """Non-existent email should return 401."""
        response = client.post("/dev/auth/login", json={
            "email": _unique_email("nobody"),
            "password": "testpass123",
        })
        assert response.status_code == 401


class TestDevAuthMe:
    """GET /dev/auth/me"""

    def _register_and_get_token(self):
        email = _unique_email("me")
        reg_resp = client.post("/dev/auth/register", json={
            "store_name": "Me Test Store",
            "owner_name": "Me Owner",
            "email": email,
            "password": "testpass123",
        })
        return reg_resp.json()["access_token"], email

    def test_me_with_valid_token(self):
        """GET /dev/auth/me with valid token should return user info."""
        token, email = self._register_and_get_token()
        response = client.get(
            "/dev/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email

    def test_me_without_token_returns_401(self):
        """GET /dev/auth/me without token should return 401."""
        response = client.get("/dev/auth/me")
        assert response.status_code == 401


class TestApiV1AuthRegister:
    """POST /api/v1/auth/register"""

    def test_register_returns_201(self):
        """Register on /api/v1 should work the same as /dev."""
        email = _unique_email("apiv1")
        payload = {
            "store_name": "API V1 Store",
            "owner_name": "API Owner",
            "email": email,
            "password": "testpass123",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data


class TestApiV1AuthLogin:
    """POST /api/v1/auth/login"""

    def test_login_returns_200(self):
        """Login on /api/v1 should work."""
        email = _unique_email("apiv1-login")
        client.post("/dev/auth/register", json={
            "store_name": "API Login Store",
            "owner_name": "API Login Owner",
            "email": email,
            "password": "testpass123",
        })
        response = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "testpass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
