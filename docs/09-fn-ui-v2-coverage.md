# Funcionalidade — Cobertura UI × API Versão 2

**ID:** `FN-UI-V2-COVERAGE`  
**Status:** requisitos **aprovados** (documento de rastreio; implementação nos FN-UI filhos)  
**Versão:** 1.0  
**Domínio API relacionado:** índice [Versão 2 — regras de negócio](../../api-recipes-collection/docs/versao-2/README.md)

Documento **mestre de alinhamento**: mapeia cada domínio da API V2 para cobertura na UI e para o FN-UI filho responsável. Não redefine regras de domínio da API nem requisitos detalhados dos filhos.

---

## 1. Feature Overview

Manter uma matriz única e verificável:

| Domínio API V2 | Cobertura UI | FN-UI filho | Status cobertura |
|----------------|--------------|-------------|------------------|
| Autoria / ownership (`RN-OWN`) | Implícito nos painéis que mutam recursos (COOK, TASTER, EDITOR) | [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md), [FN-UI-EDITOR](11-fn-ui-editor.md), [FN-UI-TASTER](12-fn-ui-taster.md), [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Parcial / planejado nos filhos |
| Ciclo de receita (`RN-REC`) | Painel COOK: delete rascunho, form locked se publicada, toasts 422/409 | [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md) | Planejado |
| Filtro editorial `GET /recipes/editorial` (`RN-REC-05`) | Painel EDITOR (fila editorial) | [FN-UI-EDITOR](11-fn-ui-editor.md) | Feito |
| Avaliação / reviews (`RN-REV`) | Detalhe público: média + CRUD próprio (TASTER) | [FN-UI-TASTER](12-fn-ui-taster.md) | Feito |
| Livro e publicação (`RN-LIV`) | Painel EDITOR: criar livro + publish | [FN-UI-EDITOR](11-fn-ui-editor.md) | Feito |
| Ingredientes governança (`RN-ING`) | Painel EDITOR: approve/reject/reopen/aliases/merge | [FN-UI-EDITOR](11-fn-ui-editor.md) | Feito |
| Metas / progresso (`RN-MET`) | Admin metas + GoalProgress | [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Aprovado; implementação parcial |
| Usuário / acesso / visibilidade (`RN-USR`, `RN-VIS`) | Admin: terminate existente; reativar; register | [FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md); register em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Planejado (reativar); register aprovado |
| Referência de emprego (`RN-JOB`) | Hub perfil COOK | [FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md) | Feito na UI |
| Logs (`RN-LOG`) | **Sem UI** | — | Fora de escopo UI (API também exclui painel de logs) |
| Imagem de receita (`RN-IMG`) | COOK: upload/remoção em rascunho; vitrine exibe `imageUrl` | [FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md) | Feito |
| Sessão / fetch API real | Cookie, register, GoalProgress, clear 401/403 | [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) | Aprovado; implementação parcial |
| Navegação sidebar object-only | Admin / Cook / Editor | [FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md); Editor em [FN-UI-EDITOR](11-fn-ui-editor.md) | Feito |

### Legenda de status de cobertura

| Status | Significado |
|--------|-------------|
| **Feito** | Comportamento de UI implementado e validado para o domínio citado |
| **Aprovado; implementação parcial** | Requisitos UI aprovados; checklist do FN filho ainda incompleto |
| **Planejado** | Requisitos UI aprovados neste corte; implementação não iniciada |
| **Fora de escopo UI** | Domínio API sem superfície de produto na UI (ex.: logs) |
| **Parcial / planejado nos filhos** | Cobertura distribuída; detalhe no FN filho |

**No escopo deste FN:** manter a matriz acima atualizada quando um filho mudar de status; apontar RNs em `versao-2/` sem copiar texto de regra de domínio.

**Fora do escopo:**

- Implementação de telas (pertence aos FN-UI filhos).
- Duplicar texto de RNs da API.
- UI de logs / auditoria consultável (alinhado a [README V2](../../api-recipes-collection/docs/versao-2/README.md) e [RN-logs](../../api-recipes-collection/docs/versao-2/RN-logs.md)).
- Toggle/`isPublished` avulso de receita (continua fora de produto UI salvo FN futura).
- Bootstrap do primeiro ADMIN via HTTP/UI ([RN-USR-05](../../api-recipes-collection/docs/versao-2/RN-usuario-e-acesso.md) — CLI).

---

## 2. Business Context

- A API V2 formalizou ownership, ciclo de receita, reviews, livros, ingredientes, metas, usuário/acesso e logs.
- A UI já cobre vitrine, admin parcial, cook básico, perfil COOK e parte de fetch API real.
- Este documento evita gaps órfãos: cada domínio V2 tem destino explícito (filho FN-UI ou “fora de escopo”).

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-V2-01** | A documentação UI mantém a matriz Domínio API V2 → cobertura UI → FN-UI filho → status (tabela da §1). |
| **RF-UI-V2-02** | Cada célula de domínio cita o arquivo RN correspondente sob `../../api-recipes-collection/docs/versao-2/` (ou o índice README V2). |
| **RF-UI-V2-03** | Logs (`RN-LOG`) constam na matriz como **Fora de escopo UI**, com referência ao README V2 / RN-logs. |
| **RF-UI-V2-04** | Alteração de status de um FN-UI filho (planejado → parcial → feito) exige atualização desta matriz na mesma entrega de docs. |
| **RF-UI-V2-05** | Itens “já cobertos” ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md), [FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md), [FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)) são apenas referenciados — não redefinidos aqui. |
| **RF-UI-V2-06** | Register e GoalProgress não são reespecificados; rastreio permanece em `FN-UI-API-FETCH`. |
| **RF-UI-V2-07** | [01-visao-e-escopo.md](01-visao-e-escopo.md), [05-modulos-e-pendencias.md](05-modulos-e-pendencias.md) e [README.md](README.md) apontam para este documento como índice de cobertura V2. |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-V2-01** | Documento em português; IDs estáveis; sem código de implementação. |
| **RNF-UI-V2-02** | Não duplicar regras de negócio da API; apenas links relativos. |

