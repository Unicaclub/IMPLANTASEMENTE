# Copalite — Known Limitations

> Atualizado em v1.1.0 (2026-03-22)

## Resolvidos na v1.1.0

1. ~~**Sem refresh token**~~ — **RESOLVIDO.** Refresh token com validacao robusta, `accessTokenExpiresAt` na resposta, proactive refresh no frontend.

2. ~~**Sem error boundary global no frontend**~~ — **RESOLVIDO.** `AppError` class, `toUserMessage()` helper, componentes `error.tsx` nas rotas principais.

3. ~~**Pagination DTO existe mas nao integrado**~~ — **RESOLVIDO.** Helpers `skip/take`, `parseListResponse` no API client, `PaginationQueryDto` passado nos controllers.

4. ~~**activity_history e notifications sao modulos passivos**~~ — **RESOLVIDO.** Activity history dispara automaticamente em create workspace/project, start/advance run, approve backlog. Notificacoes disparam em run_started/completed/failed e task_created.

7. ~~**Sem testes automatizados**~~ — **PARCIALMENTE RESOLVIDO.** 4 testes unitarios (2 suites: pagination + auth). Cobertura basica, mas nao e2e completo ainda.

8. ~~**as any casts**~~ — **RESOLVIDO.** Todos os `'active' as any` substituidos por `StatusBase.ACTIVE`. Repositories tipados. Casts desnecessarios removidos.

## Ainda Pendentes

5. **Registries e evidence retornam array vazio** — Tabelas e endpoints funcionam, mas conteudo so sera populado quando agentes AI forem integrados para execucao real.

6. **Sem soft delete** — Todas as delecoes sao hard delete. Sem audit trail de remocoes.

9. **Sem WebSocket para atualizacao real-time** — Orchestration mostra status ao carregar a pagina, mas nao atualiza automaticamente. User precisa recarregar.

10. **setup.sh com permissao 644** — Precisa rodar com `bash setup.sh` ou fazer `chmod +x setup.sh` antes.

11. **Sem skeleton loading no frontend** — Paginas usam spinner generico (Loader2). Sem skeletons para listas/cards.

12. **Sem toast notifications** — Erros e confirmacoes usam `alert()` nativo do browser.

13. **Validacao de forms manual** — Validacao client-side feita com `if (!form.name)`. Sem biblioteca de validacao.
