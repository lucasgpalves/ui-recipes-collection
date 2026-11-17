# Módulos e pendências — Interface

Estado da UI em relação aos requisitos de tela. Capacidade da API correspondente: consultar `../api-recipes-collection/docs/` (não repetida aqui).

Índice de cobertura UI × API V2: [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md).

---

## Matriz de módulos

| Módulo UI | Status | Observação |
|-----------|--------|------------|
| Área pública (home, busca, categorias, detalhe) | Feito | Média pública; TASTER CRUD no detalhe ([FN-UI-TASTER](12-fn-ui-taster.md)); PDF fora do demo |
| Login / sessão / guards ADMIN e COOK | Feito | Cookie HttpOnly + `/auth/me`; clear 401/403 ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)) |
| Admin — usuários | Feito | Credenciais `POST /auth/register`; reativar `PUT /users/reactivate/{id}` ([FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md)) |
| Admin — categorias | Feito | CRUD |
| Admin — papéis | Feito | CRUD; depende de `id` na resposta para editar/excluir |
| Admin — metas | Feito | CRUD + painel GoalProgress na edição |
| Admin — restaurantes | Feito (demo) | CRUD; `id` no demo (API pode omitir) |
| Admin — referências de emprego | Feito (demo) | Hub no perfil COOK ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)); rotas globais como atalho |
| Cook — receitas (list / create / edit) | Feito | Prévia + ingredientes + medidas; sidebar só “Receitas” ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)) |
| Cook — imagem de receita | Feito | [FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md); sem suite automatizada de upload |
| Cook — ciclo V2 (delete / lock / toasts) | Não iniciado | [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md) |
| Cook — CRUD de medidas/ingredientes avulso | Não iniciado | Medidas embutidas no form de receita |
| Editor — livros / ingredientes / fila | Feito | [FN-UI-EDITOR](11-fn-ui-editor.md); demo `editor/editor` |
| Taster — reviews | Feito | [FN-UI-TASTER](12-fn-ui-taster.md); form no detalhe público (sem `/taster/*`) |
| Logs / auditoria UI | Fora de escopo | Alinhado a API V2 ([RN-LOG](../../api-recipes-collection/docs/versao-2/RN-logs.md)) |

---

## Corte aprovado — `FN-UI-API-FETCH`

Requisitos aprovados em [07-fn-ui-api-fetch.md](07-fn-ui-api-fetch.md). **Implementação coberta** (RF-UI-API-01…22 / AC-01…13).

- **Feito:** (A) API real wired + clear 401/403 + defaults Docker `VITE_USE_DEMO_API=false`; (B) `POST /auth/register` nas credenciais admin; (C) UI GoalProgress (`GoalProgressPanel` + `GET /goals/{id}/progress`).

---

## Cortes aprovados — cobertura V2

| ID | Doc | Resumo |
|----|-----|--------|
| `FN-UI-V2-COVERAGE` | [09](09-fn-ui-v2-coverage.md) | Matriz domínio API V2 → FN-UI filho |
| `FN-UI-COOK-RECIPE-LIFECYCLE` | [10](10-fn-ui-cook-recipe-lifecycle.md) | Delete rascunho, lock pós-publicação, toasts 422/409 (não iniciado) |
| `FN-UI-EDITOR` | [11](11-fn-ui-editor.md) | `/editor/*` — ingredientes, livros, fila editorial (**feito**) |
| `FN-UI-TASTER` | [12](12-fn-ui-taster.md) | Review no detalhe público (**feito**) |
| `FN-UI-ADMIN-USER-ACCESS` | [13](13-fn-ui-admin-user-access.md) | Reativar usuário (`PUT /users/reactivate/{id}`) (não iniciado) |
| `FN-UI-RECIPE-IMAGE` | [14](14-fn-ui-recipe-image.md) | Upload/remoção de imagem em rascunho; `imageUrl` na vitrine (**feito**) |

---

## Pendências priorizadas (UI)

### P1 — Fechar admin de usuários

1. ~~**Credenciais de acesso** — `POST /auth/register` ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)).~~
2. ~~**Reativar usuário** — [FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md).~~
3. **`id` estável na API** — sem `id` em listagem/detalhe, edição e exclusão quebram fora do demo (ajuste na API; UI já consome quando presente; aberto na spec, não bloqueante).
4. Polimentos opcionais:
   - CPF imutável na edição
   - Filtro/busca na listagem (nome, papel, situação)
   - Campos condicionais por papel (`fantasyName` / `restaurantName`)

### P2 — Cook

1. Amarrar `userId` do payload ao ator autenticado — requisito em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (RF-UI-API-16).
2. ~~Imagem de receita — [FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md).~~
3. Ciclo V2: exclusão de rascunho + form locked se publicada + toasts — [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md).
4. CRUD explícito de ingredientes/medidas fora do formulário de receita (se produto exigir).
5. Toggle `isPublished` / publish avulso de receita — **fora de escopo** (publicação via livro na API).

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

1. ~~**EDITOR** — [FN-UI-EDITOR](11-fn-ui-editor.md): shell `/editor/*` + livros + fluxo de ingredientes (approve / aliases / merge) + fila `GET /recipes/editorial`.~~
2. ~~**TASTER** — [FN-UI-TASTER](12-fn-ui-taster.md): criar/editar/excluir review na receita publicada.~~

### P4 — Metas

1. ~~Bloco de **progresso** (`GET /goals/{id}/progress`) na edição de meta — [FN-UI-API-FETCH](07-fn-ui-api-fetch.md).~~

---

## Alinhamento com a API

| Tema | Onde consultar na API |
|------|------------------------|
| Endpoints e comportamento v1 | `docs/02-funcionalidades-atuais.md` |
| Matriz de papéis HTTP | `docs/03-papeis-e-permissoes.md` |
| Ownership, ciclo de receita, reviews, livros, ingredientes, metas, terminate, job refs | `docs/versao-2/` |
| Rastreio UI × V2 | [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) |

Quando uma pendência de UI depender de contrato ainda incompleto na API (ex.: `id` no DTO, persistência de `restaurantName`), a correção pode ser **só API**, **só UI** ou **ambos** — registrar a decisão no PR correspondente, sem misturar RNs nos dois `docs/` sem necessidade.
