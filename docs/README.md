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

Funcionalidade de apresentação do COOK + referências:  
[`06-perfil-cook-contexto.md`](06-perfil-cook-contexto.md) — ID **`FN-UI-COOK-PROFILE`**.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [Visão e escopo](01-visao-e-escopo.md) | Objetivo do cliente web e escopo por área |
| [Mapa de rotas e acesso](02-mapa-de-rotas.md) | Rotas, layouts e guards |
| [Fluxos de UI](03-fluxos-de-ui.md) | Jornadas passo a passo (público, auth, admin, cook) |
| [Regras de negócio da UI](04-regras-de-negocio-ui.md) | Validações, máscaras, confirmações, notificações |
| [Módulos e pendências](05-modulos-e-pendencias.md) | O que está na UI vs. próximo corte |
| [Perfil COOK / contexto de referências](06-perfil-cook-contexto.md) | `FN-UI-COOK-PROFILE` — hub de perfil e leitura embutida |

## Convenções

- **RN-UI-XXX** — regra verificável na interface (independente da API).
- **Fluxo** — sequência de telas/ações do usuário.
- Referências à API usam o caminho relativo ao repositório irmão, sem copiar o texto das RNs.
- Comportamento demo (`VITE_USE_DEMO_API`) é documentado quando altera a experiência; não substitui o contrato da API.
