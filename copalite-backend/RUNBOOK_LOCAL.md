# Copalite v1.0.0 — Runbook Local

## Pre-requisitos

- Docker Desktop rodando
- Node.js 18+
- npm

## Setup

### 1. Subir banco

```bash
cd copalite-backend
docker compose up -d
```

### 2. Verificar banco

```bash
docker compose ps
```

Deve mostrar `copalite-db ... (healthy)`.

### 3. Configurar ambiente

```bash
cp .env.example .env
```

### 4. Instalar e buildar backend

```bash
npm install
npm run build
```

### 5. Iniciar backend

```bash
npm run start:dev
```

Porta 3000. Verificar: abrir http://localhost:3000/api/docs

### 6. Instalar e iniciar frontend

```bash
cd copalite-frontend
npm install
npm run dev
```

Porta 3001.

### 7. Criar primeiro usuario

```bash
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin","email":"admin@copalite.io","password":"copalite2024"}'
```

### 8. Acessar

Abrir http://localhost:3001 e fazer login com:
- Email: admin@copalite.io
- Senha: copalite2024

### 9. Fluxo principal

1. Criar workspace (botao "+ New Workspace" no dashboard)
2. Criar projeto dentro do workspace
3. Adicionar source (pagina Sources do projeto)
4. Iniciar pipeline discovery (pagina Orchestration → Start Pipeline)
5. Avancar steps do pipeline
6. Verificar backlog → aprovar items → criar tasks

### 10. Reset banco

Se precisar comecar do zero:

```bash
cd copalite-backend
docker compose down -v
docker compose up -d
```

Isso apaga todos os dados e recria tabelas + seeds (9 agentes).

## Troubleshooting

### Porta 5432 em uso

Outro projeto pode estar usando a porta. Mudar para 5433:

1. `docker-compose.yml`: mudar ports para `'5433:5432'`
2. `.env`: mudar `DB_PORT=5433`
3. `docker compose down && docker compose up -d`

### Erro clsx no frontend

```bash
cd copalite-frontend
rm -rf .next
npm run dev
```

### Token expirado

Fazer login novamente. Token JWT dura 24h.

### Container nao sobe

```bash
docker compose down
docker compose up -d
docker compose logs postgres
```

### Migrations nao rodaram

As migrations rodam automaticamente pelo Docker (volume montado em /docker-entrypoint-initdb.d). Se o volume ja existia, elas NAO re-executam. Para forcar:

```bash
docker compose down -v
docker compose up -d
```

## Portas

| Servico | Porta |
|---------|-------|
| PostgreSQL | 5432 (ou 5433 se configurado) |
| Backend | 3000 |
| Frontend | 3001 |
| Swagger | 3000/api/docs |
