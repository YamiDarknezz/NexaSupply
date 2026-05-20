from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .models import *  # noqa — carga todos los modelos para create_all
from .routers import auth, products, cart, checkout, orders, inventory, admin

app = FastAPI(
    title="NexaSupply API",
    description="Demo SaaS B2B — NexaSupply (Pauser Distribuciones 4PL)",
    version="0.1.0",
)

# CORS para dev (Angular en :4200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(checkout.router, prefix="/api/checkout", tags=["Checkout"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexasupply-api"}
