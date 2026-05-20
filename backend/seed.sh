#!/usr/bin/env bash
set -e

echo "🧹 Limpiando tablas y recreando seed..."
cd "$(dirname "$0")"
source venv/bin/activate
python -m app.seed
echo "✅ Base de datos lista."
