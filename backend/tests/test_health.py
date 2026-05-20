"""Test the /dev/health endpoint — Phase 0 infrastructure check."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dev_health_returns_200():
    """/dev/health should return status ok with service name."""
    response = client.get("/dev/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "nexasupply-api"


def test_api_v1_health_returns_200():
    """/api/v1/health should also return ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
