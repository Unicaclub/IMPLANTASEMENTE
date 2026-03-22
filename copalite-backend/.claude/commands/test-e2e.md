---
description: Rodar teste e2e completo do Copalite
---

Execute o fluxo e2e completo via curl contra o backend rodando:
1. POST /users — criar user
2. POST /auth/login — obter token
3. GET /auth/me — verificar perfil
4. POST /workspaces — criar workspace
5. GET /workspaces/:id/members — verificar auto-membership
6. POST /projects — criar projeto
7. POST /sources — criar source
8. GET /agents — verificar 9 agentes
9. POST /orchestration/start — iniciar discovery
10. PATCH /orchestration/:runId/advance — avançar step
11. POST /backlog — criar item
12. PATCH /backlog/:id/approve — aprovar
13. POST /tasks/from-backlog — criar task
14. POST /tasks/from-backlog com item NÃO aprovado — deve falhar
15. GET /dashboard/project/:id — verificar métricas
Reporte quantos passaram de 15.
