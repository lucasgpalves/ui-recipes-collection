# Funcionalidade — UI: fetch API (modo API real)

**ID:** `FN-UI-API-FETCH`  
**Status:** requisitos **aprovados** (implementação parcial — RF-UI-API-01/02/03/04/05/07 feito)  
**Versão:** 1.2  
**Domínio API relacionado:** autenticação, register, recursos wired e `GET /goals/{id}/progress` — ver `../api-recipes-collection/docs/`

Este documento define o corte de requisitos para a UI operar contra a **API HTTP real** (`VITE_USE_DEMO_API=false`), com sessão JWT em `sessionStorage`, e completar register + GoalProgress.

---

## Decisões registradas (stakeholder)

| Decisão | Escolha oficial |
|---------|-----------------|
| Sessão API real | JWT em `sessionStorage` + `Authorization: Bearer` |
| Limpeza de sessão | **401 e 403** limpam token e estado de auth |
| Escopo | **D** = (A) API real wired + (B) `POST /auth/register` + (C) UI GoalProgress |
| Docker / release | Default `VITE_USE_DEMO_API=false` |

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| **(A)** | Endurecer modo API real nos módulos já wired (`apiRequest`, env, auth Bearer, CRUDs) |
| **(B)** | Ligar fetch `POST /auth/register` na tela de credenciais admin |
| **(C)** | Tela/UI de progresso de metas via `GET /goals/{id}/progress` |

**Fora do escopo:** painéis EDITOR/TASTER, upload de imagem, toggle `isPublished`, embed obrigatório de `references` no DTO de usuário.

**Gap código ↔ requisito (rastreado, não inventado):** login grava JWT em `sessionStorage` e logout limpa (RF-UI-API-05/07). Restauração no boot ainda pode usar `GET /auth/me` / cookie (RF-UI-API-06); clear em `apiRequest` ainda só em 401 (RF-UI-API-11).

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
| **RF-UI-API-04** | Em API real, requests autenticadas usam `Authorization: Bearer <token>` lido de `sessionStorage` (`receitou.auth.token`), conforme RN-UI-AUTH-01. |
| **RF-UI-API-05** | Login API real: `POST /auth/login` com `{ username, password }`; em sucesso, persiste o JWT em `sessionStorage` e atualiza estado de auth. |
| **RF-UI-API-06** | Restauração de sessão: ao iniciar, ler token de `sessionStorage`; se válido, restaurar estado; se ausente/inválido/expirado, sessão limpa. |
| **RF-UI-API-07** | Logout: remove token de `sessionStorage` e limpa estado local (chamada de logout na API, se existir no modelo Bearer, é opcional; limpeza local é obrigatória). |
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
| **RNF-UI-API-02** | Token de sessão **não** em `localStorage` (somente `sessionStorage`). |
| **RNF-UI-API-03** | Demo proibido em build `PROD` do Vite. |
| **RNF-UI-API-04** | Mensagens de login inválido não revelam se usuário ou senha falhou. |
| **RNF-UI-API-05** | Latência real de rede quando API real (sem simulação demo). |
| **RNF-UI-API-06** | Artefatos de release (Docker/compose) defaultam `VITE_USE_DEMO_API=false`. |

**Não especificado neste corte:** timeouts, retry, CSRF (modelo Bearer), catálogo fino de mensagens HTTP por status.

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-AUTH-01** | Token só em `sessionStorage` | Modelo oficial também na API real |
| **RN-UI-AUTH-05** | 401/403 limpam sessão | Confirmada |
| RN-UI-AUTH-02…04, 06…11 | Login, guards, credenciais | Permanecem |
| RN-UI-PUB-05 | PDF oculto no demo | Permanece |
| RN-UI-REC-10/11 | Ownership / listagem próprias | Payload com `userId` da sessão |
| RF-UI-API-20…22 | Progresso de metas na UI | Extensão do que estava sem tela |

---

## 6. Acceptance Criteria

