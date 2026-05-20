# NexaSupply — Master Implementation Plan

> **For Hermes Cron Agent:** Follow TDD strictly. Every endpoint = test first → fail → implement → pass → commit.

**Goal:** Build complete NexaSupply backend (FastAPI + PostgreSQL) and frontend (Angular 21) MVP, with `/dev` endpoints for testing without auth, full TDD coverage, and browser-based E2E validation.

**Architecture:**
- Backend: FastAPI with dual routers — `/api/v1/*` (JWT auth) and `/dev/*` (no auth, same logic)
- Frontend: Angular 21 standalone components, PrimeNG, SCSS
- DB: PostgreSQL 16 via Docker Compose
- Testing: pytest (backend) + browser tools (frontend E2E)
- Cron: autonomous tick every 30 min, state-driven

**Deadline:** 2026-05-20 09:00 AM

---

## Phase 0: Setup & Infrastructure

### Task 0.1: Project scaffolding
- Create backend dir: `backend/app/`, `backend/app/api/v1/`, `backend/app/dev/`, `backend/app/models/`, `backend/app/services/`, `backend/tests/`
- Create `backend/requirements.txt` (fastapi, uvicorn, sqlalchemy, asyncpg, pytest, httpx, python-jose, passlib, pydantic)
- Create `backend/docker-compose.yml` with PostgreSQL 16 container (db name: nexasupply, user: nexasupply, pass: nexasupply_dev)
- Create `backend/app/main.py` with dual routers
- Create `backend/app/config.py` with DB URL and JWT settings

### Task 0.2: `/dev` base router
- Create `backend/app/dev/__init__.py` with base router that mirrors `/api/v1` but skips auth
- Pattern: each `/dev` endpoint calls the same service function as `/api/v1`, just without `Depends(get_current_user)`

---

## Phase 1: Backend — Auth

### Task 1.1: User model
- `backend/app/models/user.py` — SQLAlchemy model: id, email, password_hash, full_name, business_name, created_at
- Migration: auto-create tables on startup

### Task 1.2: Auth service
- `backend/app/services/auth.py` — hash_password, verify_password, create_token, decode_token
- Tests: `backend/tests/test_auth.py`

### Task 1.3: `/dev/auth/register` POST
- Accept: email, password, full_name, business_name
- Return: user + token
- Test: register → 201, duplicate email → 409

### Task 1.4: `/dev/auth/login` POST
- Accept: email, password
- Return: access_token + user
- Test: valid login → 200, wrong password → 401

### Task 1.5: `/api/v1/auth/*` (production with JWT)
- Same as /dev but with JWT dependency
- Test: no token → 401, valid token → 200

---

## Phase 2: Backend — Products

### Task 2.1: Product model
- `backend/app/models/product.py` — id, name, description, price, stock, category, brand, image_url

### Task 2.2: Seed data
- `backend/app/seed.py` — 12 products across 6 brands (CBC, PepsiCo, Nestlé, Backus, Mondelez, Quala)

### Task 2.3: `/dev/products` endpoints
- GET `/dev/products` — list all, optional ?category= & ?brand= filters
- GET `/dev/products/{id}` — single product
- POST `/dev/products` — create (admin)
- Tests for all

### Task 2.4: `/api/v1/products/*` (production)
- Same endpoints with auth + admin role check

---

## Phase 3: Backend — Orders & Cart

### Task 3.1: Order + OrderItem models
- Order: id, user_id, status (pending/confirmed/shipped/delivered), total, created_at
- OrderItem: id, order_id, product_id, quantity, unit_price

### Task 3.2: `/dev/orders` endpoints
- POST `/dev/orders` — create from cart items array
- GET `/dev/orders` — list user's orders
- GET `/dev/orders/{id}` — single order with items
- PATCH `/dev/orders/{id}/status` — update tracking status
- Tests with race condition check (stock decrement)

### Task 3.3: `/api/v1/orders/*` (production)
- Same with auth

---

## Phase 4: Backend — Inventory

### Task 4.1: `/dev/inventory` endpoints
- GET `/dev/inventory` — current stock for all products
- PATCH `/dev/inventory/{product_id}` — adjust stock
- Tests

---

## Phase 5: Backend — Subscriptions

### Task 5.1: Subscription model
- id, user_id, plan (basic/premium), status, start_date, end_date

### Task 5.2: `/dev/subscriptions` endpoints
- POST `/dev/subscriptions` — create/upgrade subscription
- GET `/dev/subscriptions/me` — current subscription
- Tests

---

## Phase 6: Backend — Admin

### Task 6.1: Admin dashboard endpoints
- GET `/dev/admin/stats` — total users, orders, revenue
- GET `/dev/admin/orders` — all orders (admin view)
- Tests

---

## Phase 7: Frontend — Auth Pages

### Task 7.1: Login page
- `frontend/src/app/pages/login/` — email + password form, JWT storage, redirect to dashboard
- Browser test: navigate → fill form → submit → verify redirect

### Task 7.2: Register page
- `frontend/src/app/pages/register/` — full registration form with business name
- Browser test: navigate → fill → submit → verify account created

### Task 7.3: Auth service + interceptor
- `frontend/src/app/services/auth.service.ts` — login, register, logout, token management
- HTTP interceptor to attach JWT to all requests

---

## Phase 8: Frontend — Dashboard

### Task 8.1: Dashboard page
- `frontend/src/app/pages/dashboard/` — KPIs, recent orders, quick actions
- Browser test: login → dashboard renders with data

---

## Phase 9: Frontend — Catalog & Cart

### Task 9.1: Product catalog
- `frontend/src/app/pages/catalog/` — grid of products, filters, search
- Browser test: browse → filter → view product detail

### Task 9.2: Cart
- `frontend/src/app/services/cart.service.ts` — add, remove, update quantity
- Cart drawer/component in navbar
- Browser test: add 3 products → verify cart count

---

## Phase 10: Frontend — Checkout

### Task 10.1: Checkout page
- `frontend/src/app/pages/checkout/` — order summary, shipping info, payment simulation
- **Payment animation:** 3-second card processing animation with success checkmark
- Browser test: complete checkout → see confirmation

---

## Phase 11: Frontend — Tracking & Inventory

### Task 11.1: Order tracking
- `frontend/src/app/pages/orders/` — list orders, click for tracking timeline
- Browser test: view order → see status timeline

### Task 11.2: Inventory management
- `frontend/src/app/pages/inventory/` — current stock view, low-stock alerts
- Browser test: view inventory → verify stock levels

---

## Phase 12: Frontend — Admin Panel

### Task 12.1: Admin pages
- Product management (CRUD)
- Order management (status updates)
- User management
- Browser test: admin login → manage products → update order status

---

## Phase 13: E2E Integration Testing

### Task 13.1: Full flow
Complete browser-driven flow:
1. Register new bodega → ✓
2. Login → ✓
3. Browse catalog → ✓
4. Add 3 products to cart → ✓
5. Checkout → ✓
6. Simulated payment → ✓
7. View order confirmation → ✓
8. Track order status → ✓
9. View inventory update → ✓

### Task 13.2: Bug fixes
- Fix any issues found during E2E
- Re-run tests to confirm

---

## Phase 14: Final Report

Generate summary with:
- All endpoints created (list with methods)
- All tests passing (count)
- All commits made
- Any known issues
- Screenshots of key pages (if available)
