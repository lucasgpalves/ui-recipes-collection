# Mapa de rotas e acesso

## Rotas

| Rota | Layout / guard | Tela |
|------|----------------|------|
| `/login` | Sem layout público | Login |
| `/` | `PublicLayout` | Home |
| `/receitas` | `PublicLayout` | Busca / listagem (opcional `?q=`) |
| `/receitas/:id` | `PublicLayout` | Detalhe da receita |
| `/categorias/:name` | `PublicLayout` | Listagem filtrada por categoria |
| `/admin` | `RequireAdmin` | Redirect → `usuarios` |
| `/admin/usuarios` | Admin | Listagem de usuários |
| `/admin/usuarios/novo` | Admin | Cadastro de usuário |
| `/admin/usuarios/:id` | Admin | Perfil (hub; COOK inclui Experiência) |
| `/admin/usuarios/:id/editar` | Admin | Edição |
| `/admin/usuarios/:id/credenciais` | Admin | Criar acesso (username/senha) |
| `/admin/usuarios/:id/referencias/nova` | Admin | Nova referência no contexto do COOK |
| `/admin/usuarios/:id/referencias/:referenceId/editar` | Admin | Editar referência no contexto do COOK |
| `/admin/categorias` | Admin | Listagem |
| `/admin/categorias/nova` | Admin | Cadastro |
| `/admin/categorias/:id/editar` | Admin | Edição |
| `/admin/papeis` | Admin | Listagem |
| `/admin/papeis/novo` | Admin | Cadastro |
| `/admin/papeis/:id/editar` | Admin | Edição |
| `/admin/metas` | Admin | Listagem |
| `/admin/metas/nova` | Admin | Cadastro |
| `/admin/metas/:id/editar` | Admin | Edição |
| `/admin/restaurantes` | Admin | Listagem |
| `/admin/restaurantes/novo` | Admin | Cadastro |
| `/admin/restaurantes/:id/editar` | Admin | Edição |
| `/admin/referencias` | Admin | Listagem global (atalho; jornada principal = perfil COOK) |
| `/admin/referencias/nova` | Admin | Cadastro global (atalho) |
| `/admin/referencias/:id/editar` | Admin | Edição global (atalho) |
| `/cook` | `RequireCook` | Redirect → `receitas` |
| `/cook/receitas` | Cook | Minhas receitas |
| `/cook/receitas/nova` | Cook | Nova receita |
| `/cook/receitas/:id/editar` | Cook | Editar receita |
| `*` | — | Redirect → `/` |

## Guards

### `RequireAdmin`

1. Sem autenticação → `/login`
2. Autenticado e `role !== 'ADMIN'` → `/`
3. Caso contrário → renderiza outlet do admin

### `RequireCook`

1. Sem autenticação → `/login`
2. Autenticado e `role !== 'COOK'` → `/`
3. Caso contrário → renderiza outlet do cook

### Destino pós-login (`homePathForRole`)

| Role | Destino |
|------|---------|
| `ADMIN` | `/admin/usuarios` |
| `COOK` | `/cook/receitas` |
| Demais / null | `/` |

## Layouts

| Layout | Conteúdo típico |
|--------|-----------------|
| `PublicLayout` | Navbar (marca, chips de categoria, login/sair), área principal |
| `AdminLayout` | Sidebar (usuários, categorias, papéis, metas, restaurantes), “Ver site”, sair — referências via perfil COOK |
| `CookLayout` | Sidebar (receitas: listagem / cadastro), “Ver site”, sair |

## Sessão

| Item | Valor |
|------|--------|
| Chave | `receitou.auth.token` |
| Storage | API real: cookie HttpOnly; demo: `sessionStorage` |
| Expiração de sessão na UI | Remoção no logout ou em resposta 401/403 do cliente HTTP |

Papel e subject são lidos do token (implementação atual: parser do token demo). Comportamento esperado com JWT real da API: a UI deve expor `role` e `username` de forma compatível com os guards acima.
