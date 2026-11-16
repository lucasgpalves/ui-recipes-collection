# Wiki — Frontend Receitou (Taberu FOOD)

Documentação de **requisitos de interface**, regras de negócio da UI e fluxos de tela do frontend **Acervo de Receitas**.

## Separação de responsabilidades

| Repositório | Escopo da documentação |
|-------------|------------------------|
| **Este (`frontend-recipes-collection/docs`)** | Rotas, fluxos de tela, validações de formulário, guards, estados de UI, módulos do painel |
| **API (`api-recipes-collection/docs`)** | Regras de domínio, endpoints, papéis HTTP, RNs de negócio (v1/v2) |

Consultas sobre **comportamento de backend, contratos de API, ownership, ciclo de receita, reviews, livros, ingredientes, metas etc.** devem ser feitas diretamente em:

`../api-recipes-collection/docs/`

Este frontend **não duplica** as RNs da API. Quando a UI depende de uma regra de domínio, cita o documento da API como referência.

### Como a API referencia este frontend

Caminho relativo a partir de `api-recipes-collection/docs/`:

`../../frontend-recipes-collection/docs/`

| ID | Documento |
|----|-----------|
| **`FN-UI-COOK-PROFILE`** | [`06-perfil-cook-contexto.md`](06-perfil-cook-contexto.md) |
| **`FN-UI-API-FETCH`** | [`07-fn-ui-api-fetch.md`](07-fn-ui-api-fetch.md) |
| **`FN-UI-NAV-SIDEBAR-OBJECT`** | [`08-fn-ui-nav-sidebar-object.md`](08-fn-ui-nav-sidebar-object.md) |
| **`FN-UI-V2-COVERAGE`** | [`09-fn-ui-v2-coverage.md`](09-fn-ui-v2-coverage.md) — índice UI × API V2 |
| **`FN-UI-COOK-RECIPE-LIFECYCLE`** | [`10-fn-ui-cook-recipe-lifecycle.md`](10-fn-ui-cook-recipe-lifecycle.md) |
| **`FN-UI-EDITOR`** | [`11-fn-ui-editor.md`](11-fn-ui-editor.md) |
| **`FN-UI-TASTER`** | [`12-fn-ui-taster.md`](12-fn-ui-taster.md) |
| **`FN-UI-ADMIN-USER-ACCESS`** | [`13-fn-ui-admin-user-access.md`](13-fn-ui-admin-user-access.md) |

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [Visão e escopo](01-visao-e-escopo.md) | Objetivo do cliente web e escopo por área |
| [Mapa de rotas e acesso](02-mapa-de-rotas.md) | Rotas, layouts e guards |
| [Fluxos de UI](03-fluxos-de-ui.md) | Jornadas passo a passo (público, auth, admin, cook) |
| [Regras de negócio da UI](04-regras-de-negocio-ui.md) | Validações, máscaras, confirmações, notificações |
| [Módulos e pendências](05-modulos-e-pendencias.md) | O que está na UI vs. próximo corte |
| [Perfil COOK / contexto de referências](06-perfil-cook-contexto.md) | `FN-UI-COOK-PROFILE` — hub de perfil e leitura embutida |
| [Fetch API (modo API real)](07-fn-ui-api-fetch.md) | `FN-UI-API-FETCH` — requisitos aprovados; implementação parcial |
| [Sidebar: item = nome do objeto](08-fn-ui-nav-sidebar-object.md) | `FN-UI-NAV-SIDEBAR-OBJECT` — sidebar sem Listagem/Cadastro; create/edit via CTAs |
| [Cobertura UI × API V2](09-fn-ui-v2-coverage.md) | `FN-UI-V2-COVERAGE` — matriz de rastreio por domínio V2 |
| [COOK: ciclo de receita](10-fn-ui-cook-recipe-lifecycle.md) | `FN-UI-COOK-RECIPE-LIFECYCLE` — delete rascunho, lock pós-publicação, toasts |
| [Painel EDITOR](11-fn-ui-editor.md) | `FN-UI-EDITOR` — ingredientes, livros, fila editorial |
| [TASTER: reviews](12-fn-ui-taster.md) | `FN-UI-TASTER` — avaliação no detalhe público |
| [Admin: reativar usuário](13-fn-ui-admin-user-access.md) | `FN-UI-ADMIN-USER-ACCESS` — terminate ↔ reactivate |

## Convenções

- **RN-UI-XXX** — regra verificável na interface (independente da API).
- **FN-UI-XXX** — funcionalidade/corte de requisitos de interface.
- **Fluxo** — sequência de telas/ações do usuário.
- Referências à API usam o caminho relativo ao repositório irmão, sem copiar o texto das RNs.
- Comportamento demo (`VITE_USE_DEMO_API`) é documentado quando altera a experiência; não substitui o contrato da API.
- Default oficial de release: `VITE_USE_DEMO_API=false` ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)).
- Novos FN-UI V2 (`09`–`13`): status **requisitos aprovados (implementação não iniciada)**, exceto o rastreio `FN-UI-V2-COVERAGE`.
