# Funcionalidade — Painel EDITOR (livros, ingredientes, fila editorial)

**ID:** `FN-UI-EDITOR`  
**Status:** requisitos **aprovados** (implementação não iniciada)  
**Versão:** 1.0  
**Domínio API relacionado:** [RN-ingredientes](../../api-recipes-collection/docs/versao-2/RN-ingredientes.md), [RN-publicacao-livro](../../api-recipes-collection/docs/versao-2/RN-publicacao-livro.md), [RN-REC-05](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md), [RN-OWN-04](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md)

Novo painel autenticado `/editor/*` para o papel **EDITOR**: governança de ingredientes, criação/publicação de livros e fila de receitas editoriais. **ADMIN** pode acessar a listagem editorial de receitas conforme a API (`RN-REC-05`).

---

## 1. Feature Overview

1. Shell `EditorLayout` sob `/editor/*` com guard `RequireEditor`.
2. Sidebar **object-only** (mesmo padrão de [FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)): **Ingredientes**, **Livros**, e opcionalmente **Receitas** (fila editorial).
3. Ingredientes: approve / reject / reopen / aliases / merge.
4. Livros: create + publish (`PATCH`) com feedback dos critérios falhos retornados pela API.
5. Receitas editoriais: `GET /recipes/editorial` com filtros.

**Fora do escopo:**

- UI de logs.
- Toggle/`isPublished` avulso de receita no painel COOK.
- Unpublish de livro (API unidirecional — RN-LIV-03).
- Bootstrap ADMIN; painel TASTER (ver [FN-UI-TASTER](12-fn-ui-taster.md)).
- Modais como shell de formulário (create/edit full-page).

---

## 2. Business Context

- EDITOR governa catálogo de ingredientes e publica livros que marcam receitas como publicadas.
- Sem painel dedicado, a V2 fica inacessível na UI para esses atores.
- Navegação deve seguir o padrão object-only já aprovado para Admin/Cook.

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-ED-01** | Existe layout/shell `/editor/*` protegido por `RequireEditor`. |
| **RF-UI-ED-02** | `RequireEditor`: não autenticado → `/login`; autenticado com `role !== 'EDITOR'` → `/` (exceto RF-UI-ED-03). |
| **RF-UI-ED-03** | **ADMIN** autenticado pode acessar a rota de **fila editorial de receitas** (leitura `GET /recipes/editorial`); demais áreas EDITOR (ingredientes mutáveis / livros) permanecem para `EDITOR`, salvo decisão futura explícita. Se a implementação unificar o shell, ADMIN só vê/habilita o que a API autorizar (403 → toast, sem mutação falsa de sucesso). |
| **RF-UI-ED-04** | Pós-login: papel `EDITOR` redireciona para destino do painel (default sugerido: `/editor/ingredientes`). Atualiza RN-UI-AUTH-08 / `homePathForRole`. |
| **RF-UI-ED-05** | Sidebar EDITOR: um item por objeto → listagem — **Ingredientes** → `/editor/ingredientes`; **Livros** → `/editor/livros`; opcional **Receitas** → `/editor/receitas`. Sem submenu Listagem/Cadastro. |
| **RF-UI-ED-06** | Create/edit de livros e fluxos de merge/alias são páginas full-page (ou rotas dedicadas), acessíveis por CTAs da listagem — não via submenu da sidebar. |
| **RF-UI-ED-07** | Listagem de ingredientes (EDITOR) carrega catálogo conforme endpoints de ingredientes da API (inclui `pending`/`rejected`/`approved` visíveis ao EDITOR). |
| **RF-UI-ED-08** | Ações por ingrediente elegível: **Aprovar** → `POST /ingredients/{id}/approve` (rename opcional se a UI expuser campo); **Rejeitar** → `POST /ingredients/{id}/reject`; **Reabrir** → `POST /ingredients/{id}/reopen`. |
| **RF-UI-ED-09** | UI de **aliases** permite manter aliases do ingrediente conforme endpoints de alias da API; erros de colisão (RN-ING-05) → toast a partir da resposta. |
| **RF-UI-ED-10** | UI de **merge**: selecionar source → target; confirmação; chama endpoint de merge; sucesso atualiza listagem; falha → toast error. |
| **RF-UI-ED-11** | Listagem `/editor/receitas` (ou nome equivalente) chama `GET /recipes/editorial` com filtros combináveis: no mínimo `category`, `isRated`, `isPublished`, `userId` ou `chefName`, `q`; opcional `ingredientsStatus=approved`. |
| **RF-UI-ED-12** | COOK/TASTER/anônimo não usam o shell EDITOR; tentativa em `/editor/*` redireciona conforme guard. |
| **RF-UI-ED-13** | Create de livro: formulário com ISBN, título, descrição, seleção de receitas (IDs); submit → `POST /books` (ou endpoint de create documentado); validação local mínima (ISBN/receitas não vazios) + erros API. |
| **RF-UI-ED-14** | Livro rascunho (não publicado): ação **Publicar** chama `PATCH /books/{id}` (publish); sucesso (ex.: 204) → toast success + UI mostra publicado. |
| **RF-UI-ED-15** | Falha de publish (critérios RN-LIV-01): toast/painel de erro exibindo motivos retornados pela API (ISBN, receita sem review, ingrediente não aprovado, etc.) — **sem** reimplementar a lista de critérios na UI além do feedback da API. |
| **RF-UI-ED-16** | Livro já publicado: sem unpublish; segunda publish tratada como no-op/sucesso idempotente se API 204; UI não oferece editar conteúdo publicado além do que a API permitir. |
| **RF-UI-ED-17** | Feedback padrão: falha → toast `error`; validação local → `warning`; sucesso → `success` (alinhado a RN-UI-UX / FN-UI-API-FETCH). |
| **RF-UI-ED-18** | “Ver site” e logout no layout EDITOR comportam-se como nos outros painéis autenticados. |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-ED-01** | Guard e rotas não vazam dados editoriais a papéis sem autorização. |
| **RNF-UI-ED-02** | Sidebar acessível: um link por objeto; estado ativo em sub-rotas do domínio. |
| **RNF-UI-ED-03** | Sem secrets no frontend; sessão conforme [FN-UI-API-FETCH](07-fn-ui-api-fetch.md). |
| **RNF-UI-ED-04** | Mensagens de publish falho devem ser legíveis (scroll/lista se múltiplos motivos). |

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-ED-01** | Painel `/editor/*` é a área UI do papel EDITOR | Destino pós-login EDITOR |
| **RN-UI-ED-02** | Sidebar EDITOR object-only (Ingredientes, Livros, opcional Receitas) | Espelha FN-UI-NAV-SIDEBAR-OBJECT |
| **RN-UI-ED-03** | Ações de status de ingrediente só via endpoints approve/reject/reopen | Domínio: RN-ING-02 |
| **RN-UI-ED-04** | Publish de livro só via ação explícita; critérios vêm da API | Domínio: RN-LIV-01 |
| **RN-UI-ED-05** | ADMIN: acesso UI à fila editorial de receitas; mutações EDITOR seguem autorização API | Domínio: RN-REC-05 |
| — | Merge, aliases, ISBN, is_rated, approved | Ver RNs API — **não duplicar** |

