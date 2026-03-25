#!/bin/bash
set -e

# ============================================
# COPALITE — Deploy Script para VPS
# ============================================
# Uso: ./scripts/deploy.sh
# Pre-requisito: .env.production preenchido
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ============================================
# 1. Verificar pre-requisitos
# ============================================
log "Verificando pre-requisitos..."

[ -f .env.production ] || fail ".env.production nao encontrado"
source .env.production

[ -n "$DOMAIN" ] && [ "$DOMAIN" != "TROCAR_PELO_DOMINIO" ] || fail "DOMAIN nao configurado em .env.production"
[ -n "$DB_PASSWORD" ] && [ "$DB_PASSWORD" != "TROCAR_SENHA_FORTE_AQUI" ] || fail "DB_PASSWORD nao configurado"
[ -n "$JWT_SECRET" ] || fail "JWT_SECRET nao configurado"
[ -n "$JWT_REFRESH_SECRET" ] || fail "JWT_REFRESH_SECRET nao configurado"
[ "$JWT_SECRET" != "$JWT_REFRESH_SECRET" ] || fail "JWT_SECRET e JWT_REFRESH_SECRET sao iguais"
[ -n "$CERTBOT_EMAIL" ] && [ "$CERTBOT_EMAIL" != "TROCAR_EMAIL_AQUI" ] || fail "CERTBOT_EMAIL nao configurado"

command -v docker >/dev/null 2>&1 || fail "Docker nao instalado"
command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || fail "Docker Compose nao instalado"

log "Pre-requisitos OK"

# ============================================
# 2. Substituir dominio no nginx
# ============================================
log "Configurando nginx para dominio: $DOMAIN"

sed -i "s/TROCAR_PELO_DOMINIO/$DOMAIN/g" nginx/nginx.conf
sed -i "s/TROCAR_PELO_DOMINIO/$DOMAIN/g" nginx/nginx.initial.conf

# ============================================
# 3. Criar diretorios
# ============================================
mkdir -p backups

# ============================================
# 4. Copiar .env para docker-compose
# ============================================
cp .env.production .env

# ============================================
# 5. Fase 1 — Subir infra + app com HTTP (para obter cert)
# ============================================
log "Fase 1: Subindo com HTTP para obter certificado SSL..."

# Usar nginx.initial.conf (HTTP only) para primeira subida
cp nginx/nginx.initial.conf nginx/nginx.active.conf
# Temporariamente apontar docker-compose para conf inicial
sed -i 's|nginx.conf:/etc/nginx|nginx.active.conf:/etc/nginx|' docker-compose.prod.yml

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d postgres redis
log "Aguardando banco ficar saudavel..."
sleep 10

docker compose -f docker-compose.prod.yml up -d backend frontend nginx
log "Aguardando backend ficar saudavel..."
sleep 15

# Verificar health
if curl -sf http://localhost/health > /dev/null 2>&1; then
  log "Backend saudavel via HTTP"
else
  warn "Backend nao respondeu no health check — continuando..."
fi

# ============================================
# 6. Obter certificado Let's Encrypt
# ============================================
log "Obtendo certificado SSL via Let's Encrypt..."

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

if [ $? -eq 0 ]; then
  log "Certificado SSL obtido com sucesso"
else
  fail "Falha ao obter certificado SSL. Verifique se o dominio aponta para este servidor."
fi

# ============================================
# 7. Fase 2 — Trocar para HTTPS
# ============================================
log "Fase 2: Ativando HTTPS..."

# Restaurar nginx.conf original (com HTTPS)
sed -i 's|nginx.active.conf:/etc/nginx|nginx.conf:/etc/nginx|' docker-compose.prod.yml

# Reiniciar nginx com SSL
docker compose -f docker-compose.prod.yml restart nginx
sleep 5

# Verificar HTTPS
if curl -sf https://$DOMAIN/health > /dev/null 2>&1; then
  log "HTTPS funcionando"
else
  warn "HTTPS nao respondeu — verificar certificado e DNS"
fi

# ============================================
# 8. Limpar temporarios
# ============================================
rm -f nginx/nginx.active.conf

# ============================================
# 9. Configurar renovacao automatica do cert
# ============================================
log "Configurando renovacao automatica do certificado..."

CRON_LINE="0 3 * * * cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml restart nginx"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_LINE") | crontab -

# ============================================
# 10. Configurar backup diario
# ============================================
log "Configurando backup diario do banco..."

BACKUP_LINE="0 2 * * * cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml --profile backup run --rm backup"
(crontab -l 2>/dev/null | grep -v "copalite-backup"; echo "$BACKUP_LINE") | crontab -

# ============================================
# RESUMO
# ============================================
echo ""
echo "============================================"
log "DEPLOY CONCLUIDO"
echo "============================================"
echo ""
echo "  Dominio:   https://$DOMAIN"
echo "  Health:    https://$DOMAIN/health"
echo "  API:       https://$DOMAIN/api/v1"
echo "  Frontend:  https://$DOMAIN"
echo ""
echo "  Backup:    diario as 02:00 em ./backups/"
echo "  SSL renew: diario as 03:00 via certbot"
echo ""
echo "  Comandos uteis:"
echo "    docker compose -f docker-compose.prod.yml logs -f backend"
echo "    docker compose -f docker-compose.prod.yml ps"
echo "    docker compose -f docker-compose.prod.yml --profile backup run --rm backup"
echo ""
