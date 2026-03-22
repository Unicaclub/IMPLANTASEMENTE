#!/bin/bash
# ============================================
# COPALITE BACKEND - Setup Script
# Execute com: bash setup.sh
# ============================================

set -e

echo "=== COPALITE BACKEND SETUP ==="
echo ""

# 1. Instalar dependências
echo "[1/5] Instalando dependências..."
npm install

# 2. Copiar .env
if [ ! -f .env ]; then
  echo "[2/5] Criando .env a partir do .env.example..."
  cp .env.example .env
else
  echo "[2/5] .env já existe, pulando..."
fi

# 3. Subir PostgreSQL via Docker
echo "[3/5] Subindo PostgreSQL..."
if command -v docker &> /dev/null; then
  docker compose up -d postgres
  echo "Aguardando PostgreSQL ficar pronto..."
  sleep 5
else
  echo "Docker não encontrado. Certifique-se de que o PostgreSQL está rodando."
  echo "Banco: copalite_db | User: copalite | Senha: copalite_dev_2024"
fi

# 4. Rodar migrations
echo "[4/5] Rodando migrations..."
export PGPASSWORD=copalite_dev_2024

for migration in \
  migrations/001_extensions_and_enums.sql \
  migrations/002_identity_and_context.sql \
  migrations/003_sources_and_docs.sql \
  migrations/004_agents_and_execution.sql \
  migrations/005_registries.sql \
  migrations/006_comparison_and_action.sql \
  migrations/007_governance_and_tracking.sql \
  migrations/008_indexes.sql \
  migrations/seed_001_agents.sql; do
  echo "  Executando $migration..."
  psql -h localhost -U copalite -d copalite_db -f "$migration" -q 2>/dev/null || true
done

unset PGPASSWORD

# 5. Build
echo "[5/5] Compilando projeto..."
npm run build

echo ""
echo "=== SETUP COMPLETO ==="
echo ""
echo "Para iniciar o servidor:"
echo "  npm run start:dev"
echo ""
echo "Swagger UI:"
echo "  http://localhost:3000/api/docs"
echo ""
echo "Primeiro passo:"
echo "  POST /api/v1/users — criar um usuário"
echo "  POST /api/v1/auth/login — fazer login"
echo "  Usar o token JWT no header: Authorization: Bearer <token>"
