# Copalite v1.4.0 / v1.5.0 / v1.6.0 — Release Notes

**Data:** 22 marco 2026
**Tags:** v1.4.0, v1.5.0, v1.6.0

---

## v1.4.0 — UX Completa (Sprint 2)

### Frontend
- **Create Project modal** no Dashboard com selecao de projectType
- **Source form** aprimorado com campo authMode (none/manual/session/oauth/token_ref)
- **Create Backlog Item** form com type/priority/sourceType
- **Orchestration polling** automatico a cada 5s quando run esta rodando
- **Run details** expandidos com progress/type/status summary
- **Task inline expansion** com botao de mudanca de status (pending -> in_progress -> done)
- **Evidence creation** form com type/content/source info
- **API client** adicionado: notifications e system health methods

---

## v1.5.0 — Pipelines Completos (Sprint 3)

### Backend
- **ComparisonEngineService** (src/modules/llm/comparison-engine.service.ts)
  - Compara registry items (modules, apis, routes, schemas, ui) entre dois runs
  - Cria comparison + diffs records automaticamente
- **PipelineHandlerService** (src/modules/llm/pipeline-handler.service.ts)
  - Audit pipeline: analisa registries, gera findings, cria audit + report
  - Backlog generation: gera backlog items a partir de audit findings (todos com approvedForTask=false)
- **LlmModule** registrado no app.module.ts
- **OrchestrationService** hooks pipeline-specific logic ao completar (comparison, audit, backlog_generation)

---

## v1.6.0 — Observabilidade (Sprint 4)

### Backend
- **Activity History Subscriber** ativo (TypeORM EntitySubscriber)
  - Tracked entities: Workspace, Project, Run, BacklogItem, Task
  - Resolve workspaceId automaticamente via Project lookup
- **System Health** aprimorado:
  - agents count (total/active)
  - lastRun info (id, title, status, type, dates)
  - database connected flag + latency
  - status: healthy/degraded/unhealthy
- **Tasks Service** dispara notification ao criar task

### Frontend
- **Notifications page** (/notifications)
  - Lista com type badges, unread indicator
  - Mark as read individual
- **Sidebar** com link Notifications (Bell icon)

---

## Validacoes

| Suite | v1.4 | v1.5 | v1.6 |
|-------|------|------|------|
| Frontend build | 0 errors | N/A | 0 errors |
| Backend tsc --noEmit | N/A | 0 errors | 0 errors |
| Backend nest build | N/A | 0 errors | N/A |

## Arquivos criados
- `src/modules/llm/comparison-engine.service.ts`
- `src/modules/llm/pipeline-handler.service.ts`
- `src/modules/llm/llm.module.ts`
- `copalite-frontend/src/app/notifications/page.tsx`

## Arquivos modificados
- Dashboard, Sources, Backlog, Orchestration, Runs, Tasks, Evidence pages
- Sidebar, api.ts
- app.module.ts, orchestration.module.ts, orchestration.service.ts
- system-health.service.ts, system-health.module.ts
- tasks.service.ts, tasks.module.ts
- KNOWN_LIMITATIONS.md
