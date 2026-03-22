# Copalite v1.0.0 — Release Notes

**Data:** 22 marco 2026
**Tag:** v1.0.0

## O que a v1 entrega

Plataforma de software discovery com 9 agentes de IA especializados, orchestration engine com pessimistic lock, human gate para aprovacao de backlog, 30 modulos backend e 10 paginas frontend.

### Backend
- 30 modulos NestJS organizados por dominio
- 33 entidades TypeORM espelhando PostgreSQL 15
- 123 rotas REST com prefixo /api/v1
- JWT global + @Public() para rotas abertas
- Swagger em /api/docs
- 9 agentes seeded (orchestrator, architect, database_builder, backend_builder, frontend_builder, validator, doc_writer, devops_agent, qa_test_agent)

### Frontend
- 10 paginas Next.js 14 (App Router)
- Design system coal/emerald dark theme com Tailwind CSS
- API client com 31 endpoints mapeados
- Sidebar dinamica por contexto de projeto
- Modal inline para criacao de workspace e sources

### Stack
- NestJS 10, TypeORM 0.3, PostgreSQL 15
- Next.js 14, Tailwind CSS 3.4, Lucide React
- Docker Compose para PostgreSQL
- bcrypt salt 12, Helmet, Throttler

## Validacoes

| Suite | Resultado |
|-------|-----------|
| Backend e2e (PostgreSQL real) | 18/18 PASS |
| Claude Code e2e (curl) | 15/15 PASS |
| Browser visual | 6/6 PASS (dashboard, workspace, overview, backlog, sources, orchestration) |
| Backend build | 0 errors |
| Frontend build | 0 errors |

## Correcoes aplicadas nesta release

- **ProjectAccessGuard corrigido** — nao usa mais params.id como projectId
- **Human gate enforced** — POST /tasks removido, criacao so via from-backlog com aprovacao
- **Concorrencia orchestration** — pessimistic_write lock no advanceStep
- **Throttler ativo** — 100 req/min global, 5 req/min no login
- **Helmet ativo** — headers de seguranca
- **Cache clsx corrigido** — .next limpo, frontend compila sem erro
- **Dashboard workspace navigation** — cards clicaveis, modal criacao, projetos filtrados por workspace
- **Pagina Sources criada** — listagem + modal Add Source

## Status final

Copalite v1.0.0 — release fechada. Pronta para uso interno.

Ver KNOWN_LIMITATIONS.md para gaps documentados.
Ver RUNBOOK_LOCAL.md para setup.