| AC | Critério | Requisitos |
|----|----------|------------|
| **AC-01** | Login API real válido autentica, grava JWT em `sessionStorage` e redireciona por papel. | RF-UI-API-05, RN-UI-AUTH-08 |
| **AC-02** | Reload restaura sessão a partir de `sessionStorage`; token ausente/expirado → não autenticado. | RF-UI-API-06, RN-UI-AUTH-01 |
| **AC-03** | Request com **401** limpa `sessionStorage` e estado de auth. | RF-UI-API-11, RN-UI-AUTH-05 |
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
| Token ausente/expirado no boot | Sessão não autenticada; guards redirecionam |
| 401 ou 403 em `apiRequest` | Limpa sessão |
| Login 401/403 | Mensagem genérica; sem sessão |
| `userId` null ao salvar receita | UI bloqueia com warning |
| Entidade sem `id` | Ações dependentes limitadas (“Sem id”); progresso de meta não busca sem `id` |
| Register com perfil desativado | Formulário oculto |
| Token `demo.*` com API real | Rejeitado |
| Cookie HttpOnly legado | Não é mecanismo de produto; sessão oficial = `sessionStorage` + Bearer |

---

## 8. Dependencies and Constraints

**Dependências:** `/auth/login`, `/auth/register`, recursos já wired, `GET /recipes/mine`, `GET /goals/{id}/progress?userId=&month=&year=`; tipos UI `TokenResponse`, `RegisterRequest`, `GoalProgress`.

**Abertos (não bloqueiam aprovação):**

1. **`id` ausente** — comportamento atual (“Sem id”) permanece até nova decisão.
2. **Mensagens HTTP** — genéricas / `ApiError` atuais até nova decisão (exceto login 401/403).

---

## 9. Testing Recommendations

1. Auth API real: login grava `sessionStorage`; reload restaura; logout remove.
2. 401 e 403 em `apiRequest` → sessão limpa (AC-03, AC-12).
3. Login negativo: texto RN-UI-AUTH-04.
4. Público + PDF (AC-05, AC-06).
5. Cook: `/recipes/mine` + `userId` da sessão.
6. Register (AC-10) e GoalProgress (AC-11).
7. Config: AC-08, AC-09, AC-13.
8. Regressão demo com `VITE_USE_DEMO_API=true`.
9. Não alterar testes existentes só para acomodar gap; após implementação, refletir Bearer + `sessionStorage` + 401/403.

---

## Checklist de implementação (não marcar sem evidência)

- [x] Modo API real nos módulos wired via `apiRequest` (RF-UI-API-01 / AC-05)
- [x] `VITE_API_BASE_URL` obrigatório; URLs `{apiBaseUrl}{path}` (RF-UI-API-02 / AC-09)
- [x] Proxy Vite `/api` → `VITE_API_PROXY_TARGET` (default `http://localhost:8080`) com rewrite (RF-UI-API-03)
- [x] Bearer em API real a partir de `sessionStorage` (`receitou.auth.token`) (RF-UI-API-04 / RNF-UI-API-02)
- [x] Login API real: `POST /auth/login` persiste JWT em `sessionStorage` e atualiza auth (RF-UI-API-05 / AC-01)
- [ ] Restauração de sessão a partir de `sessionStorage` no boot (RF-UI-API-06 / AC-02)
- [x] Logout: remove token de `sessionStorage` e limpa estado local (RF-UI-API-07)
- [ ] Clear de sessão em 401 e 403 (RF-UI-API-11)
- [ ] Docker/compose/release com `VITE_USE_DEMO_API=false` (RF-UI-API-10)
- [ ] Register ligado em credenciais admin (RF-UI-API-17…19 / AC-10)
- [ ] UI GoalProgress (RF-UI-API-20…22 / AC-11)
- [ ] ACs 01–13 validados por testes relevantes
- [ ] Docs de fluxos/README sincronizados com o comportamento implementado

Identificador estável para citar em PRs/issues: **`FN-UI-API-FETCH`**.
