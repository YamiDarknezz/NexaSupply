# NexaSupply — Demo SaaS B2B

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

> **Proyecto académico — E-Business y Analítica Web**  
> Universidad Privada del Norte | 2026-I | Ing. José Vásquez Pereyra

Ecosistema **SaaS B2B** para la transformación digital de **Pauser Distribuciones S.A.C.** en un operador logístico 4PL inteligente. Plataforma donde bodegueros pueden registrarse, suscribirse, comprar productos al por mayor y gestionar su inventario en tiempo real.

---

## Requisitos

- **Docker Desktop** (v24+)
- **Git**
- **Windows 10/11** con WSL2 habilitado (o Linux/Mac)
- ~5 GB de espacio libre en disco

---

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/YamiDarknezz/NexaSupply.git
cd NexaSupply
```

### 2. Iniciar los servicios

```bash
docker compose up --build -d
```

Este comando:
- Descarga las imágenes de **PostgreSQL 16**, **Python 3.11** y **Node 20**
- Instala dependencias del backend (FastAPI, SQLAlchemy, etc.)
- Compila el frontend Angular con configuración de producción
- Inicia los 3 contenedores: `db`, `api`, `web`
- **Ejecuta el seed automáticamente** (crea tablas + datos de prueba)

> La primera vez tarda **2-5 minutos** en descargar imágenes y compilar.

### 3. Verificar que todo está corriendo

```bash
docker compose ps
```

Debes ver 3 servicios con estado `Up`:

| Servicio | Puerto | Estado |
|----------|--------|--------|
| `nexasupply-db-1` | 5432 | Up (healthy) |
| `nexasupply-api-1` | 8000 | Up |
| `nexasupply-web-1` | 80 | Up |

### 4. Abrir en el navegador

| Página | URL |
|--------|-----|
| Landing / Registro | http://localhost |
| Catálogo de productos | http://localhost/productos |
| Panel Admin | http://localhost/admin |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Health | http://localhost:8000/api/health |

---

## Seed Data (se ejecuta automáticamente al iniciar)

El archivo `backend/app/seed.py` se ejecuta en el arranque y crea:

### 12 Productos con imágenes SVG placeholder y variantes

| Producto | Precio | Stock | Categoría | Variantes |
|----------|--------|-------|-----------|-----------|
| Cerveza Cristal 355ml x6 | S/ 18.50 | 50 | Bebidas | Botella/Lata/Retornable |
| Galletas Oreo 12und | S/ 5.90 | 30 | Snacks | Clásico/Doble Crema/Mini |
| Leche Ideal 400g | S/ 4.20 | 20 | Lácteos | — |
| Arroz Costeño 1kg | S/ 3.80 | 100 | Abarrotes | — |
| Aceite Primor 1L | S/ 8.90 | 45 | Abarrotes | — |
| Inca Kola 500ml | S/ 2.50 | 80 | Bebidas | 500ml/1.5L/Lata |
| Detergente Sapolio 500g | S/ 4.50 | 60 | Limpieza | Lavanda/Limón/Original |
| Panetón D'Onofrio 900g | S/ 25.00 | 15 | Estacional | — |
| Chocolate Sublime 30g | S/ 1.50 | 200 | Snacks | — |
| Aceitunas Don Lucho 250g | S/ 6.50 | 40 | Abarrotes | — |
| Fideos Don Vittorio 1kg | S/ 3.20 | 70 | Abarrotes | — |
| Yogurt Gloria 1L | S/ 7.50 | 35 | Lácteos | — |

Cada producto tiene **5 imágenes placeholder SVG** generadas automáticamente (fondo blanco, contexto bodega, detalle etiqueta, escala, variante).

### 2 Bodegas de Prueba

| Bodega | Email | Contraseña | Plan |
|--------|-------|-----------|------|
| Bodega Don Roberto | roberto@bodega.com | demo123 | Premium |
| Minimarket La Esquina | maria@minimarket.com | demo123 | Basic |

### 1 Administrador

| Email | Contraseña |
|-------|-----------|
| admin@nexasupply.store | admin123 |

---

## Flujo de Demo Recomendado

```
1. Abrir http://localhost → Landing page
2. Ir a /admin → login con admin@nexasupply.store / admin123
   → Explorar panel: productos, pedidos, bodegas
3. Ir a /login → login como roberto@bodega.com / demo123
4. Dashboard → ver KPIs, acceso rápido
5. Catálogo → explorar 12 productos, filtrar por categoría
6. Hacer clic en un producto → galería, variantes, margen B2B
7. Agregar al carrito desde el catálogo o detalle
8. Ir al carrito → ver items, modificar cantidades
9. Checkout → simular pago (procesa orden)
10. Pedidos → timeline de tracking (4 estados)
11. Inventario → stock actual de la bodega
```

---

## Solución de Problemas

### Error `ERR_CONNECTION_REFUSED`

```bash
# Verificar que Docker está corriendo
docker info

