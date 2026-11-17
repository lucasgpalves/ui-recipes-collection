# Funcionalidade — UI: fetch API (modo API real)

**ID:** `FN-UI-API-FETCH`  
**Status:** requisitos **aprovados** (implementação coberta — RF-UI-API-01…22 / AC-01…13)  
**Versão:** 1.4  
**Domínio API relacionado:** autenticação, register, recursos wired e `GET /goals/{id}/progress` — ver `../api-recipes-collection/docs/`

Este documento define o corte de requisitos para a UI operar contra a **API HTTP real** (`VITE_USE_DEMO_API=false`), com sessão **cookie HttpOnly** (F-05), e completar register + GoalProgress.

---

## Decisões registradas (stakeholder)

| Decisão | Escolha oficial |
|---------|-----------------|
| Sessão API real | Cookie HttpOnly `receitou_auth` + `credentials: 'include'`; identidade via JSON de login / `GET /auth/me` (sem JWT em `sessionStorage`) |
| Limpeza de sessão | **401 e 403** limpam estado de auth (RF-UI-API-11 / AC-12) |
| Escopo | **D** = (A) API real wired + (B) `POST /auth/register` + (C) UI GoalProgress |
| Docker / release | Default `VITE_USE_DEMO_API=false` |

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| **(A)** | Endurecer modo API real nos módulos já wired (`apiRequest`, env, auth cookie, CRUDs) |
| **(B)** | Ligar fetch `POST /auth/register` na tela de credenciais admin |
| **(C)** | Tela/UI de progresso de metas via `GET /goals/{id}/progress` |

**Fora do escopo:** painéis EDITOR/TASTER, toggle `isPublished`, embed obrigatório de `references` no DTO de usuário. Upload de imagem: [FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md).

---


## 2. Business Context

- A API é fonte de verdade do domínio; a UI aplica apresentação, validação e navegação ([Visão e escopo](01-visao-e-escopo.md)).
- Modo demo é suporte a desenvolvimento, não regra de produto ([RN-UI](04-regras-de-negocio-ui.md)).
- Escopo D fecha pendências de register e GoalProgress em [Módulos e pendências](05-modulos-e-pendencias.md).

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-API-01** | Com `VITE_USE_DEMO_API=false`, módulos que bifurcam demo/API usam HTTP via `apiRequest` (não `demoApi`). |
| **RF-UI-API-02** | `VITE_API_BASE_URL` é obrigatório; URLs = `{apiBaseUrl}{path}`. |
| **RF-UI-API-03** | Em desenvolvimento, base típica `/api` com proxy Vite para `VITE_API_PROXY_TARGET` (default `http://localhost:8080`), reescrevendo `/api` → ``. |
| **RF-UI-API-04** | Em API real, requests autenticadas enviam cookie de sessão (`credentials: 'include'`); **não** dependem de JWT em `sessionStorage` nem de `Authorization: Bearer` obrigatório. |
| **RF-UI-API-05** | Login API real: `POST /auth/login` com `{ username, password }` e `credentials: 'include'`; em sucesso, atualiza estado de auth com `username`/`role`/`userId` do JSON (**sem** persistir JWT no cliente). |
| **RF-UI-API-06** | Restauração de sessão API real: ao iniciar, `GET /auth/me` com credentials; 200 restaura identidade; 401 → sessão limpa. JWT residual/`demo.*` em `sessionStorage` é removido. |
| **RF-UI-API-07** | Logout API real: `POST /auth/logout` (limpa cookie) + limpa estado local; não resta JWT de sessão no cliente. |
| **RF-UI-API-08** | Em demo: token demo em `sessionStorage`; login via `demoLogin`; tokens `demo.*` só aceitos com `VITE_USE_DEMO_API=true`. |
| **RF-UI-API-09** | Build de produção Vite **não** pode ter `VITE_USE_DEMO_API=true` (fail-fast). |
| **RF-UI-API-10** | Default oficial de `VITE_USE_DEMO_API` em `.env.example`, imagem Docker e compose de release = **`false`**. |
| **RF-UI-API-11** | Em qualquer `apiRequest`, status **401 ou 403** dispara limpeza de sessão (RN-UI-AUTH-05). |
| **RF-UI-API-12** | Login: 401/403 → “Usuário ou senha inválidos.” (RN-UI-AUTH-04). |
| **RF-UI-API-13** | Feedback: falha de carga/operação → toast `error`; validação → `warning`; sucesso CRUD → `success` (RN-UI-UX). |
| **RF-UI-API-14** | Área pública funciona sem login; link PDF só fora do demo (RN-UI-PUB-01, RN-UI-PUB-05). |
| **RF-UI-API-15** | COOK em API real: listagem via `GET /recipes/mine`. |
| **RF-UI-API-16** | Create/update de receita usa `userId` da sessão autenticada (não constante de demo). |
| **RF-UI-API-17** | Credenciais admin: submit válido chama `POST /auth/register` com `{ username, password, userId }` (`userId` da rota/perfil). |
| **RF-UI-API-18** | Register: sucesso (ex.: 201) → toast success e fluxo de retorno coerente; falha → toast error; formulário permanece utilizável. |
| **RF-UI-API-19** | Register: usuário desativado não exibe formulário (RN-UI-AUTH-09); validações RN-UI-AUTH-10/11 permanecem. |
| **RF-UI-API-20** | GoalProgress: UI consome `GET /goals/{id}/progress` com query `userId` e, quando informado, `month`/`year` (padrão da API se omitidos). |
| **RF-UI-API-21** | GoalProgress: exibe no mínimo `userId`, `target`, `progress`. |
| **RF-UI-API-22** | GoalProgress: falha de carga → toast error; meta sem `id` não inicia fetch de progresso. |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-API-01** | Sem secrets JWT / chaves privadas no frontend. |
| **RNF-UI-API-02** | JWT de sessão **não** em `localStorage`; em API real o JWT também **não** fica em `sessionStorage` (só cookie HttpOnly). Demo pode usar `sessionStorage`. |
| **RNF-UI-API-03** | Demo proibido em build `PROD` do Vite. |
| **RNF-UI-API-04** | Mensagens de login inválido não revelam se usuário ou senha falhou. |
| **RNF-UI-API-05** | Latência real de rede quando API real (sem simulação demo). |
| **RNF-UI-API-06** | Artefatos de release (Docker/compose) defaultam `VITE_USE_DEMO_API=false`. |

