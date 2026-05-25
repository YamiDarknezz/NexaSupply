#!/bin/bash
# wait-for-db.sh — Espera a que PostgreSQL esté listo y ejecuta seed
set -e
echo "⏳ Esperando a PostgreSQL..."
until pg_isready -h db -U nexasupply -d nexasupply 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL listo. Ejecutando seed..."
python -m app.seed
echo "🚀 Iniciando API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
