# Fluxos de UI

Jornadas do usuário na interface. Regras de domínio por trás das chamadas: ver docs da API.

---

## 1. Área pública

### 1.1 Home

1. Usuário abre `/`.
2. Vê marca (Taberu FOOD), headline, texto de apoio e CTAs.
3. CTA primário **Explorar receitas** → `/receitas`.
4. CTA secundário conforme sessão:
   - COOK → **Minhas receitas** → `/cook/receitas`
   - ADMIN → **Ir ao admin** → `/admin/usuarios`
   - EDITOR → **Ir ao editor** → `/editor/ingredientes`
   - Autenticado sem painel → **Entrar como cozinheiro** → `/login`
   - Anônimo → **Entrar** → `/login`

### 1.2 Navegação por categoria e busca

1. Em páginas com navbar completa, carrega categorias (`GET /categories` ou demo).
2. Se a lista vier vazia, usa categorias comuns de fallback (ex.: Bolos, Carnes, Doces).
3. Chip **Todas** → `/receitas`.
4. Chip de categoria → `/categorias/{nome}`.
5. `SearchBar`: vazio → `/receitas`; com texto → `/receitas?q=…`.

### 1.3 Listagem / resultados

1. Carrega receitas.
2. Filtra no cliente:
   - por `categoryName` (rota de categoria), ou
   - por `q` em nome, categoria ou autor.
3. Estados: carregando / erro / vazio / grade de cards.
4. Card com `id` nulo não navega; card válido → `/receitas/:id`.

### 1.4 Detalhe da receita

1. Valida `:id` numérico.
2. Carrega receita; carrega reviews (falha de reviews → trata como lista vazia).
3. Exibe mídia (se houver), autor, data, ingredientes, porções, descrição, modo de preparo, duração.
4. Mostra média das reviews filtradas por `recipeId` (estrelas); **não** lista comentários de outros usuários.
5. Se autenticado como **TASTER**, receita publicada e não for autoavaliação: formulário/ações da própria review ([FN-UI-TASTER](12-fn-ui-taster.md)) — create (`POST /reviews`), edit (`PUT /reviews/{id}`), delete com confirmação (`DELETE /reviews/{id}`).
6. **Baixar PDF** aparece apenas fora do modo demo e com `id` válido → `{apiBase}/recipes/{id}/download`.
7. Voltar → `/receitas`.

---

## 2. Autenticação

### 2.1 Login

1. Usuário abre `/login`.
2. Se já autenticado → redirect por papel ([mapa de rotas](02-mapa-de-rotas.md)).
3. Informa usuário e senha (ambos obrigatórios no HTML).
4. Submit: `username` com trim; chama login (`POST /auth/login` na API real).
5. Sucesso (API real): cookie HttpOnly + identidade no JSON; requests com `credentials: 'include'`; navega para home do papel. Demo: JWT em `sessionStorage` + Bearer.
6. Falha 401/403 → “Usuário ou senha inválidos.”
7. Outra falha → “Não foi possível entrar. Tente novamente.”
8. Durante submit: botão desabilitado (“Entrando…”).
9. Link **Voltar ao início** → `/`.
10. Reload: API real via `GET /auth/me`; demo via `sessionStorage`; cookie/token ausente ou inválido → não autenticado.

### 2.2 Logout

1. Ação **Sair** (navbar ou sidebar): `POST /auth/logout` (API real) + limpa estado local e redireciona (`/` ou `/login`).
2. Qualquer `apiRequest` com **401**: limpa estado de auth automaticamente ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)); 403 ainda é gap.

### 2.3 Troca de contexto (admin → cook)

Na navbar pública, admin autenticado pode usar atalho que faz logout e envia a `/login` para entrar como cozinheiro (credenciais distintas).

---

## 3. Admin — usuários

### 3.1 Listagem

1. `/admin/usuarios` lista usuários.
2. Filtro opcional por papel **COOK** (atalho para a jornada de experiência).
3. Ações: **Novo usuário**, **Perfil**, **Editar**, **Desativar** (somente ativos com `id`).
4. Usuário desativado: badge “Desativado”; sem editar/desativar.

### 3.2 Desativar

1. Usuário confirma no diálogo (“Desativar usuário” / tom danger).
2. Cancelar → nenhuma chamada.
3. Confirmar → `PUT` terminate → atualiza lista → notificação de sucesso/erro.

### 3.3 Cadastro

1. Entrada pela listagem (**Novo usuário**); a sidebar não oferece atalho de cadastro ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)).
2. `/admin/usuarios/novo` → `UserForm`.
3. Sucesso: se a resposta trouxer `id` (demo), vai ao perfil; senão, volta à listagem.
4. Referência de campos/validações: [RN-UI usuários](04-regras-de-negocio-ui.md#rn-ui-usuários).

### 3.4 Perfil e edição

1. Perfil (`/admin/usuarios/:id`): leitura; atalhos **Criar acesso** / Editar / Desativar se ativo.
2. Se `roleName === 'COOK'`: seção **Experiência profissional** com listagem, adicionar, editar e remover referências ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)).
3. Edição: bloqueada se `terminatedAt` preenchido.
4. Form pré-preenchido; submit atualiza e notifica.

