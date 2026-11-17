# Funcionalidade — ADMIN: ciclo complementar de acesso (reativar)

**ID:** `FN-UI-ADMIN-USER-ACCESS`  
**Status:** requisitos **aprovados** (implementação coberta)  
**Versão:** 1.1  
**Domínio API relacionado:** [RN — Usuário e acesso](../../api-recipes-collection/docs/versao-2/RN-usuario-e-acesso.md) (`RN-USR-01`, `RN-USR-02`)

Complementa a UI admin de usuários com ação explícita de **reativação** e clareza UX entre **terminate** e **reactivate**. **Não** redefine register ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)). Bootstrap do primeiro ADMIN permanece CLI (fora de escopo UI).

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| Reativar | Ação explícita → `PUT /users/reactivate/{id}` |
| UX | Perfil (e listagem, se aplicável) distingue Desativar vs Reativar |
| Register | Apenas referência a `FN-UI-API-FETCH` |
| Bootstrap | Fora de escopo (RN-USR-05 CLI) |

**Fora do escopo:**

- Redefinir RF-UI-API-17…19 (register).
- Endpoint/UI de bootstrap ADMIN.
- Alterar regras de hard delete vs terminate no `DELETE` (domínio API RN-USR-03) além do feedback já existente, salvo clareza de rótulos se já houver delete.
- Painéis EDITOR/TASTER.

---

## 2. Business Context

- V2 formaliza reativação idempotente via `PUT /users/reactivate/{id}` (204).
- A UI já desativa (terminate) e bloqueia edição de desativados; falta ação simétrica de reativar e cópia de interface que não confunda os dois estados.

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-ADM-ACC-01** | No perfil `/admin/usuarios/:id`, se o usuário está desativado (`terminatedAt` preenchido ou equivalente UI atual), exibir ação **Reativar** (rótulo explícito). |
| **RF-UI-ADM-ACC-02** | Usuário ativo: ação **Desativar** permanece (terminate existente); **Reativar** ausente ou desabilitada. |
| **RF-UI-ADM-ACC-03** | Usuário desativado: **Desativar** ausente/desabilitada; **Reativar** disponível; edição de dados continua bloqueada até reativar (RN-UI-USR-08 permanece até reativação bem-sucedida). |
| **RF-UI-ADM-ACC-04** | Reativar pode exigir confirmação (diálogo); cancelar não chama a API. |
| **RF-UI-ADM-ACC-05** | Confirmar reativação chama `PUT /users/reactivate/{id}`. |
| **RF-UI-ADM-ACC-06** | Sucesso (ex.: 204) → toast `success`; UI atualiza para estado ativo (limpa indicação de desativado; habilita Editar/Desativar/Criar acesso conforme regras existentes). |
| **RF-UI-ADM-ACC-07** | Falha → toast `error`; estado permanece desativado. |
| **RF-UI-ADM-ACC-08** | Reativação repetida em já ativo: se API idempotente 204, UI trata como sucesso/no-op sem erro confuso. |
| **RF-UI-ADM-ACC-09** | Na listagem `/admin/usuarios`, usuários desativados podem expor atalho **Reativar** (opcional mas recomendado) com o mesmo endpoint; badge “Desativado” permanece. |
| **RF-UI-ADM-ACC-10** | Textos de UI distinguem: **Desativar** = encerra acesso (terminate); **Reativar** = restaura acesso — sem usar o mesmo rótulo para ambos. |
| **RF-UI-ADM-ACC-11** | Credenciais / `POST /auth/register`: **não** especificados aqui — ver [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) RF-UI-API-17…19. |
| **RF-UI-ADM-ACC-12** | Nenhuma tela de bootstrap ADMIN; documentação UI cita bootstrap como CLI/ops apenas. |
| **RF-UI-ADM-ACC-13** | Guards admin e sidebar object-only inalterados ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)). |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-ADM-ACC-01** | Ação Reativar só para `ADMIN` autenticado (já imposto pelo shell admin). |
| **RNF-UI-ADM-ACC-02** | Confirmações acessíveis; tom de diálogo coerente (reativar ≠ danger de desativar; pode ser primary/neutral). |
| **RNF-UI-ADM-ACC-03** | Sem exposição de senhas ou secrets de bootstrap na UI. |

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-ADM-ACC-01** | Desativado ⇒ CTA Reativar; Ativo ⇒ CTA Desativar | Apresentação |
| **RN-UI-ADM-ACC-02** | Reativar só após confirmação explícita do admin (se diálogo adotado) | UX |
| **RN-UI-ADM-ACC-03** | Register permanece no corte FN-UI-API-FETCH | Não duplicar |
| **RN-UI-ADM-ACC-04** | Bootstrap ADMIN não tem superfície UI | Domínio: RN-USR-05 |
| — | Efeito de terminate/reactivate em auth/JWT | Ver [RN-usuario-e-acesso](../../api-recipes-collection/docs/versao-2/RN-usuario-e-acesso.md) |

---

## 6. Acceptance Criteria

- [x] **AC-01** — Perfil de usuário desativado mostra **Reativar** e não oferece Desativar ativo.
- [x] **AC-02** — Perfil de usuário ativo mostra **Desativar** e não oferece Reativar ativo.
- [x] **AC-03** — Confirmar Reativar chama `PUT /users/reactivate/{id}` e, em 204, UI fica ativa.
- [x] **AC-04** — Cancelar confirmação não chama a API.
- [x] **AC-05** — Rótulos Desativar vs Reativar são distintos e compreensíveis.
- [x] **AC-06** — Este documento não adiciona requisitos novos de register; referências apontam a FN-UI-API-FETCH.
- [x] **AC-07** — Nenhuma rota/tela de bootstrap ADMIN.
- [x] **AC-08** — Após reativar, edição/credenciais voltam a seguir regras de usuário ativo (RN-UI-USR-08 / AUTH-09).
- [x] **AC-09** — Fluxos admin e pendências atualizados após implementação verificada.

---

## 7. Edge Cases

| Cenário | Esperado |
|---------|----------|
| Usuário sem `id` | Sem Reativar/Desativar dependentes de id |
| 403/404 no reactivate | Toast error; permanece desativado |
| Terminate idempotente já existente | Sem regressão nos fluxos de desativar |

---

## 8. Out of scope / Suggested routes

**Rotas (reuso):**

| Rota | Uso |
|------|-----|
| `/admin/usuarios` | Lista + atalho Reativar (opcional) |
| `/admin/usuarios/:id` | Perfil: Desativar ↔ Reativar |

**Endpoints:** `PUT /users/reactivate/{id}`; terminate existente (`PUT` terminate já usado na UI); register → só via FN-UI-API-FETCH.

---

## 9. Traceability

| Fonte | Uso |
|-------|-----|
| [RN-usuario-e-acesso.md](../../api-recipes-collection/docs/versao-2/RN-usuario-e-acesso.md) | RN-USR-01, 02, 05 |
| [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Register (não duplicar) |
| [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) | Matriz |
| [04-regras-de-negocio-ui.md](04-regras-de-negocio-ui.md) | RN-UI-USR-*; estender pós-implementação se necessário |
| [03-fluxos-de-ui.md](03-fluxos-de-ui.md) § Admin usuários | Desativar + novo Reativar |

Identificador estável para citar em PRs/issues: **`FN-UI-ADMIN-USER-ACCESS`**.
