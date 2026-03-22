---
description: Setup completo do projeto Copalite
---

Execute o setup completo:
1. docker compose up -d
2. Aguardar container healthy: docker compose ps
3. npm install
4. cp .env.example .env (se não existir)
5. npm run build
6. npm run start:dev
Confirme URL do Swagger e número de rotas.
