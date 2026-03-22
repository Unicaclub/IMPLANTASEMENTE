# Copalite Platform v1.1.0

Plataforma de software discovery, mapeamento tecnico e validacao usando 9 agentes de IA especializados.

## Stack

- **Backend:** NestJS 10, TypeORM, PostgreSQL 15
- **Frontend:** Next.js 14, Tailwind CSS, Lucide React, Recharts
- **Infra:** Docker Compose

## Estrutura

```
copalite-backend/    # API REST (porta 3000)
copalite-frontend/   # UI (porta 3001)
```

## v1.1 Highlights

- Refresh token hardening + error boundaries
- Paginacao robusta + testes automatizados (4 testes, 2 suites)
- Activity history e notificacoes automaticas
- Health check endpoint (`GET /health`)
- Request logging + global exception filter
- Type safety cleanup (zero `as any` em codigo de dominio)

## Quick Start

Ver [RUNBOOK_LOCAL.md](copalite-backend/RUNBOOK_LOCAL.md)

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md)

## Release Notes

Ver [RELEASE_NOTES_V1.md](copalite-backend/RELEASE_NOTES_V1.md)

## Limitacoes Conhecidas

Ver [KNOWN_LIMITATIONS.md](copalite-backend/KNOWN_LIMITATIONS.md)
