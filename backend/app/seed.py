"""
Seed de datos para NexaSupply Demo.

Ejecutar: python -m app.seed
"""
import uuid
from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.models import *  # noqa
from app.core.security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Limpiar todo
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        print("🧹 Tablas limpiadas.")

        # ── Bodegas ──
        store1_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        store2_id = uuid.UUID("22222222-2222-2222-2222-222222222222")

        stores = [
            Store(
                id=store1_id,
                name="Bodega Don Roberto",
                ruc="10456789012",
                address="Av. España 123, Trujillo",
                phone="987654321",
                owner_name="Roberto Sánchez",
                email="roberto@bodega.com",
                password_hash=hash_password("demo123"),
                plan="premium",
                subscription_status="active",
            ),
            Store(
                id=store2_id,
                name="Minimarket La Esquina",
                ruc="10789012345",
                address="Jr. Pizarro 456, Trujillo",
                phone="987123456",
                owner_name="María López",
                email="maria@minimarket.com",
                password_hash=hash_password("demo123"),
                plan="basic",
                subscription_status="active",
            ),
        ]
        db.add_all(stores)
        db.flush()

        # ── Productos ──
        products_data = [
            {"id": "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "name": "Cerveza Cristal 355ml x 6", "desc": "Pack de 6 unidades", "price": 18.50, "cat": "Bebidas", "img": "cerveza-cristal.jpg", "stock": 50},
            {"id": "b2c3d4e5-f6a7-b8c9-d0e1-f2a3b4c5d6e7", "name": "Galletas Oreo 12 unidades", "desc": "Pack clásico de galletas Oreo", "price": 5.90, "cat": "Snacks", "img": "oreo-12.jpg", "stock": 30},
            {"id": "c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f8", "name": "Leche Ideal 400g", "desc": "Leche evaporada Ideal", "price": 4.20, "cat": "Lácteos", "img": "leche-ideal.jpg", "stock": 20},
            {"id": "d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9", "name": "Arroz Costeño 1kg", "desc": "Arroz extra premium", "price": 3.80, "cat": "Abarrotes", "img": "arroz-costeno.jpg", "stock": 100},
            {"id": "e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0", "name": "Aceite Primor 1L", "desc": "Aceite vegetal Primor", "price": 8.90, "cat": "Abarrotes", "img": "aceite-primor.jpg", "stock": 45},
            {"id": "f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1", "name": "Inca Kola 500ml", "desc": "Gaseosa Inca Kola", "price": 2.50, "cat": "Bebidas", "img": "inca-kola.jpg", "stock": 80},
            {"id": "a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2", "name": "Detergente Sapolio 500g", "desc": "Detergente en polvo", "price": 4.50, "cat": "Limpieza", "img": "sapolio.jpg", "stock": 60},
            {"id": "b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3", "name": "Panetón D'Onofrio 900g", "desc": "Panetón clásico", "price": 25.00, "cat": "Estacional", "img": "paneton.jpg", "stock": 15},
            {"id": "c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4", "name": "Chocolate Sublime 30g", "desc": "Chocolate con leche", "price": 1.50, "cat": "Snacks", "img": "sublime.jpg", "stock": 200},
            {"id": "d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5", "name": "Aceitunas Don Lucho 250g", "desc": "Aceitunas verdes", "price": 6.50, "cat": "Abarrotes", "img": "aceitunas.jpg", "stock": 40},
            {"id": "e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6", "name": "Fideos Don Vittorio 1kg", "desc": "Fideos spaghetti", "price": 3.20, "cat": "Abarrotes", "img": "fideos.jpg", "stock": 70},
            {"id": "f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7", "name": "Yogurt Gloria 1L", "desc": "Yogurt bebible fresa", "price": 7.50, "cat": "Lácteos", "img": "yogurt-gloria.jpg", "stock": 35},
        ]

        for p in products_data:
            db.add(Product(
                id=uuid.UUID(p["id"]),
                name=p["name"],
                description=p["desc"],
                price=p["price"],
                category=p["cat"],
                image_url=f"/assets/products/{p['img']}",
                stock=p["stock"],
                is_active=True,
            ))

        db.commit()
        print(f"✅ Seed completado: {len(stores)} bodegas, {len(products_data)} productos")
        print(f"   🔑 Bodega 1: roberto@bodega.com / demo123 (Premium)")
        print(f"   🔑 Bodega 2: maria@minimarket.com / demo123 (Basic)")
        print(f"   🔑 Admin:   admin@nexasupply.store / admin123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
