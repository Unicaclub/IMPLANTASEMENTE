# Copalite Frontend — v1.1

## Stack
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript 5
- **Estilo:** Tailwind CSS 3.4 (dark theme customizado)
- **Ícones:** Lucide React
- **Charts:** Recharts
- **Fontes:** DM Sans + JetBrains Mono

## Setup

```bash
npm install
npm run dev
# → http://localhost:3001
```

O backend deve estar rodando em `http://localhost:3000`.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login com email/senha |
| `/dashboard` | Workspaces e projetos do usuário |
| `/projects/[id]` | Dashboard do projeto com métricas |
| `/projects/[id]/orchestration` | Pipeline visual com timeline e controles |
| `/projects/[id]/backlog` | Backlog com gate humano (Approve/Reject) |
| `/projects/[id]/tasks` | Tasks criadas a partir do backlog aprovado |
| `/projects/[id]/evidence` | Registry de evidências |
| `/projects/[id]/registries` | Tabs: Modules, Routes, APIs, Schemas, UI |
| `/projects/[id]/runs` | Lista de runs |
| `/projects/[id]/sources` | Fontes do projeto |

## Componentes

| Componente | Função |
|------------|--------|
| `Sidebar` | Navegação principal + navegação por projeto |
| `Header` | Título + subtitle + actions |
| `MetricCard` | Card de métrica reutilizável |
| `StatusBadge` | Badge de status colorido |

## API Client

O arquivo `src/lib/api.ts` contém o client HTTP completo para todos os endpoints do backend, incluindo:
- Auth (login, me, refresh token com renovação proativa)
- CRUD para todos os módulos
- Orchestration (start, advance, cancel, retry, status)
- Dashboard metrics
- Paginação (`parseListResponse`) e error handling (`parseErrorPayload`)

## Error Handling

- `src/lib/errors.ts` — Classe `AppError` + helper `toUserMessage()`
- `error.tsx` em rotas principais — Error boundaries do Next.js com feedback visual
- API client faz proactive token refresh antes da expiração

## Design System

- **Tema:** Dark (coal-950 background)
- **Accent:** Emerald (#10b981)
- **Cards:** `bg-coal-900/80` com `border-coal-800` e `backdrop-blur`
- **Badges:** Coloridos por status (success/warning/danger/info/neutral)
- **Animações:** fade-in, slide-up, pulse-slow
- **Tipografia:** DM Sans (body) + JetBrains Mono (código/slugs)
