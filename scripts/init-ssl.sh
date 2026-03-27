#!/bin/bash
# ============================================
# COPALITE — Initial SSL Certificate Setup
# ============================================
# Run this ONCE on first deploy to obtain Let's Encrypt certificates.
# After this, switch to the full docker-compose.prod.yml.
#
# Usage:
#   1. Copy .env.production.example to .env.production and fill in values
#   2. Run: bash scripts/init-ssl.sh
#   3. After success, start normally: docker compose -f docker-compose.prod.yml --env-file .env.production up -d

set -euo pipefail

ENV_FILE="${1:-.env.production}"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found. Copy .env.production.example and fill in values."
    exit 1
fi

# Load env vars
set -a
source "$ENV_FILE"
set +a

if [ -z "${DOMAIN:-}" ]; then
    echo "ERROR: DOMAIN not set in $ENV_FILE"
    exit 1
fi

if [ -z "${CERTBOT_EMAIL:-}" ]; then
    echo "ERROR: CERTBOT_EMAIL not set in $ENV_FILE"
    exit 1
fi

echo "=== Step 1: Starting services with HTTP-only nginx ==="

# Use the initial config (HTTP only, serves ACME challenge)
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres redis backend frontend

# Temporarily start nginx with initial config for ACME challenge
docker run -d --name copalite-nginx-init \
    --network copalite-net \
    -p 80:80 \
    -e DOMAIN="$DOMAIN" \
    -v "$(pwd)/nginx/nginx.initial.conf:/etc/nginx/nginx.initial.conf.template:ro" \
    -v "certbot_webroot:/var/www/certbot:ro" \
    nginx:alpine \
    /bin/sh -c "envsubst '\$DOMAIN' < /etc/nginx/nginx.initial.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

echo "=== Step 2: Waiting for nginx to be ready ==="
sleep 5

echo "=== Step 3: Requesting certificate from Let's Encrypt ==="
docker run --rm \
    -v "certbot_webroot:/var/www/certbot" \
    -v "certbot_certs:/etc/letsencrypt" \
    certbot/certbot:latest certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "=== Step 4: Cleaning up temporary nginx ==="
docker stop copalite-nginx-init && docker rm copalite-nginx-init

echo "=== Step 5: Starting full stack with HTTPS ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

echo ""
echo "=== SUCCESS ==="
echo "Copalite is running at https://$DOMAIN"
echo ""
echo "To renew certificates later:"
echo "  docker compose -f docker-compose.prod.yml --env-file $ENV_FILE run --rm certbot renew"
echo "  docker compose -f docker-compose.prod.yml --env-file $ENV_FILE exec nginx nginx -s reload"