**Não especificado neste corte:** timeouts, retry, CSRF (modelo Bearer), catálogo fino de mensagens HTTP por status.

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-AUTH-01** | API real: JWT só no cookie HttpOnly; demo: token só em `sessionStorage` | Sem secret JWT legível em JS no modo API real |
| **RN-UI-AUTH-05** | 401/403 limpam sessão | Confirmada |
| RN-UI-AUTH-02…04, 06…11 | Login, guards, credenciais | Permanecem |
| RN-UI-PUB-05 | PDF oculto no demo | Permanece |
| RN-UI-REC-10/11 | Ownership / listagem próprias | Payload com `userId` da sessão |
| RF-UI-API-20…22 | Progresso de metas na UI | Extensão do que estava sem tela |

---

## 6. Acceptance Criteria

| AC | Critério | Requisitos |
|----|----------|------------|
| **AC-01** | Login API real válido autentica a partir da identidade do JSON (sem JWT em `sessionStorage`) e redireciona por papel. | RF-UI-API-05, RN-UI-AUTH-08 |
| **AC-02** | Reload restaura sessão via `GET /auth/me`; 401 → não autenticado. | RF-UI-API-06, RN-UI-AUTH-01 |
| **AC-03** | Request com **401** limpa estado de auth (e qualquer `TOKEN_KEY` residual). | RF-UI-API-11, RN-UI-AUTH-05 |
| **AC-04** | Login inválido (401/403) exibe “Usuário ou senha inválidos.” e não grava sessão. | RF-UI-API-12 |
| **AC-05** | Home/busca/categorias/detalhe carregam via HTTP real sem token. | RF-UI-API-01, 14 |
| **AC-06** | PDF visível fora do demo; oculto com demo. | RN-UI-PUB-05 |
| **AC-07** | COOK: listagem `/recipes/mine`; create/update com `userId` da sessão. | RF-UI-API-15, 16 |
| **AC-08** | `VITE_USE_DEMO_API=true` + build PROD falha. | RF-UI-API-09 |
| **AC-09** | Sem `VITE_API_BASE_URL`, app não sobe com erro explícito. | RF-UI-API-02 |
| **AC-10** | Submit em credenciais chama `POST /auth/register`; 201 → success; erro → error; desativado → sem formulário. | RF-UI-API-17…19 |
| **AC-11** | UI GoalProgress chama `GET /goals/{id}/progress` e exibe `target` e `progress`. | RF-UI-API-20…22 |
| **AC-12** | Request com **403** também limpa sessão. | RF-UI-API-11, RN-UI-AUTH-05 |
| **AC-13** | `.env.example` e defaults Docker/compose de release usam `VITE_USE_DEMO_API=false`. | RF-UI-API-10, RNF-UI-API-06 |

