# Funcionalidade — COOK: ciclo de vida da receita na UI

**ID:** `FN-UI-COOK-RECIPE-LIFECYCLE`  
**Status:** requisitos **aprovados** (implementação não iniciada)  
**Versão:** 1.0  
**Domínio API relacionado:** [RN — Ciclo de vida da receita](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md); ownership [RN-OWN-02](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md)

Estende o painel COOK existente (listagem / detalhe de edição / create) para alinhar a UI a `RN-REC` V2: exclusão de rascunho, bloqueio de edição quando publicada, e feedback de erros 422/409. **Não** introduz toggle de publicação nem ação de publish de receita.

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| Delete | Excluir rascunho próprio via `DELETE /recipes/{id}` com confirmação e tratamento de 409 |
| Lock | Receita publicada: formulário de edição somente leitura / sem submit `PUT` |
| Erros | Mapear 422/409 (unicidade, numéricos, lista vazia de ingredientes, publicada, reviews, livro) para toasts |

**No escopo:** reutilizar rotas `/cook/receitas`, `/cook/receitas/nova`, `/cook/receitas/:id/editar`; estender UX de lista e edição.

**Fora do escopo:**

- Toggle `isPublished` / botão “Publicar receita” (permanece fora de produto UI; publicação de receita ocorre no fluxo de livro na API — ver RN-REC-04 / RN-LIV).
- Painel EDITOR/TASTER; upload de imagem ([FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md)).
- Alterar ownership HTTP (domínio API).
- Redefinir listagem `GET /recipes/mine` / `userId` da sessão ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)).

---

## 2. Business Context

- V2 impede hard delete e PUT em receita publicada; rejeita lista vazia e valores numéricos inválidos; exige unicidade de nome por autor.
- A UI COOK já cria/edita; falta delete alinhado, lock visual pós-publicação e toasts específicos o bastante para o cozinheiro corrigir o formulário.

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-COOK-REC-01** | Na listagem `/cook/receitas`, receitas **não publicadas** com `id` exibem ação **Excluir** (ou equivalente). |
| **RF-UI-COOK-REC-02** | Excluir exige confirmação (diálogo danger); cancelar não chama a API. |
| **RF-UI-COOK-REC-03** | Confirmar exclusão chama `DELETE /recipes/{id}` (API real via `apiRequest` quando demo=false). |
| **RF-UI-COOK-REC-04** | Sucesso do delete → remove/atualiza a lista + toast `success`. |
| **RF-UI-COOK-REC-05** | HTTP **409** no delete → toast `error` com mensagem compreensível (publicada / reviews / vínculo a livro — sem inventar regra; usar corpo/`ApiError` da API quando disponível). |
| **RF-UI-COOK-REC-06** | HTTP **403** no delete → toast `error`; não apresentar a receita como excluída. |
| **RF-UI-COOK-REC-07** | Receitas com `isPublished === true` **não** oferecem ação Excluir na listagem (ou a ação fica desabilitada com indicação clara). |
| **RF-UI-COOK-REC-08** | Em `/cook/receitas/:id/editar`, se a receita carregada está publicada: campos de conteúdo **não editáveis** e controle de submit/`PUT` **ausente ou desabilitado**. |
| **RF-UI-COOK-REC-09** | UI **não** envia `PUT /recipes/{id}` para receita publicada (bloqueio preventivo; alinhado a RN-REC-04). |
| **RF-UI-COOK-REC-10** | Indicador visual de estado publicado vs rascunho na listagem e na tela de edição. |
| **RF-UI-COOK-REC-11** | Em create/update, resposta **422** (validação: porções/tempo/quantidades ≤ 0; lista de ingredientes vazia) → toast `warning` ou `error` com feedback acionável; formulário permanece utilizável. |
| **RF-UI-COOK-REC-12** | Em create/update, resposta **409** de unicidade de nome (RN-REC-03) → toast que indique conflito de nome; formulário permanece utilizável. |
| **RF-UI-COOK-REC-13** | Em update, resposta **409** por receita publicada (se o lock falhar ou estado mudar) → toast `error` e formulário passa a estado locked após refresh/recarga. |
| **RF-UI-COOK-REC-14** | Não há controle de UI para alterar `isPublished` nesta FN. |
| **RF-UI-COOK-REC-15** | Sidebar COOK permanece object-only “Receitas” ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)); create/edit continuam full-page via CTAs. |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-COOK-REC-01** | Feedback de erro não revela dados de outro autor além do que a API já devolve. |
| **RNF-UI-COOK-REC-02** | Comportamento demo vs API real: mesmas regras de UX; persistência conforme modo ativo ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)). |
| **RNF-UI-COOK-REC-03** | Confirmação de exclusão acessível (teclado / foco / rótulos claros). |

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-COOK-REC-01** | Exclusão na UI só é oferecida para rascunho próprio exibido na listagem COOK | Domínio: RN-REC-01, RN-OWN-02 |
| **RN-UI-COOK-REC-02** | Receita publicada = formulário de edição locked; sem PUT | Domínio: RN-REC-04 |
| **RN-UI-COOK-REC-03** | Toasts mapeiam 422/409 de create/update/delete sem ocultar falha | Domínio: RN-REC-02, 03, 06, 01 |
| **RN-UI-COOK-REC-04** | Ausência de toggle de publicação na UI COOK | Decisão de produto UI; API RN-REC-04 / RN-LIV |
| — | Unicidade, hard delete, lista vazia, positivos | **Não duplicar** — ver [RN-ciclo-receita](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md) |

