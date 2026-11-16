# Funcionalidade — TASTER: avaliação no detalhe público

**ID:** `FN-UI-TASTER`  
**Status:** **implementado** (validado por `recipeDetail.taster.apiFetch.test.tsx`)  
**Versão:** 1.0  
**Domínio API relacionado:** [RN — Avaliação](../../api-recipes-collection/docs/versao-2/RN-avaliacao.md); ownership [RN-OWN-03](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md)

Permite ao usuário autenticado como **TASTER** criar, editar e excluir a **própria** review no detalhe público da receita. A média de avaliações permanece visível publicamente (comportamento já da vitrine).

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| Create | `POST /reviews` quando não há review própria |
| Edit | `PUT /reviews/{id}` (rating + description) |
| Delete | `DELETE /reviews/{id}` com confirmação |
| Visibilidade do form | Só se autenticado como TASTER **e** receita publicada |
| Média | Continua visível para anônimos e autenticados |

**Fora do escopo:**

- Painel `/taster/*` dedicado.
- Avaliar receita não publicada; autoavaliação (domínio API).
- Alterar `recipe_id` / `user_id` no update (RN-REV-06).
- UI EDITOR/COOK lifecycle (outros FNs).
- Toggle `isPublished`.

---

## 2. Business Context

- Reviews só fazem sentido em receita publicada; uma por usuário; autor da receita não avalia a própria.
- A UI mostra média publicamente e o formulário TASTER no detalhe `/receitas/:id` (create/edit/delete da própria review).

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-TAST-01** | Em `/receitas/:id`, a média (ou estado “sem avaliações”) permanece visível independentemente de autenticação. |
| **RF-UI-TAST-02** | Formulário/ações de review **só** renderizam se `role === 'TASTER'` autenticado **e** a receita exibida está publicada (`isPublished === true`). |
| **RF-UI-TAST-03** | Anônimo, COOK, EDITOR, ADMIN: não veem o formulário de create/edit próprio de TASTER neste corte (podem ver a média). |
| **RF-UI-TAST-04** | Sem review própria: formulário de criação (rating 1–5, description); submit → `POST /reviews` com vínculo à receita do detalhe; ator = sessão (não confiar em userId livre do form). |
| **RF-UI-TAST-05** | Validação local: rating inteiro 1–5 obrigatório; description conforme regras de form existentes/opcional documentada; bloqueia submit inválido com `warning`. |
| **RF-UI-TAST-06** | Sucesso create → toast `success`; UI passa a modo “minha review” (exibir valores + Editar/Excluir). |
| **RF-UI-TAST-07** | Com review própria: permitir editar via `PUT /reviews/{id}` apenas `rating` e `description`. |
| **RF-UI-TAST-08** | Excluir: confirmação danger → `DELETE /reviews/{id}` → sucesso remove a review própria da UI + toast; média pode ser recarregada. |
| **RF-UI-TAST-09** | HTTP **409** (duplicata, receita própria, não publicada, ou equivalente de negócio) → toast `error` com mensagem da API/`ApiError`; sem estado de sucesso falso. |
| **RF-UI-TAST-10** | HTTP **422** (rating fora da faixa) → toast `warning`/`error`; formulário utilizável. |
| **RF-UI-TAST-11** | HTTP **403** (review alheia / papel) → toast `error`. |
| **RF-UI-TAST-12** | Pós-login TASTER: destino continua área pública `/` (ou retorno ao detalhe se houver `returnTo`); **não** cria shell `/taster`. |
| **RF-UI-TAST-13** | Receita não publicada no detalhe: sem formulário TASTER (e API public já restringe detalhe anônimo — UI não inventa detalhe de rascunho alheio). |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-TAST-01** | Formulário não expõe edição de reviews de outros usuários. |
| **RNF-UI-TAST-02** | Rating acessível (label, teclado). |
| **RNF-UI-TAST-03** | Sessão/API real conforme [FN-UI-API-FETCH](07-fn-ui-api-fetch.md). |

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-TAST-01** | Form de review só para TASTER + receita publicada | Domínio: RN-REV-03 |
| **RN-UI-TAST-02** | UI oferece no máximo uma review própria por receita (create xor edit) | Domínio: RN-REV-01 |
| **RN-UI-TAST-03** | Média pública independente do form | Já na vitrine |
| **RN-UI-TAST-04** | 409 de negócio nunca é silenciado | Domínio: RN-REV-01, 03, 04 |
| — | Faixa 1–5, sem autoavaliação, is_rated | Ver [RN-avaliacao](../../api-recipes-collection/docs/versao-2/RN-avaliacao.md) |

---

## 6. Acceptance Criteria

- [x] **AC-01** — Anônimo vê média (ou ausência) e **não** vê formulário de review.
- [x] **AC-02** — TASTER em receita publicada sem review própria: create via `POST /reviews` funciona e atualiza a UI.
- [x] **AC-03** — TASTER edita a própria review via `PUT` (só rating/description).
- [x] **AC-04** — TASTER exclui a própria review via `DELETE` após confirmação.
- [x] **AC-05** — Segundo create (409 duplicata) mostra toast de erro e não duplica card.
- [x] **AC-06** — Tentativa/contexto de receita própria ou não publicada: form ausente e/ou 409 tratado com toast.
- [x] **AC-07** — Rating fora de 1–5 bloqueado localmente e/ou 422 com toast.
- [x] **AC-08** — COOK/EDITOR/ADMIN autenticados não obtêm o formulário TASTER neste FN.
- [x] **AC-09** — Nenhuma rota `/taster/*` introduzida.
- [x] **AC-10** — Docs públicos/fluxos atualizados após implementação verificada.

---

## 7. Edge Cases

| Cenário | Esperado |
|---------|----------|
| Sessão expira no submit | 401 limpa sessão (política FN-UI-API-FETCH); form some após redirect login |
| Última review removida | Média/estado “sem avaliações” atualizado após reload/refetch |
| Review própria carregada por listagem filtrada | Preferir endpoint que permita obter review do ator; se API só lista gerais, filtrar por `userId` da sessão |

---

## 8. Out of scope / Suggested routes

**Rotas:** reutilizar `/receitas/:id` (PublicLayout). Sem novas rotas de painel.

**Endpoints:** `POST /reviews`, `PUT /reviews/{id}`, `DELETE /reviews/{id}`; leitura de média/reviews já usada no detalhe.

---

## 9. Traceability

| Fonte | Uso |
|-------|-----|
| [RN-avaliacao.md](../../api-recipes-collection/docs/versao-2/RN-avaliacao.md) | RN-REV-01…06 |
| [RN-autoria-e-ownership.md](../../api-recipes-collection/docs/versao-2/RN-autoria-e-ownership.md) | RN-OWN-03 |
| [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) | Matriz |
| [01-visao-e-escopo.md](01-visao-e-escopo.md) | Papel TASTER |
| [02-mapa-de-rotas.md](02-mapa-de-rotas.md) / [03-fluxos-de-ui.md](03-fluxos-de-ui.md) | Detalhe público |

Identificador estável para citar em PRs/issues: **`FN-UI-TASTER`**.
