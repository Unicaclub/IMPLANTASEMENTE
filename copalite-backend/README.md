# Copalite Backend — v1

## O que é
Backend NestJS da plataforma Copalite — sistema de discovery, mapeamento técnico e validação de software existente com agentes de IA.

## Stack
- **Runtime:** Node.js 18+
- **Framework:** NestJS 10
- **Linguagem:** TypeScript 5
- **Banco:** PostgreSQL 15+
- **ORM:** TypeORM
- **Auth:** JWT (Passport)
- **Validação:** class-validator + class-transformer
- **Docs:** Swagger (OpenAPI)

## Estrutura

```
src/
├── main.ts                    # Entry point + Swagger + GlobalPipes
├── app.module.ts              # Root module (28 modules importados)
├── config/                    # Configurações
├── common/
│   ├── enums/                 # Enums compartilhados (espelho do PostgreSQL)
│   ├── decorators/            # @CurrentUser, @Public
│   ├── guards/                # JwtAuthGuard, WorkspaceMemberGuard
│   └── interfaces/            # JwtPayload
├── database/
│   ├── database.module.ts     # TypeORM async config
│   └── typeorm.config.ts      # DataSource para CLI
└── modules/
    ├── auth/                  # Login, JWT
    ├── users/                 # Cadastro de usuários
    ├── workspaces/            # Workspaces + membros
    ├── projects/              # Projetos por workspace
    ├── sources/               # Fontes analisáveis
    ├── documents/             # Docs + versionamento
    ├── decisions/             # Decisões técnicas
    ├── agents/                # 9 agentes oficiais
    ├── prompts/               # Prompts versionados por agente
    ├── runs/                  # Runs + steps (coração operacional)
    ├── agent-runs/            # Execução de agente dentro de run
    ├── agent-outputs/         # Saídas estruturadas
    ├── modules-registry/      # Módulos descobertos
    ├── route-registry/        # Rotas frontend/backend
    ├── api-registry/          # Endpoints de API
    ├── schema-registry/       # Entidades + campos
    ├── ui-registry/           # Telas + ações
    ├── codebase-map/          # Mapa de artefatos
    ├── evidence-registry/     # Evidências (diferencial da plataforma)
    ├── comparisons/           # Comparações + diffs
    ├── backlog/               # Backlog com gate humano
    ├── tasks/                 # Tasks (só nascem após aprovação)
    ├── audits/                # Auditorias
    ├── reports/               # Relatórios
    ├── logs/                  # Logs técnicos
    ├── notifications/         # Notificações
    ├── system-health/         # Health check
    └── activity-history/      # Histórico de atividade
```

## Setup para Claude Code

### 1. Clonar e instalar

```bash
cd copalite-backend
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL
```

### 3. Criar banco e rodar migrations

```bash
# Criar o banco
psql -U postgres -c "CREATE DATABASE copalite_db;"
psql -U postgres -c "CREATE USER copalite WITH PASSWORD 'copalite_dev_2024';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE copalite_db TO copalite;"

# Rodar migrations na ordem
psql -U copalite -d copalite_db -f migrations/001_extensions_and_enums.sql
psql -U copalite -d copalite_db -f migrations/002_identity_and_context.sql
psql -U copalite -d copalite_db -f migrations/003_sources_and_docs.sql
psql -U copalite -d copalite_db -f migrations/004_agents_and_execution.sql
psql -U copalite -d copalite_db -f migrations/005_registries.sql
psql -U copalite -d copalite_db -f migrations/006_comparison_and_action.sql
psql -U copalite -d copalite_db -f migrations/007_governance_and_tracking.sql
psql -U copalite -d copalite_db -f migrations/008_indexes.sql

# Seed dos agentes oficiais
psql -U copalite -d copalite_db -f migrations/seed_001_agents.sql
```

### 4. Rodar o servidor

```bash
npm run start:dev
```

### 5. Acessar

- **API:** http://localhost:3000/api/v1
- **Swagger:** http://localhost:3000/api/docs

## Migrations

| Arquivo | Conteúdo |
|---------|----------|
| 001 | pgcrypto + 24 ENUMs |
| 002 | users, workspaces, workspace_members, projects |
| 003 | sources, documents, document_versions, decisions |
| 004 | agents, prompts, runs, run_steps, agent_runs, agent_outputs |
| 005 | 9 tabelas de registry (modules, routes, api, schema, fields, ui, actions, codebase, evidence) |
| 006 | comparisons, diffs, backlog_items, tasks |
| 007 | audits, reports, logs, notifications, system_health, activity_history |
| 008 | 40+ índices |
| seed_001 | 9 agentes oficiais |

**Total: 33 tabelas, 24 ENUMs, 40+ índices**

## Endpoints v1 (ordem de implementação)

### Bloco 1 — Auth
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Bloco 2 — Users
- `POST /api/v1/users`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`

### Bloco 3 — Workspaces
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces`
- `GET /api/v1/workspaces/:id`
- `PATCH /api/v1/workspaces/:id`
- `GET /api/v1/workspaces/:id/members`
- `POST /api/v1/workspaces/:id/members`
- `PATCH /api/v1/workspaces/:id/members/:memberId`
- `DELETE /api/v1/workspaces/:id/members/:memberId`

### Bloco 4 — Projects
- `POST /api/v1/projects`
- `GET /api/v1/projects?workspaceId=`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`

### Bloco 5 — Sources
- CRUD padrão por projectId

### Bloco 6 — Documents
- CRUD + versionamento (`GET/POST /:id/versions`)

### Bloco 7 — Agents & Prompts
- CRUD padrão

### Bloco 8 — Runs (coração)
- `POST /api/v1/runs`
- `GET /api/v1/runs?projectId=`
- `PATCH /api/v1/runs/:id/status`
- `POST/GET /api/v1/runs/:id/steps`

### Bloco 9 — Agent Runs & Outputs
- CRUD + validação de output

### Bloco 10 — Registries
- CRUD por projectId para cada: modules, routes, api, schema (+fields), ui (+actions), codebase, evidence

### Bloco 11 — Comparisons & Diffs
- `POST /api/v1/comparisons` + `POST /:id/diffs`

### Bloco 12 — Backlog (gate humano)
- CRUD + `PATCH /:id/approve`

### Bloco 13 — Tasks
- `POST /api/v1/tasks`
- `POST /api/v1/tasks/from-backlog` ← **só funciona se approved_for_task = true**
- CRUD padrão

### Bloco 14 — Governance
- Audits, Reports, Logs, Notifications, System Health, Activity History

## Regras de negócio implementadas

1. **Gate humano no backlog:** Task só nasce se `approved_for_task = true`
2. **Validação mínima:** Backlog precisa de descrição ≥ 10 chars para aprovação
3. **Auto-membership:** Owner vira membro automaticamente ao criar workspace
4. **Timestamps automáticos:** `startedAt`/`finishedAt` em runs/agent-runs preenchidos por status
5. **Slug unique por contexto:** projeto unique por workspace, doc unique por projeto
6. **Prompts auto-versioned:** versão incrementa automaticamente por agente+nome
7. **JWT global:** todas as rotas protegidas exceto `@Public()`
8. **Password hash:** bcrypt com salt rounds = 12

## Próximos passos (Fase 2)

- [ ] Roles e permissions granulares
- [ ] Refresh token
- [ ] Integrations e source_sync_jobs
- [ ] Secret manager real
- [ ] Comments em backlog/tasks
- [ ] Report templates
- [ ] WebSocket para runs em tempo real
- [ ] Particionamento de logs
- [ ] Full-text search em documents