---

## 7. Edge Cases

| Cenário | Comportamento esperado |
|---------|------------------------|
| Cookie ausente/expirado no boot (`/auth/me` 401) | Sessão não autenticada; guards redirecionam |
| 401 em `apiRequest` | Limpa sessão |
| 403 em `apiRequest` | Limpa sessão (AC-12 / RF-UI-API-11) |
| Login 401/403 | Mensagem genérica; sem sessão |
| `userId` null ao salvar receita | UI bloqueia com warning |
| Entidade sem `id` | Ações dependentes limitadas (“Sem id”); progresso de meta não busca sem `id` |
| Register com perfil desativado | Formulário oculto |
| Token `demo.*` residual com API real | Removido no boot; não enviado como Bearer |
| Cookie HttpOnly | Mecanismo oficial da API real (F-05); demo permanece em `sessionStorage` |

---

## 8. Dependencies and Constraints

**Dependências:** `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/register`, recursos já wired, `GET /recipes/mine`, `GET /goals/{id}/progress?userId=&month=&year=`; tipos UI `TokenResponse`, `AuthMeResponse`, `RegisterRequest`, `GoalProgress`.

**Abertos (não bloqueiam aprovação):**

1. **`id` ausente** — comportamento atual (“Sem id”) permanece até nova decisão.
2. **Mensagens HTTP** — genéricas / `ApiError` atuais até nova decisão (exceto login 401/403).

---

## 9. Testing Recommendations

1. Auth API real: login sem JWT no storage; reload via `/auth/me`; logout limpa cookie + estado.
2. 401 ou 403 em `apiRequest` → sessão limpa (AC-03, AC-12).
3. Login negativo: texto RN-UI-AUTH-04.
4. Público + PDF (AC-05, AC-06).
5. Cook: `/recipes/mine` + `userId` da sessão.
6. Register (AC-10) e GoalProgress (AC-11).
7. Config: AC-08, AC-09, AC-13.
8. Regressão demo com `VITE_USE_DEMO_API=true` (JWT em `sessionStorage`).

---

## Checklist de implementação (não marcar sem evidência)

- [x] Modo API real nos módulos wired via `apiRequest` (RF-UI-API-01 / AC-05)
- [x] `VITE_API_BASE_URL` obrigatório; URLs `{apiBaseUrl}{path}` (RF-UI-API-02 / AC-09)
- [x] Proxy Vite `/api` → `VITE_API_PROXY_TARGET` (default `http://localhost:8080`) com rewrite (RF-UI-API-03)
- [x] API real autentica via cookie (`credentials: 'include'`) sem JWT em `sessionStorage` (RF-UI-API-04 / RNF-UI-API-02 / F-05)
- [x] Login API real: identidade no JSON; sem persistir JWT no cliente (RF-UI-API-05 / AC-01)
- [x] Restauração de sessão via `GET /auth/me` no boot (RF-UI-API-06 / AC-02)
- [x] Logout: `POST /auth/logout` + limpa estado local (RF-UI-API-07)
- [x] Clear de sessão em 401 **e** 403 (RF-UI-API-11 / AC-12)
- [x] Docker/compose/release com `VITE_USE_DEMO_API=false` (RF-UI-API-10)
- [x] Register ligado em credenciais admin (RF-UI-API-17…19 / AC-10)
- [x] UI GoalProgress (RF-UI-API-20…22 / AC-11)
- [x] ACs 01–13 validados por testes relevantes
- [x] Docs de fluxos/README sincronizados com o comportamento implementado

Identificador estável para citar em PRs/issues: **`FN-UI-API-FETCH`**.
