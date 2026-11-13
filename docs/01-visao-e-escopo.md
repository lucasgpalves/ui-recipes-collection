# Visão e escopo — Interface

## Visão

O frontend **Taberu FOOD** (Receitou) é o cliente web do Acervo de Receitas. Oferece:

1. **Vitrine pública** — explorar, filtrar e abrir receitas sem autenticação.
2. **Painel do cozinheiro (COOK)** — manter o próprio acervo de receitas.
3. **Painel administrativo (ADMIN)** — governança de usuários, papéis, categorias e metas.

Marca exibida: **Taberu** / tagline **FOOD**.

## Papéis na interface

A UI reconhece painéis apenas para:

| Papel | Área na UI | Destino pós-login |
|-------|------------|-------------------|
| `ADMIN` | `/admin/*` | `/admin/usuarios` |
| `COOK` | `/cook/*` | `/cook/receitas` |
| Outros (`EDITOR`, `TASTER`, sem papel) | Sem painel dedicado | `/` (área pública) |

Autorização HTTP e matriz de endpoints: ver API — [Papéis e permissões](../../api-recipes-collection/docs/03-papeis-e-permissoes.md).

## Escopo atual da interface

### Área pública

- Home com hero e CTAs contextuais
- Busca por texto e navegação por categorias
- Listagem e detalhe de receita (média de avaliações; download de PDF fora do modo demo)

### Autenticação

- Login JWT (`POST /auth/login`)
- Token em `sessionStorage` (`receitou.auth.token`)
- Redirect por papel; limpeza de sessão em 401/403

### Admin

- Usuários: listar, criar, perfil, editar, desativar; tela de credenciais
- Categorias, papéis, metas e restaurantes: CRUD com confirmação de exclusão
- Referências de emprego no **perfil COOK** ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)); restaurantes como catálogo auxiliar

### Cook

- Receitas: listar (próprias), criar, editar (formulário com ingredientes, medidas e prévia)

## Escopo especificado, implementação parcial

| Funcionalidade | Doc | Estado UI |
|----------------|-----|-----------|
| Perfil COOK + referências no contexto do usuário | [06-perfil-cook-contexto.md](06-perfil-cook-contexto.md) | Implementado na UI; embed de `references` no DTO de usuário ainda evolutivo na API |

## Fora do escopo atual da UI

Itens existentes ou planejados na API, **sem tela** neste frontend:

- Painel **EDITOR** (livros, aprovação/merge de ingredientes)
- Painel **TASTER** (criação de reviews)
- Fetch de credenciais (`POST /auth/register`) — tela já desenhada no perfil
- Progresso de metas (`GET /goals/{id}/progress`)
- Publicação de receita / toggle `isPublished` pela UI
- Upload de imagem de receita

Detalhamento: [Módulos e pendências](05-modulos-e-pendencias.md).

## Premissas

1. A API é a fonte de verdade do domínio; a UI aplica regras de apresentação, validação de formulário e controle de navegação.
2. Em desenvolvimento, `VITE_USE_DEMO_API=true` (padrão) usa fixtures locais; isso não altera os requisitos de produto da API.
3. Requisitos de backend evoluem no repositório da API; requisitos de tela evoluem neste `docs/`.
