# Changelog

Todas as mudancas notaveis do projeto Copalite serao documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.1.0] — 2026-03-22

### Hardening Release — Prioridade 1 + 2 (10 itens)

Fortalecimento da base v1.0.0 antes de crescer funcionalmente. Sem features novas — apenas robustez, rastreabilidade e qualidade.

### Adicionado

- **Refresh token hardening** — Validacao robusta do refresh token, `accessTokenExpiresAt` na resposta de login
- **Error boundaries no frontend** — Classe `AppError`, helper `toUserMessage()`, componentes `error.tsx` em rotas principais
- **Paginacao robusta** — Helpers `skip/take`, `parseListResponse` no API client, `PaginationQueryDto` nos controllers
- **Testes automatizados** — `pagination.spec.ts` (2 testes) + `auth.service.spec.ts` (2 testes) — 4 testes, 2 suites
- **Activity history automatica** — Disparo automatico ao criar workspace, projeto, iniciar/avancar run, aprovar backlog
- **Notificacoes automaticas** — Eventos `run_started`, `run_completed`, `run_failed`, `task_created` disparam notificacoes
- **Health check endpoint** — `GET /health` na raiz (fora do prefixo `api/v1`), delega para `liveCheck()`
- **Request logging interceptor** — Loga `METHOD /url STATUS ms` para toda requisicao HTTP
- **All exceptions filter** — Captura excecoes nao tratadas, 4xx→warn, 5xx→error com stack trace
- **Logger estruturado** — `console.log` substituido por `Logger('Bootstrap')` no `main.ts`

### Corrigido

- **Type safety** — Eliminados todos os `'active' as any` → `StatusBase.ACTIVE` (guard + orchestration)
- **Typed repositories** — `getRepository('projects')` string → `getRepository(ProjectEntity)` com tipagem completa
- **Nullable returns** — `null as unknown as Entity` → return type `| null` no activity-history.service
- **Casts desnecessarios** — Removidos `as RunType` redundantes no orchestration.service
- **Import nao utilizado** — `AgentType` removido do orchestration.service
- **User typing** — `user as any` → `Omit<UserEntity, 'passwordHash'>` no users.controller

### Seguranca

- Revisao de Helmet, ThrottlerModule, JWT guard global
- Validacao de refresh token contra user inativo
- Global exception filter previne vazamento de stack traces em producao

### Infraestrutura

- 6 arquivos novos, 26 modificados
- 949 insercoes, 247 delecoes
- Build backend limpo, build frontend limpo
- 4 testes unitarios passando (2 suites)

---

## [1.0.0] — 2026-03-22

### Release Inicial

Plataforma de software discovery com 9 agentes de IA especializados.

### Adicionado

- 30 modulos NestJS organizados por dominio
- 33 entidades TypeORM espelhando PostgreSQL 15
- 123 rotas REST com prefixo `/api/v1`
- JWT global + `@Public()` para rotas abertas
- Swagger em `/api/docs`
- 9 agentes seeded (orchestrator, architect, database_builder, backend_builder, frontend_builder, validator, doc_writer, devops_agent, qa_test_agent)
- 10 paginas Next.js 14 (App Router)
- Design system coal/emerald dark theme com Tailwind CSS
- API client com 31 endpoints mapeados
- Sidebar dinamica por contexto de projeto
- Orchestration engine com pessimistic lock
- Human gate para aprovacao de backlog
- Docker Compose para PostgreSQL

### Corrigido

- ProjectAccessGuard corrigido (nao usa mais params.id como projectId)
- Human gate enforced (POST /tasks removido, criacao so via from-backlog)
- Concorrencia orchestration (pessimistic_write lock no advanceStep)
- Dashboard workspace navigation (cards clicaveis, modal criacao)

### Seguranca

- bcrypt salt 12
- Helmet ativo (headers de seguranca)
- Throttler ativo (100 req/min global, 5 req/min login)

Ver [RELEASE_NOTES_V1.md](copalite-backend/RELEASE_NOTES_V1.md) para detalhes completos.
Ver [KNOWN_LIMITATIONS.md](copalite-backend/KNOWN_LIMITATIONS.md) para gaps documentados.
