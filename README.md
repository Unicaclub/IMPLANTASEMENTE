# Copalite Platform

Plataforma de discovery, mapeamento e validacao de software usando 9 agentes AI especializados.

## Stack
- Backend: NestJS 10 + TypeORM + PostgreSQL 15
- Frontend: Next.js 14 + Tailwind CSS
- AI: Multi-provider (Anthropic Claude, OpenAI GPT, Google Gemini, Ollama)

## Quick Start (Development)

```bash
cd copalite-backend
docker compose up -d
npm install && cp .env.example .env && npm run build && npm run start:dev

cd copalite-frontend
npm install && npm run dev
```

## Production Deploy

```bash
cp .env.production.example .env
# Editar .env com senhas reais e API keys
docker compose -f docker-compose.prod.yml up -d --build
```

## Documentation
- [Release Notes](copalite-backend/RELEASE_NOTES_V1.md)
- [Known Limitations](copalite-backend/KNOWN_LIMITATIONS.md)
- [Local Runbook](copalite-backend/RUNBOOK_LOCAL.md)

## Releases

| Tag | Versao |
|-----|--------|
| v1.0.0 | Plataforma base |
| v1.1.0 | Hardening |
| v1.2.0 | Agentes AI multi-provider |
| v1.3.0 | Agentes populam registries |
| v1.4.0 | UX completa |
| v1.5.0 | Pipelines completos |
| v1.6.0 | Observabilidade |
| v2.0.0 | Production-ready |