### 3.5 Credenciais de acesso (desenho)

1. Do perfil, **Criar acesso** → `/admin/usuarios/:id/credenciais`.
2. Tela mostra resumo do perfil (nome, papel, userId) + formulário: usuário, senha, confirmar senha.
3. Usuário desativado: formulário oculto; mensagem de bloqueio.
4. Validação local: campos obrigatórios, senhas iguais, senha ≥ 4 caracteres.
5. **Fetch `POST /auth/register` ainda não ligado** — submit válido só confirma o desenho (toast informativo + payload pronto na UI).

---

## 4. Admin — categorias, papéis e metas

Padrão comum:

1. **Listagem** com Editar e Excluir.
2. **Excluir** → confirmação danger → chamada DELETE → refresh + notify.
3. **Novo / Editar** → formulário → sucesso → volta à listagem + notify.

Rotas: ver [mapa](02-mapa-de-rotas.md). Validações: [regras UI](04-regras-de-negocio-ui.md).

---

## 4.1 Admin — restaurantes

1. `/admin/restaurantes` lista nome, cidade, tipo e categoria.
2. Cadastro/edição: nome, cidade, endereço, tipo, CNPJ (opcional), categoria (`categoryId`).
3. Exclusão com confirmação; no demo, bloqueia se houver referência de emprego ligada.

## 4.2 Admin — referências de emprego (`FN-UI-COOK-PROFILE`)

**Jornada principal:** perfil do COOK.

1. Em `/admin/usuarios/:id` (COOK), seção Experiência lista restaurante (+ cidade), período e contato.
2. **Adicionar** → `/admin/usuarios/:id/referencias/nova` com `userId` implícito (não selecionável).
3. **Editar** → `/admin/usuarios/:id/referencias/:referenceId/editar`.
4. No formulário, atalho **Cadastrar restaurante** (`returnTo` + `restaurantName` ao voltar).
5. `startsAt` obrigatório; `endsAt` opcional; contato com dígitos/`+()- `; demo rejeita sobreposição (409).

Rotas `/admin/referencias*` permanecem como atalho global (fora da sidebar).

---

## 5. Cook — receitas

### 5.1 Listagem

1. `/cook/receitas` lista receitas do cozinheiro autenticado (filtro pelo `username` da sessão).
2. Ações: **Nova receita**, **Editar**.

### 5.2 Cadastro

1. Entrada pela listagem (**Nova receita**); a sidebar não oferece atalho de cadastro ([FN-UI-NAV-SIDEBAR-OBJECT](08-fn-ui-nav-sidebar-object.md)).
2. `/cook/receitas/nova` → `RecipeForm`.
3. Usuário monta ingredientes no composer (Adicionar à lista / Enter).
4. Opcional: **Prévia** abre modal de leitura.
5. Submit válido → cria receita → `/cook/receitas`.

### 5.3 Edição

1. `/cook/receitas/:id/editar` carrega a receita.
2. Se `userName` da receita ≠ username da sessão → mensagem de não pertencimento; não segue como edição válida.
3. Form pré-preenchido (incluindo ingredientes e tempo a partir de `durationMinutes`).
4. Submit → atualiza → `/cook/receitas`.

---

## 5.1 Editor — painel (`FN-UI-EDITOR`)

### Ingredientes

1. Login EDITOR → `/editor/ingredientes`.
2. Listagem carrega `GET /ingredients` (status pending/approved/rejected).
3. Ações: **Aprovar** / **Rejeitar** / **Reabrir** conforme status; **Aliases** → página dedicada; **Merge** → `/editor/ingredientes/merge`.
4. Alias com colisão → toast de erro com `detail` da API.
5. Merge: origem ≠ destino; **Confirmar merge** → `POST /ingredients/{target}/merge`; sucesso remove a origem da listagem.

### Livros

1. `/editor/livros` lista livros; CTA **Novo livro**.
2. Cadastro: ISBN, título, descrição, IDs de receitas → `POST /books`.
3. Detalhe: **Publicar** → `PATCH /books/{id}`; sucesso marca **Publicado**; falha exibe motivos da API. Sem unpublish.

### Fila editorial

1. `/editor/receitas` (EDITOR ou ADMIN) carrega `GET /recipes/editorial`.
2. Filtros: categoria, somente avaliadas/publicadas, chef, busca → query params combináveis.
3. Sidebar ADMIN na fila mostra só **Receitas**.

---

## 6. Padrões transversais de fluxo

| Padrão | Comportamento |
|--------|----------------|
| Loading de lista | Mensagem de carregamento até a promise resolver |
| Lista vazia | Mensagem específica (“Nenhuma…” / equivalente) |
| Erro de carga | Mensagem + notify de erro quando aplicável |
| Submit | Botão desabilitado; erros de validação no form + toast warning |
| Confirmação destrutiva | Modal bloqueante; Escape/Cancel = aborta |
