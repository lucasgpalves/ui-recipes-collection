# Visão e escopo — Interface

## Visão

O frontend **Taberu FOOD** (Receitou) é o cliente web do Acervo de Receitas. Oferece:

1. **Vitrine pública** — explorar, filtrar e abrir receitas sem autenticação.
2. **Painel do cozinheiro (COOK)** — manter o próprio acervo de receitas.
3. **Painel administrativo (ADMIN)** — governança de usuários, papéis, categorias e metas.
4. **Painel editorial (EDITOR)** — governança de ingredientes, livros e fila editorial ([FN-UI-EDITOR](11-fn-ui-editor.md); implementação feita).
5. **Avaliação (TASTER)** — criar/editar/excluir a própria review no detalhe público ([FN-UI-TASTER](12-fn-ui-taster.md); implementação feita).

Marca exibida: **Taberu** / tagline **FOOD**.

## Papéis na interface

| Papel | Área na UI | Destino pós-login |
|-------|------------|-------------------|
| `ADMIN` | `/admin/*` | `/admin/usuarios` |
| `COOK` | `/cook/*` | `/cook/receitas` |
| `EDITOR` | `/editor/*` | `/editor/ingredientes` |
| `TASTER` | Área pública + form de review no detalhe | `/` (sem painel dedicado) |
| Sem papel | Área pública | `/` |

Autorização HTTP e matriz de endpoints: ver API — [Papéis e permissões](../../api-recipes-collection/docs/03-papeis-e-permissoes.md).

Índice de cobertura UI × API V2: [FN-UI-V2-COVERAGE](09-fn-ui-v2-coverage.md).

## Escopo atual da interface

### Área pública

- Home com hero e CTAs contextuais
- Busca por texto e navegação por categorias
- Listagem e detalhe de receita (média de avaliações; form TASTER da própria review; download de PDF fora do modo demo)

### Autenticação

- Login JWT (`POST /auth/login`)
- API real: sessão em cookie HttpOnly (`receitou_auth`); demo: token em `sessionStorage` (`receitou.auth.token`)
- Redirect por papel; limpeza de sessão em 401/403

### Admin

- Usuários: listar, criar, perfil, editar, desativar; tela de credenciais
- Reativação de usuário desativado: [FN-UI-ADMIN-USER-ACCESS](13-fn-ui-admin-user-access.md) (requisitos aprovados; implementação não iniciada)
- Categorias, papéis, metas e restaurantes: CRUD com confirmação de exclusão
- Referências de emprego no **perfil COOK** ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)); restaurantes como catálogo auxiliar

### Cook

- Receitas: listar (próprias), criar, editar (formulário com ingredientes, medidas e prévia)
- Imagem opcional de receita (upload/remoção em rascunho; exibição na vitrine): [FN-UI-RECIPE-IMAGE](14-fn-ui-recipe-image.md)
- Ciclo V2 (delete rascunho, lock pós-publicação, toasts 422/409): [FN-UI-COOK-RECIPE-LIFECYCLE](10-fn-ui-cook-recipe-lifecycle.md) (requisitos aprovados; implementação não iniciada)

## Escopo especificado, implementação parcial

| Funcionalidade | Doc | Estado UI |
|----------------|-----|-----------|
| Perfil COOK + referências no contexto do usuário | [06-perfil-cook-contexto.md](06-perfil-cook-contexto.md) | Implementado na UI; embed de `references` no DTO de usuário ainda evolutivo na API |
| Fetch API real + register + GoalProgress | [07-fn-ui-api-fetch.md](07-fn-ui-api-fetch.md) | Requisitos aprovados; implementação parcial |

## Escopo especificado, implementação não iniciada

| Funcionalidade | Doc |
|----------------|-----|
| Cobertura UI × API V2 (rastreio) | [09-fn-ui-v2-coverage.md](09-fn-ui-v2-coverage.md) |
| COOK — ciclo de receita (delete / lock / toasts) | [10-fn-ui-cook-recipe-lifecycle.md](10-fn-ui-cook-recipe-lifecycle.md) |
| Painel EDITOR | [11-fn-ui-editor.md](11-fn-ui-editor.md) |
| TASTER — reviews no detalhe | [12-fn-ui-taster.md](12-fn-ui-taster.md) |
| Admin — reativar usuário | [13-fn-ui-admin-user-access.md](13-fn-ui-admin-user-access.md) |

## Fora do escopo atual da UI

Itens existentes ou planejados na API, **sem tela** neste frontend (salvo FN futura):

- Publicação de receita / toggle `isPublished` pela UI (publicação via livro — domínio API)
- UI de logs / auditoria consultável ([RN-LOG](../../api-recipes-collection/docs/versao-2/RN-logs.md); também fora do escopo da API V2)
- Bootstrap do primeiro ADMIN via HTTP/UI (CLI — RN-USR-05)

**Corte aprovado (implementação parcial):** [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) — modo API real (cookie HttpOnly / F-05), `POST /auth/register`, UI GoalProgress.

Detalhamento: [Módulos e pendências](05-modulos-e-pendencias.md).

## Premissas

1. A API é a fonte de verdade do domínio; a UI aplica regras de apresentação, validação de formulário e controle de navegação.
2. Default oficial de `VITE_USE_DEMO_API` em release/Docker é `false`. Em desenvolvimento local, `true` pode ser usado para fixtures; isso não altera os requisitos de produto da API ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)).
3. Requisitos de backend evoluem no repositório da API; requisitos de tela evoluem neste `docs/`.
4. Sessão na API real: cookie HttpOnly + `GET /auth/me` (RN-UI-AUTH-01 / F-05); 401 limpa sessão (RN-UI-AUTH-05; 403 = gap).