---

## 6. Acceptance Criteria

- [ ] **AC-01** — Login como EDITOR redireciona para o destino do painel editor (não `/`).
- [ ] **AC-02** — `RequireEditor` bloqueia anônimo e papéis ≠ EDITOR nas rotas do shell (salvo fila editorial para ADMIN conforme RF-UI-ED-03).
- [ ] **AC-03** — Sidebar mostra itens objeto → listagens; sem Listagem/Cadastro.
- [ ] **AC-04** — Approve/reject/reopen disparam os POSTs correspondentes e atualizam o status exibido.
- [ ] **AC-05** — Merge com confirmação: sucesso atualiza catálogo; erro mostra toast.
- [ ] **AC-06** — Alias com colisão: UI exibe erro da API (409/422 conforme contrato).
- [ ] **AC-07** — Fila editorial usa `GET /recipes/editorial` e aplica filtros mínimos documentados.
- [ ] **AC-08** — ADMIN autenticado consegue usar a fila editorial autorizada pela API; COOK/TASTER recebem bloqueio de guard ou 403 tratado.
- [ ] **AC-09** — Create livro + publish: sucesso marca UI como publicado; falha de critérios mostra feedback da API.
- [ ] **AC-10** — Não há unpublish na UI.
- [ ] **AC-11** — Mapa de rotas, visão, fluxos e pendências atualizados após implementação verificada.

---

## 7. Edge Cases

| Cenário | Esperado |
|---------|----------|
| Ingrediente já `approved` | Aprovar oculto/desabilitado; reabrir disponível se API permitir |
| Merge source = target | Validação local ou erro API; sem sucesso falso |
| Publish repetido | Idempotente 204 → UI permanece publicada |
| Filtros editoriais vazios | Lista conforme default da API |
| 403 em mutação | Toast error; estado local não mente sucesso |

---

## 8. Out of scope / Suggested routes

**Rotas sugeridas:**

| Rota | Guard | Tela |
|------|-------|------|
| `/editor` | RequireEditor | Redirect → `/editor/ingredientes` |
| `/editor/ingredientes` | RequireEditor | Listagem + ações de status |
| `/editor/ingredientes/:id` (ou `/aliases`, `/merge`) | RequireEditor | Detalhe / aliases / merge |
| `/editor/livros` | RequireEditor | Listagem |
| `/editor/livros/novo` | RequireEditor | Cadastro |
| `/editor/livros/:id` | RequireEditor | Detalhe + Publicar |
| `/editor/receitas` | RequireEditor **ou** ADMIN (fila) | Fila `GET /recipes/editorial` |

**Endpoints (chamadas UI):**  
`GET/POST/PUT` ingredientes conforme API; `POST .../approve|reject|reopen`; merge/aliases; `GET /recipes/editorial`; `POST /books`; `PATCH /books/{id}`; `GET /books`, `GET /books/{id}`.

---

## 9. Traceability

| Fonte | Uso |
|-------|-----|
| [RN-ingredientes.md](../../api-recipes-collection/docs/versao-2/RN-ingredientes.md) | RN-ING-* |
| [RN-publicacao-livro.md](../../api-recipes-collection/docs/versao-2/RN-publicacao-livro.md) | RN-LIV-* |
| [RN-ciclo-receita.md](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md) | RN-REC-05 |
| [RN-autoria-e-ownership.md](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md) | RN-OWN-04 |
| [FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md) | Padrão sidebar |
| [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) | Matriz |
| [01](01-visao-e-escopo.md), [02](02-mapa-de-rotas.md), [03](03-fluxos-de-ui.md), [04](04-regras-de-negocio-ui.md) | Papéis, rotas, RN-UI-AUTH-08 |

Identificador estável para citar em PRs/issues: **`FN-UI-EDITOR`**.