---

## 5. Business Rules

| ID | Regra | Notas |
|----|-------|-------|
| **RN-UI-V2-01** | A matriz é a fonte de verdade de *rastreio* UI×API V2 neste repositório de docs UI | Não substitui RNs da API |
| **RN-UI-V2-02** | Domínio marcado “Fora de escopo UI” não gera backlog de tela sem nova FN aprovada | Logs |
| — | Regras de domínio | Ver arquivos `RN-*` em `versao-2/` |

---

## 6. Acceptance Criteria

- [x] **AC-01** — Matriz da §1 lista todos os temas do [README V2](../../api-recipes-collection/docs/versao-2/README.md) (OWN, REC, REV, LIV, ING, MET, USR/VIS, JOB, LOG).
- [x] **AC-02** — Logs aparecem como fora de escopo UI, com link à API.
- [x] **AC-03** — Cada domínio com UI planejada aponta para exatamente um FN-UI filho principal (ou “implícito” documentado).
- [x] **AC-04** — `FN-UI-API-FETCH`, `FN-UI-COOK-PROFILE` e `FN-UI-NAV-SIDEBAR-OBJECT` não são redefinidos neste arquivo.
- [x] **AC-05** — README, visão e módulos/pendências referenciam este FN como índice de cobertura V2.
- [x] **AC-06** — Legenda de status está documentada e usada de forma consistente na matriz.

---

## 7. Out of scope

- Qualquer implementação de endpoint ou componente.
- UI de logs; publish avulso de receita; bootstrap ADMIN na UI.
- Redefinir requisitos dos FN-UI filhos.

---

## 8. Traceability

| Artefato | Relação |
|----------|---------|
| [api/.../versao-2/README.md](../../api-recipes-collection/docs/versao-2/README.md) | Índice de RNs V2 |
| `RN-OWN` … `RN-LOG` | Domínios da matriz |
| [07](07-fn-ui-api-fetch.md), [06](06-perfil-cook-contexto.md), [08](08-fn-ui-nav-sidebar-object.md) | Já cobertos |
| [10](10-fn-ui-cook-recipe-lifecycle.md)–[13](13-fn-ui-admin-user-access.md) | Filhos novos |
| [05-modulos-e-pendencias.md](05-modulos-e-pendencias.md) | Backlog / matriz de módulos |

**Rotas sugeridas:** nenhuma (documento de rastreio).

Identificador estável para citar em PRs/issues: **`FN-UI-V2-COVERAGE`**.
