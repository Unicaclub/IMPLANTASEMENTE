# Copalite v1.0.0 — Known Limitations

1. **Sem refresh token** — JWT expira em 24h sem renovacao. User precisa fazer login novamente.

2. **Sem error boundary global no frontend** — Se a API falhar, paginas ficam vazias sem feedback visual. Apenas console.error nos catch blocks.

3. **Pagination DTO existe mas nao integrado** — Estrutura de paginacao esta definida mas nenhum controller usa. Todos os list endpoints retornam a lista completa.

4. **activity_history e notifications sao modulos passivos** — CRUD existe e funciona, mas nenhuma acao do sistema dispara automaticamente. Tabelas ficam vazias ate integracao futura.

5. **Registries e evidence retornam array vazio** — Tabelas e endpoints funcionam, mas conteudo so sera populado quando agentes AI forem integrados para execucao real.

6. **Sem soft delete** — Todas as delecoes sao hard delete. Sem audit trail de remocoes.

7. **Sem testes automatizados** — Specs sao scaffolds vazios. Validacao feita via e2e manual (curl + browser).

8. **as any casts** — dashboard.service.ts (6x) e backlog.service.ts (1x) usam 'as any' para comparar status ao inves dos enums importados.

9. **Sem WebSocket para atualizacao real-time** — Orchestration mostra status ao carregar a pagina, mas nao atualiza automaticamente. User precisa recarregar.

10. **setup.sh com permissao 644** — Precisa rodar com `bash setup.sh` ou fazer `chmod +x setup.sh` antes.