---

## 6. Acceptance Criteria

- [ ] **AC-01** — Rascunho na listagem: confirmar exclusão chama `DELETE /recipes/{id}` e some da lista em sucesso.
- [ ] **AC-02** — Cancelar diálogo de exclusão não chama a API.
- [ ] **AC-03** — Receita publicada: sem exclusão efetiva na UI; tentativa/API 409 mostra toast de erro.
- [ ] **AC-04** — Abrir edição de receita publicada: campos locked e nenhum `PUT` disparado por submit.
- [ ] **AC-05** — Create/update com ingredientes vazios ou numéricos inválidos: UI trata 422 com toast e mantém o formulário.
- [ ] **AC-06** — Conflito de nome (409): toast de unicidade; formulário utilizável.
- [ ] **AC-07** — Nenhum controle `isPublished`/Publicar receita introduzido por esta FN.
- [ ] **AC-08** — Rotas COOK existentes preservadas; sidebar object-only intacta.
- [ ] **AC-09** — Docs de fluxos/rotas/pendências atualizados após implementação verificada.

---

## 7. Edge Cases

| Cenário | Comportamento esperado |
|---------|------------------------|
| Receita sem `id` | Sem exclusão/edição dependente de id (“Sem id” / ação limitada) |
| 409 delete (reviews ou livro) | Toast error; item permanece na lista |
| Estado muda para publicado enquanto tela de edit aberta | PUT 409 → toast; UI relock após recarga |
| Demo API | Mesma UX; persistência demo se aplicável |

---

## 8. Out of scope / Dependencies

**Dependências:** `DELETE/PUT/POST /recipes`, listagem mine ([RF-UI-API-15](07-fn-ui-api-fetch.md)), guards COOK, toasts RN-UI-UX.

**Fora:** publish/unpublish avulso; EDITOR; reviews.

**Rotas sugeridas (reuso):**

| Rota | Uso |
|------|-----|
| `/cook/receitas` | Lista + exclusão de rascunho |
| `/cook/receitas/nova` | Create + toasts 422/409 |
| `/cook/receitas/:id/editar` | Edit ou locked se publicada |

---

## 9. Traceability

| Fonte | Uso |
|-------|-----|
| [RN-ciclo-receita.md](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md) | RN-REC-01…06 |
| [RN-autoria-e-ownership.md](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md) | RN-OWN-02 |
| [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) | Matriz |
| [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Fetch / mine / userId |
| [FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md) | Sidebar |
| [02-mapa-de-rotas.md](02-mapa-de-rotas.md), [03-fluxos-de-ui.md](03-fluxos-de-ui.md) | Atualizar pós-implementação |

Identificador estável para citar em PRs/issues: **`FN-UI-COOK-RECIPE-LIFECYCLE`**.
