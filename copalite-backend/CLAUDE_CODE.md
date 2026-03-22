# CLAUDE_CODE.md — Instruções para o Claude Code

## Contexto do Projeto

Este é o backend NestJS da plataforma **Copalite** — um sistema de discovery, mapeamento técnico e validação de software existente usando agentes de IA.

## Arquitetura

- **28 módulos NestJS** organizados por domínio
- **33 entidades TypeORM** espelhando exatamente o PostgreSQL
- **JWT global** — todas as rotas protegidas exceto `@Public()`
- **class-validator** em todos os DTOs
- **Swagger** em `/api/docs`

## Padrão de cada módulo

```
modules/<nome>/
  <nome>.module.ts      → registra entity, service, controller
  <nome>.service.ts     → lógica de negócio
  <nome>.controller.ts  → endpoints REST
  entities/
    <nome>.entity.ts    → TypeORM entity (espelho do SQL)
  dto/
    index.ts            → Create, Update, Query DTOs
```

## Regras que NÃO podem ser quebradas

1. **Task só nasce com backlog aprovado** — `POST /tasks/from-backlog` verifica `approved_for_task = true`
2. **Backlog precisa de descrição ≥ 10 chars** para ser aprovado
3. **Workspace owner não pode ser removido** como membro
4. **Slug unique** por contexto (projeto por workspace, doc por projeto)
5. **Sem credenciais sensíveis** na tabela sources — só `credentials_ref`
6. **Runs controladas** — só 4 tipos: discovery, comparison, audit, backlog_generation

## Enums

Todos os enums estão em `src/common/enums/index.ts` e espelham exatamente os ENUMs do PostgreSQL. Ao adicionar novo valor, altere nos dois lugares.

Campos que ainda são VARCHAR controlado (não enum no banco):
- `projectType` → use `PROJECT_TYPES`
- `documentType` → use `DOCUMENT_TYPES`
- `taskType` → use `TASK_TYPES`
- `auditType` → use `AUDIT_TYPES`

## Como adicionar um novo módulo

```bash
# 1. Criar a migration SQL
# 2. Criar entity em src/modules/<nome>/entities/
# 3. Criar DTOs em src/modules/<nome>/dto/index.ts
# 4. Criar service
# 5. Criar controller
# 6. Criar module
# 7. Importar no app.module.ts
```

## Como rodar

```bash
npm install
docker compose up -d        # PostgreSQL
bash setup.sh               # Migrations + build
npm run start:dev           # Dev server com hot reload
```

## Endpoints que precisam de atenção especial

| Endpoint | Motivo |
|----------|--------|
| `POST /auth/login` | Único `@Public()` junto com `POST /users` |
| `PATCH /backlog/:id/approve` | Gate humano — precisa de userId |
| `POST /tasks/from-backlog` | Verifica aprovação do backlog |
| `PATCH /runs/:id/status` | Auto-preenche startedAt/finishedAt |
| `PATCH /agent-runs/:id/status` | Mesmo comportamento de timestamps |

## Ordem de implementação recomendada para próximas features

1. Middleware de workspace context (extrair workspaceId de headers ou params)
2. Refresh token no auth
3. WebSocket para status de runs em tempo real
4. Filtros avançados nos list endpoints (status, dateRange, pagination)
5. Soft delete global via interceptor
6. Roles e permissions granulares