# Verificar que los contenedores están up
docker compose ps

# Ver logs del backend
docker compose logs api

# Ver logs del frontend
docker compose logs web
```

### Reconstruir desde cero

```bash
# Bajar todo y eliminar volúmenes (borra la DB)
docker compose down -v

# Reconstruir y levantar
docker compose up --build -d
```

### Ejecutar seed manualmente

```bash
docker compose exec api python -m app.seed
```

### Frontend no carga en localhost

```bash
# Probar si el API responde
curl http://localhost:8000/api/health

# Revisar si el build de Angular falló
docker compose logs web | grep -i error
```

### Error de compilación Angular en Docker

Si ves errores como `Cannot find module '@angular/cli/bin/ng.js'`, probablemente el lockfile está desactualizado. Solución:

```bash
cd frontend
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver solo logs del API
docker compose logs -f api

# Ver solo logs del web
docker compose logs -f web

# Detener servicios
docker compose down

# Detener y borrar datos
docker compose down -v

# Reconstruir un servicio específico
docker compose up --build -d web
```

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Angular 21 (Standalone) + PrimeNG + TailwindCSS | SPA con lazy loading |
| **Backend** | FastAPI (Python 3.11+) | API REST async + validación Pydantic |
| **Base de datos** | PostgreSQL 16 + SQLAlchemy 2.0 | ORM con joinedload |
| **Autenticación** | JWT (python-jose + bcrypt) | Tokens bodeguero + admin |
| **Imágenes** | SVGs placeholder inline | 5 imágenes por producto |
| **Pasarela** | Mock interno | Simulación de pagos (95% éxito) |
| **Contenedores** | Docker Compose | 3 servicios: db + api + web |

---

## API Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registrar bodega |
| POST | `/api/auth/login` | No | Login bodeguero → JWT |

### Productos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/products` | No | Listar (filtro `?category=` y `?search=`) |
| GET | `/api/products/{id}` | No | Detalle con imágenes y variantes |

### Carrito

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/cart` | JWT | Ver carrito |
| POST | `/api/cart/add` | JWT | Agregar producto |
| POST | `/api/cart/update` | JWT | Actualizar cantidad |
| DELETE | `/api/cart/{item_id}` | JWT | Eliminar item |
| DELETE | `/api/cart` | JWT | Vaciar carrito |

### Checkout

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/checkout` | JWT | Procesar compra |
| POST | `/api/checkout/payment/simulate` | No | Mock de pago |

### Pedidos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/orders/my` | JWT | Mis pedidos |
| GET | `/api/orders/{id}` | JWT | Detalle + tracking |
| POST | `/api/orders/{id}/advance` | JWT | Avanzar estado |
| POST | `/api/orders/{id}/receive` | JWT | Marcar recibido |

### Inventario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/inventory` | JWT | Inventario de la bodega |

### Admin

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/admin/login` | No | Login admin → JWT |
| GET | `/api/admin/orders` | No | Listar pedidos |
| POST | `/api/admin/orders/{id}/advance` | No | Avanzar tracking |
| GET | `/api/admin/stores` | No | Listar bodegas |
| GET | `/api/admin/products` | No | Listar productos (con imágenes) |
| POST | `/api/admin/products` | No | Crear producto |
| PUT | `/api/admin/products/{id}` | No | Actualizar producto |
| DELETE | `/api/admin/products/{id}` | No | Eliminar producto |
| POST | `/api/admin/products/{id}/images` | No | Subir imagen (multipart) |
| DELETE | `/api/admin/products/{id}/images/{img_id}` | No | Eliminar imagen |
| POST | `/api/admin/products/{id}/variants` | No | Crear variante |
| PUT | `/api/admin/products/{id}/variants/{v_id}` | No | Actualizar variante |
| DELETE | `/api/admin/products/{id}/variants/{v_id}` | No | Eliminar variante |

---

## Equipo NexaSupply

| Integrante | Rol |
|-----------|-----|
| Mariño Ñique, Luis Enrique | Frontend & UX/UI |
| Paredes Tapia, Carlos Eduardo | Backend & APIs |
| Plasencia Torres, Gerardo Erick | Líder / Arquitecto de Soluciones |
| Ponce Tejeda, Einstein Dyer | QA & Testing |
| Rodríguez Vasquez, José Diego | DevOps & Cloud |
| Romer Ramirez, Williams Anthony | Data & Machine Learning |

---

Proyecto académico — Universidad Privada del Norte — 2026-I
