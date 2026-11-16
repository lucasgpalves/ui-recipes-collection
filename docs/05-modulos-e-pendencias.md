# Módulos e pendências — Interface

Estado da UI em relação aos requisitos de tela. Capacidade da API correspondente: consultar `../api-recipes-collection/docs/` (não repetida aqui).

Índice de cobertura UI × API V2: [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md).

---

## Matriz de módulos

| Módulo UI | Status | Observação |
|-----------|--------|------------|
| Área pública (home, busca, categorias, detalhe) | Feito | Reviews só como média; PDF fora do demo |
| Login / sessão / guards ADMIN e COOK | Feito (parcial) | Cookie HttpOnly + `/auth/me` (RF-UI-API-05/06/07 / F-05); clear 403 ainda gap ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)) |
| Admin — usuários | Feito (parcial) | Credenciais: fetch `POST /auth/register` **aprovado**, implementação pendente; reativar: [FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md) |
| Admin — categorias | Feito | CRUD |
| Admin — papéis | Feito | CRUD; depende de `id` na resposta para editar/excluir |
| Admin — metas | Feito (parcial) | CRUD; UI GoalProgress **aprovada**, implementação pendente |
| Admin — restaurantes | Feito (demo) | CRUD; `id` no demo (API pode omitir) |
| Admin — referências de emprego | Feito (demo) | Hub no perfil COOK ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)); rotas globais como atalho |
| Cook — receitas (list / create / edit) | Feito | Prévia + ingredientes + medidas; sidebar só “Receitas” ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)) |
| Cook — ciclo V2 (delete / lock / toasts) | Não iniciado | [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md) |
| Cook — CRUD de medidas/ingredientes avulso | Não iniciado | Medidas embutidas no form de receita |
| Editor — livros / ingredientes / fila | Não iniciado | [FN-UI-EDITOR](11-fn-ui-editor.md) |
| Taster — reviews | Não iniciado | [FN-UI-TASTER](12-fn-ui-taster.md); média já na vitrine |
| Logs / auditoria UI | Fora de escopo | Alinhado a API V2 ([RN-LOG](../../api-recipes-collection/docs/versao-2/RN-logs.md)) |

---

## Corte aprovado — `FN-UI-API-FETCH`

Requisitos aprovados em [07-fn-ui-api-fetch.md](07-fn-ui-api-fetch.md). **Implementação parcial.**

- **Feito:** RF-UI-API-01 — com `VITE_USE_DEMO_API=false`, facades wired usam `apiRequest` (não `demoApi`); AC-05 coberto por testes. RF-UI-API-02 — `VITE_API_BASE_URL` obrigatório; URLs `{apiBaseUrl}{path}`; AC-09 coberto por testes. RF-UI-API-03 — proxy Vite. RF-UI-API-04 — cookie `credentials: 'include'` (sem JWT em `sessionStorage` na API real); RNF-UI-API-02 coberto por testes. RF-UI-API-05 — login atualiza auth pela identidade do JSON (F-05); AC-01 coberto por testes. RF-UI-API-06 — restauração no boot via `GET /auth/me`; AC-02 coberto por testes. RF-UI-API-07 — logout `POST /auth/logout` + limpa estado local.
- **Pendente:** restante de (A) (RF-UI-API-11 clear 401/403; Docker demo=false); (B) `POST /auth/register`; (C) UI GoalProgress.

---

## Cortes aprovados — cobertura V2 (implementação não iniciada)

| ID | Doc | Resumo |
|----|-----|--------|
| `FN-UI-V2-COVERAGE` | [09](09-fn-ui-v2-coverage.md) | Matriz domínio API V2 → FN-UI filho |
| `FN-UI-COOK-RECIPE-LIFECYCLE` | [10](10-fn-ui-cook-recipe-lifecycle.md) | Delete rascunho, lock pós-publicação, toasts 422/409 |
| `FN-UI-EDITOR` | [11](11-fn-ui-editor.md) | `/editor/*` — ingredientes, livros, fila editorial |
| `FN-UI-TASTER` | [12](12-fn-ui-taster.md) | Review no detalhe público |
| `FN-UI-ADMIN-USER-ACCESS` | [13](13-fn-ui-admin-user-access.md) | Reativar usuário (`PUT /users/reactivate/{id}`) |

---

## Pendências priorizadas (UI)

### P1 — Fechar admin de usuários

1. **Credenciais de acesso** — tela desenhada; fetch `POST /auth/register` no corte [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente).
2. **Reativar usuário** — [FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md) (terminate ↔ reactivate; register **não** reespecificado aqui).
3. **`id` estável na API** — sem `id` em listagem/detalhe, edição e exclusão quebram fora do demo (ajuste na API; UI já consome quando presente; aberto na spec, não bloqueante).
4. Polimentos opcionais:
   - CPF imutável na edição
   - Filtro/busca na listagem (nome, papel, situação)
   - Campos condicionais por papel (`fantasyName` / `restaurantName`)

### P2 — Cook

1. Amarrar `userId` do payload ao ator autenticado — requisito em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (RF-UI-API-16).
2. Ciclo V2: exclusão de rascunho + form locked se publicada + toasts — [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md).
3. CRUD explícito de ingredientes/medidas fora do formulário de receita (se produto exigir).
4. Toggle `isPublished` / publish avulso de receita — **fora de escopo** (publicação via livro na API).

### P2.4 — Sidebar object-only (`FN-UI-NAV-SIDEBAR-OBJECT`) — feito na UI

1. ~~Remover submenu Listagem/Cadastro da sidebar Admin e Cook~~
2. ~~Um item navegável por domínio (nome do objeto → listagem)~~
3. ~~Create/edit permanecem páginas full-page acessíveis pelos CTAs da listagem~~

Ver [08-fn-ui-nav-sidebar-object.md](08-fn-ui-nav-sidebar-object.md).

### P2.5 — Hub perfil COOK (`FN-UI-COOK-PROFILE`) — feito na UI

1. ~~Seção **Experiência profissional** no perfil do COOK~~
2. ~~Criar/editar/remover referência a partir do perfil (`userId` implícito); restaurante como apoio~~
3. Leitura atual: `GET /references?userId=` (ou filtro local no demo). Embed em `UserResponse` ainda evolutivo na API — ver [06-perfil-cook-contexto.md](06-perfil-cook-contexto.md).
4. ~~Sidebar sem item raiz “Referências”~~

### P3 — Novos painéis / atores V2

1. **EDITOR** — [FN-UI-EDITOR](11-fn-ui-editor.md): shell `/editor/*` + livros + fluxo de ingredientes (approve / aliases / merge) + fila `GET /recipes/editorial`.
2. **TASTER** — [FN-UI-TASTER](12-fn-ui-taster.md): criar/editar/excluir review na receita publicada.

### P4 — Metas

1. Tela ou bloco de **progresso** (`GET /goals/{id}/progress`) por usuário/mês — no corte [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente).

---

## Alinhamento com a API

| Tema | Onde consultar na API |
|------|------------------------|
| Endpoints e comportamento v1 | `docs/02-funcionalidades-atuais.md` |
| Matriz de papéis HTTP | `docs/03-papeis-e-permissoes.md` |
| Ownership, ciclo de receita, reviews, livros, ingredientes, metas, terminate, job refs | `docs/versao-2/` |
| Rastreio UI × V2 | [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) |

Quando uma pendência de UI depender de contrato ainda incompleto na API (ex.: `id` no DTO, persistência de `restaurantName`), a correção pode ser **só API**, **só UI** ou **ambos** — registrar a decisão no PR correspondente, sem misturar RNs nos dois `docs/` sem necessidade.
