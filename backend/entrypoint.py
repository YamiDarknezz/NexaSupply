#!/usr/bin/env python3
"""Entrypoint: espera DB, ejecuta seed, inicia uvicorn."""
import time
import subprocess
import sys
from sqlalchemy import create_engine, text
from app.core.config import get_settings

settings = get_settings()

# Esperar a que PostgreSQL esté listo
print("⏳ Esperando a PostgreSQL...")
for i in range(30):
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        print("✅ PostgreSQL listo")
        break
    except Exception:
        if i < 29:
            time.sleep(1)
        else:
            print("❌ No se pudo conectar a PostgreSQL")
            sys.exit(1)

# Ejecutar seed
print("🌱 Ejecutando seed...")
from app.seed import seed
seed()

# Iniciar uvicorn
print("🚀 Iniciando API...")
subprocess.run([
    "uvicorn", "app.main:app",
    "--host", "0.0.0.0",
    "--port", "8000",
] + sys.argv[1:])
