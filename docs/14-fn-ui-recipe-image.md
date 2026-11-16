# Funcionalidade — Imagem de receita na UI

**ID:** `FN-UI-RECIPE-IMAGE`  
**Status:** requisitos **aprovados**; implementação **feita** (sem suite automatizada de upload — stakeholder)  
**Versão:** 1.0  
**Domínio API relacionado:** [RN — Imagem de receita](../../api-recipes-collection/docs/versao-2/RN-imagem-receita.md) (`RN-IMG-*`); visibilidade [RN-VIS-01](../../api-recipes-collection/docs/versao-2/RN-usuario-e-acesso.md); lock [RN-REC-04](../../api-recipes-collection/docs/versao-2/RN-ciclo-receita.md)

Permite ao COOK associar **uma imagem opcional** a receita própria em rascunho (upload/remoção) e exibir `imageUrl` na vitrine e no painel COOK quando a API real devolve o path.

**Testes automatizados de upload:** fora de escopo (stakeholder). Aceite via checklist / smoke manual.

---

## 1. Feature Overview

| Parte | Conteúdo |
|-------|----------|
| Upload | `PUT /recipes/{id}/image` (multipart, campo `file`) após create ou na edição de rascunho |
| Remover | `DELETE /recipes/{id}/image` em rascunho |
| Exibição | `RecipeCard` / `RecipeDetail` / prévia usam `imageUrl` da API |
| Demo | Fixtures com URLs externas inalteradas; upload real não obrigatório no demo |

**Fora do escopo:** galeria, crop, CDN, imagens no PDF, toggle `isPublished`, upload por EDITOR.

---

## 2. Business Context

- A UI já renderiza `imageUrl` quando presente (demo).
- A API passa a persistir e servir mídia; a UI completa o formulário COOK e o fluxo create→upload.

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-IMG-01** | No create/edit de rascunho, o formulário oferece seleção de arquivo, pré-visualização local e indicação de imagem já persistida (`imageUrl`). |
| **RF-UI-IMG-02** | Após `POST /recipes` com sucesso (resposta com `id`), se houver arquivo selecionado, a UI chama `PUT /recipes/{id}/image`. |
| **RF-UI-IMG-03** | Em edição de rascunho: upload e/ou `DELETE /recipes/{id}/image` conforme seleção/remoção. |
| **RF-UI-IMG-04** | Receita publicada: seção de imagem somente leitura (sem upload/remoção). |
| **RF-UI-IMG-05** | Vitrine usa `imageUrl` da API real; fallback visual permanece se `null` ou erro de carga. |
| **RF-UI-IMG-06** | Modo demo: fixtures Unsplash permanecem; upload/delete podem ser no-op documentado. |
| **RF-UI-IMG-07** | Erros 413/415/422/409/403 mapeados para toasts compreensíveis (sem paths internos). |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-IMG-01** | `apiRequest` envia `FormData` sem forçar `Content-Type: application/json`. |
| **RNF-UI-IMG-02** | Limites de MIME/tamanho são da API; a UI pode pré-validar tipos comuns (jpeg/png/webp) de forma opcional. |

---

## 5. Business Rules

| ID | Regra |
|----|-------|
| **RN-UI-IMG-01** | Imagem opcional; não bloqueia cadastro. |
| **RN-UI-IMG-02** | Publicada ⇒ imagem somente leitura. |
| **RN-UI-IMG-03** | Cliente não envia `imageUrl` no JSON de create/update. |

---

## 6. Acceptance Criteria

- [x] **AC-01** — `RecipeForm` permite escolher/remover imagem em rascunho; bloqueado se publicada.
- [x] **AC-02** — Create com arquivo: após POST, chama upload com o `id` retornado.
- [x] **AC-03** — Edit: upload/delete conforme intenção do usuário.
- [x] **AC-04** — Vitrine exibe imagens da API real via `imageUrl` (`/api/recipes/{id}/image`).
- [x] **AC-05** — Modo demo continua funcional com fixtures.
- [x] **AC-06** — Documentos de escopo deixam de listar upload como fora de escopo; matriz V2 inclui `RN-IMG`.

---

## 7. Edge Cases

| Cenário | Esperado |
|---------|----------|
| Create sem arquivo | Só POST; `imageUrl` null |
| Upload falha após create | Toast error; receita já criada (usuário pode editar e reenviar) |
| 413 / tipo inválido | Toast error compreensível |
| Demo + upload | No-op ou mensagem; sem regressão nas fixtures |

---

## 8. Traceability

| UI | API |
|----|-----|
| RF-UI-IMG-01…07 | RN-IMG-01…06; RF endpoints em RN-imagem-receita |

## 9. Related docs

| Doc | Uso |
|-----|-----|
| [01-visao-e-escopo](01-visao-e-escopo.md) | Escopo |
| [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md) | Matriz |
| [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md) | Lock pós-publicação |
| [RN-imagem-receita](../../api-recipes-collection/docs/versao-2/RN-imagem-receita.md) | Domínio |
