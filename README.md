# NexaSupply — Demo SaaS B2B

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

> **Proyecto académico — E-Business y Analítica Web**  
> Universidad Privada del Norte | 2026-I | Ing. José Vásquez Pereyra

Ecosistema **SaaS B2B** para la transformación digital de **Pauser Distribuciones S.A.C.** en un operador logístico 4PL inteligente. Plataforma donde bodegueros pueden registrarse, suscribirse, comprar productos al por mayor y gestionar su inventario en tiempo real.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Angular 17+ (Standalone + PrimeNG) | SPA con routing, dashboard, catálogo |
| **Backend** | FastAPI (Python 3.11+) | API REST async, validación Pydantic |
| **Base de datos** | PostgreSQL 16 + SQLAlchemy + Alembic | Migraciones, relaciones, integridad |
| **Autenticación** | JWT (python-jose) | Tokens de acceso bodeguero + admin |
| **Pasarela** | Mock inline en FastAPI | Simulación de pagos sin dependencias externas |
| **Despliegue** | Docker Compose (3 servicios) | db + api + web |

---

## 📦 Quick Start

```bash
# 1. Clonar
git clone https://github.com/YamiDarknezz/NexaSupply.git
cd NexaSupply

# 2. Iniciar todo
docker compose up --build

# 3. Abrir en navegador
# Frontend:    http://localhost:80
# Backend API: http://localhost:8000
# Docs API:    http://localhost:8000/docs
```

> ⚠️ La primera vez tarda un minuto en arrancar (PostgreSQL + migraciones + seed).

---

## 🌱 Seed Data

Al iniciar, la base de datos se siembra automáticamente con:

### 10 Productos (Catálogo Pauser)

| Producto | Precio | Stock | Categoría |
|----------|--------|-------|-----------|
| Cerveza Cristal 355ml x6 | S/ 18.50 | 50 | Bebidas |
| Galletas Oreo 12und | S/ 5.90 | 30 | Snacks |
| Leche Ideal 400g | S/ 4.20 | 20 | Lácteos |
| Arroz Costeño 1kg | S/ 3.80 | 100 | Abarrotes |
| Aceite Primor 1L | S/ 8.90 | 45 | Abarrotes |
| Inca Kola 500ml | S/ 2.50 | 80 | Bebidas |
| Detergente Sapolio 500g | S/ 4.50 | 60 | Limpieza |
| Panetón D'Onofrio 900g | S/ 25.00 | 15 | Estacional |
| Chocolate Sublime 30g | S/ 1.50 | 200 | Snacks |
| Aceitunas Don Lucho 250g | S/ 6.50 | 40 | Abarrotes |

### 2 Bodegas de Prueba

| Bodega | Email | Plan | Estado |
|--------|-------|------|--------|
| Bodega Don Roberto | roberto@bodega.com | Premium | Activo |
| Minimarket La Esquina | maria@minimarket.com | Basic | Activo |

> **Contraseña de prueba para ambas:** `demo123`

### 1 Admin

| Email | Contraseña |
|-------|-----------|
| admin@nexasupply.store | admin123 |

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Registrar nueva bodega (3 pasos en 1 request) |
| `POST` | `/api/auth/login` | Login bodeguero → devuelve JWT |
| `POST` | `/api/auth/admin/login` | Login admin → devuelve JWT |

**Ejemplo register:**
```json
{
  "name": "Bodega Don José",
  "address": "Av. España 123, Trujillo",
  "phone": "987654321",
  "owner_name": "José López",
  "email": "jose@bodega.com",
  "password": "demo123",
  "plan": "premium"
}
```

### Productos (`/api/products`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/products` | Listar catálogo (filtro por ?category= y ?search=) |
| `GET` | `/api/products/{id}` | Ficha detallada de producto |

### Carrito (`/api/cart`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cart` | Ver carrito de la bodega autenticada |
| `POST` | `/api/cart/add` | Agregar producto (valida stock) |
| `PUT` | `/api/cart/update/{item_id}` | Actualizar cantidad |
| `DELETE` | `/api/cart/remove/{item_id}` | Eliminar item del carrito |

**Ejemplo add:**
```json
{
  "product_id": "a1b2c3d4-...",
  "quantity": 6
}
```

### Checkout (`/api/checkout`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/checkout` | Procesar compra (crea orden, reduce stock, vacía carrito) |
| `POST` | `/api/payment/simulate` | Simular pago (95% éxito, valida formato tarjeta) |

**Ejemplo payment:**
```json
{
  "card_number": "4111111111111111",
  "expiry": "12/28",
  "cvv": "123",
  "holder_name": "José López",
  "amount": 185.50
}
```

**Respuestas:**
- ✅ 200: `{"status": "approved", "transaction_id": "TXN-nnnnnn"}`
- ❌ 400: `{"status": "rejected", "reason": "Tarjeta sin fondos"}`

### Pedidos (`/api/orders`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/orders` | Historial de pedidos de la bodega |
| `GET` | `/api/orders/{id}` | Detalle + timeline de tracking |
| `POST` | `/api/orders/{id}/receive` | Marcar como recibido (suma al inventario) |

### Admin (`/api/admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | Listar todas las órdenes |
| `POST` | `/api/admin/orders/{id}/advance` | Avanzar tracking manualmente |

### Inventario (`/api/inventory`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/inventory` | Ver inventario de la bodega autenticada |

---

## 🧪 Flujo de Demo Recomendado

```
1. Abrir landing (/) → "Registra tu bodega"
2. Registrarse (/registro) → seleccionar plan
3. Pagar suscripción mock (4111 1111 1111 1111)
4. Login con credenciales creadas
5. Dashboard → ver resumen
6. Catálogo → explorar productos, filtrar por categoría
7. Hacer clic en producto → ficha detallada con galería
8. Agregar al carrito → ver mini-carrito
9. Ir al carrito → ajustar cantidades
10. Checkout → barra de progreso → pagar
11. Confirmación con número de orden
12. Tracking → timeline visual → "Marcar como recibido"
13. Inventario → productos sumados
```

---

## 🗂️ Estructura del Proyecto

```
NexaSupply/
├── backend/
│   ├── main.py              → App FastAPI + routers
│   ├── database.py          → Conexión PostgreSQL + SessionLocal
│   ├── models.py            → SQLAlchemy models (Store, Product, Cart, Order, etc.)
│   ├── schemas.py           → Pydantic schemas (request/response)
│   ├── auth.py              → JWT creation + verification + password hashing
│   ├── seed.py              → Seed data (productos, bodegas, admin)
│   ├── requirements.txt     → Dependencias Python
│   └── Dockerfile           → Imagen backend
├── frontend/
│   ├── ...                  → Angular app (Standalone components)
│   └── Dockerfile           → Nginx + Angular build
├── docker-compose.yml       → 3 servicios (db + api + web)
├── .gitignore
└── README.md
```

---

## 📋 Pendientes / Roadmap

- [x] Backend completo (FastAPI + SQLAlchemy + JWT)
- [x] Seed data automática
- [x] Docker Compose funcional
- [ ] Frontend Angular (en desarrollo)
- [ ] Chatbot widget (Dialogflow CX)
- [ ] Accesibilidad WCAG AA
- [ ] HTTPS con Let's Encrypt

---

## 🧑‍🤝‍🧑 Equipo NexaSupply

| Integrante | Rol |
|-----------|-----|
| Mariño Ñique, Luis Enrique | Frontend & UX/UI |
| Paredes Tapia, Carlos Eduardo | Backend & APIs |
| Plasencia Torres, Gerardo Erick | Líder / Arquitecto de Soluciones |
| Ponce Tejeda, Einstein Dyer | QA & Testing |
| Rodríguez Vasquez, José Diego | DevOps & Cloud |
| Romer Ramirez, Williams Anthony | Data & Machine Learning |

---

## 📄 Licencia

Proyecto académico — Universidad Privada del Norte — 2026-I
