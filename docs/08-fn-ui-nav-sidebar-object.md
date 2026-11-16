# Funcionalidade — Sidebar: item = nome do objeto

**ID:** `FN-UI-NAV-SIDEBAR-OBJECT`  
**Status:** **implementado** (validado por testes de layout)  
**Versão:** 1.0  
**Substitui rascunho:** `FN-UI-NAV-MODAL` (abordagem com modais **rejeitada**)

Este documento define a mudança de navegação nos layouts Admin e Cook: a sidebar passa a exibir **apenas o nome do objeto** como item navegável (ex.: “Receitas”), apontando para a listagem. Cadastro e edição **permanecem em páginas dedicadas e rotas existentes**, acessíveis pelos botões da listagem — **não** via submenu da sidebar e **não** via modal.

---

## Decisões registradas (stakeholder)

| Decisão | Escolha oficial |
|---------|-----------------|
| Forma de create/edit | **Páginas completas** e rotas atuais (`/novo`, `/nova`, `…/editar`, etc.) |
| Modais para formulários | **Não** — fora de escopo |
| Sidebar | Remover itens **Listagem** e **Cadastro**; um único item com o **nome do objeto** → rota de listagem |
| Entrada para create/edit | Botões da listagem (ex.: “Nova receita”, “Editar”) e demais links de tela já existentes |
| Escopo de telas | Domínios que hoje têm pares Listagem/Cadastro na sidebar (Cook + Admin) |

---

## 1. Feature Overview

Simplificar a sidebar dos painéis autenticados:

1. Eliminar o submenu **Listagem** / **Cadastro** sob cada domínio.
2. Tornar o **nome do objeto** o único item de navegação daquele domínio, ligado à listagem.
3. Manter create/edit como telas full-page nas rotas já mapeadas em [mapa de rotas](02-mapa-de-rotas.md).

**Fora do escopo:**

- Converter create/edit em modais ou drawers.
- Remover ou alterar rotas `/novo`, `/nova`, `…/editar` (exceto se um redirect legado for necessário por outro motivo — **não** exigido por esta FN).
- Alterar área pública (`PublicLayout`), login ou guards.
- Adicionar “Referências” de volta à sidebar (permanece conforme [FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)).
- Mudar formulários, validações, APIs ou fluxos de negócio além da navegação da sidebar.

---

## 2. Business Context

### Comportamento atual (baseline)

| Layout | Arquivo | Hoje |
|--------|---------|------|
| Cook | `ui/src/app/layout/CookLayout.tsx` | Rótulo de seção “Receitas” + NavLinks **Listagem** → `/cook/receitas` e **Cadastro** → `/cook/receitas/nova` |
| Admin | `ui/src/app/layout/AdminLayout.tsx` | Mesmo padrão para Usuários, Categorias, Papéis, Metas, Restaurantes |

Listagens já possuem CTAs (“Novo/Nova …”) e ações “Editar” apontando para as rotas de create/edit. Create/edit pages usam link “Listagem” de volta à lista — isso **não** é o submenu da sidebar e pode permanecer.

### Objetivo

Reduzir ruído na sidebar: um domínio = um destino (a listagem). Create/edit continuam na jornada a partir da lista.

---

## 3. Functional Requirements

| ID | Requisito |
|----|-----------|
| **RF-UI-NAV-01** | Em `CookLayout` e `AdminLayout`, remover os NavLinks (ou equivalentes) rotulados **Listagem** e **Cadastro** de cada domínio listado em RF-UI-NAV-02. |
| **RF-UI-NAV-02** | A sidebar deve exibir **um único item navegável por domínio**, com o **nome do objeto** como rótulo, apontando para a rota de listagem: |

| Domínio | Rótulo do item | Rota |
|---------|----------------|------|
| Receitas (Cook) | Receitas | `/cook/receitas` |
| Usuários | Usuários | `/admin/usuarios` |
| Categorias | Categorias | `/admin/categorias` |
| Papéis | Papéis | `/admin/papeis` |
| Metas | Metas | `/admin/metas` |
| Restaurantes | Restaurantes | `/admin/restaurantes` |

| ID | Requisito |
|----|-----------|
| **RF-UI-NAV-03** | O nome do objeto **é** o controle de navegação (link/`NavLink`), não um rótulo estático acompanhado de submenu Listagem/Cadastro. Pode-se unificar o antigo `sectionLabel` + filhos em um único item; o resultado visual/acessível deve ser um link por domínio com o nome do objeto. |
| **RF-UI-NAV-04** | Estado ativo: o item do domínio fica ativo quando a URL pertence àquele domínio (listagem **e** sub-rotas do mesmo objeto, ex.: create, edit, e no caso de usuários também perfil / credenciais / referências sob `/admin/usuarios/…`), alinhado à intenção atual de destacar a seção enquanto o usuário permanece nela. |
| **RF-UI-NAV-05** | Rotas e páginas de create/edit **permanecem** como em [02-mapa-de-rotas.md](02-mapa-de-rotas.md) e [03-fluxos-de-ui.md](03-fluxos-de-ui.md). Não introduzir modal como shell de formulário nesta FN. |
| **RF-UI-NAV-06** | Create continua iniciável pelos botões da listagem (e links equivalentes já existentes em outras telas, ex. perfil). Edit continua pelos links/botões já existentes na listagem (e perfil, quando aplicável). A sidebar **não** oferece atalho direto de cadastro. |
| **RF-UI-NAV-07** | Comportamento de “Ver site”, logout, brand link e guards permanece inalterado. |
| **RF-UI-NAV-08** | Textos de página (títulos “Cadastro”, botão fantasma “Listagem” nas telas de create/edit/perfil) **não** precisam ser removidos por esta FN; referem-se à jornada da página, não ao submenu da sidebar. |

---

## 4. Non-Functional Requirements

| ID | Requisito |
|----|-----------|
| **RNF-UI-NAV-01** | Alteração restrita a layouts de sidebar (e estilos associados se necessário); sem refatoração ampla de features. |
| **RNF-UI-NAV-02** | Manter acessibilidade: cada domínio continua com navegação clara (`nav` / `aria-label` coerente com o nome do objeto). |
| **RNF-UI-NAV-03** | Não regressar contraste, foco ou padrões CSS já usados em `AdminLayout.module.css`. |
| **RNF-UI-NAV-04** | Demo e API real: sem diferença de navegação causada por esta FN. |

---

## 5. Business Rules

| ID | Regra |
|----|-------|
| **BR-UI-NAV-01** | A sidebar não expõe item **Cadastro** (nem equivalente) para os domínios de RF-UI-NAV-02. |
| **BR-UI-NAV-02** | A sidebar não expõe item **Listagem** como filho; a listagem é o destino do próprio nome do objeto. |
| **BR-UI-NAV-03** | Referências de emprego **não** ganham item raiz na sidebar (regra já estabelecida em `FN-UI-COOK-PROFILE`). |
| **BR-UI-NAV-04** | Create/edit full-page continuam sendo o padrão de formulário desta UI até nova FN aprovada. |

---

## 6. Acceptance Criteria

| ID | Critério | Rastreio |
|----|----------|----------|
| **AC-UI-NAV-01** | Em Cook, a sidebar mostra o item **Receitas** e **não** mostra NavLinks **Listagem** nem **Cadastro**. | RF-UI-NAV-01, RF-UI-NAV-02 |
| **AC-UI-NAV-02** | Em Admin, a sidebar mostra Usuários, Categorias, Papéis, Metas e Restaurantes como itens únicos; **sem** Listagem/Cadastro sob cada um. | RF-UI-NAV-01, RF-UI-NAV-02 |
| **AC-UI-NAV-03** | Clicar em cada item do objeto navega para a rota de listagem correspondente (tabela RF-UI-NAV-02). | RF-UI-NAV-02, RF-UI-NAV-03 |
| **AC-UI-NAV-04** | Em `/cook/receitas/nova` e `/cook/receitas/:id/editar`, o item **Receitas** permanece visualmente ativo (ou equivalente à regra RF-UI-NAV-04). | RF-UI-NAV-04 |
| **AC-UI-NAV-05** | Em rotas admin de create/edit (e sub-rotas de usuários sob `/admin/usuarios/…`), o item do domínio correspondente permanece ativo. | RF-UI-NAV-04 |
| **AC-UI-NAV-06** | “Nova receita” / “Novo usuário” / demais CTAs de listagem ainda navegam para as rotas create existentes e renderizam a página full-page. | RF-UI-NAV-05, RF-UI-NAV-06 |
| **AC-UI-NAV-07** | “Editar” na listagem ainda navega para `…/editar` (página full-page). | RF-UI-NAV-05, RF-UI-NAV-06 |
| **AC-UI-NAV-08** | Não há modal de create/edit introduzido por esta mudança. | Decisão stakeholder, RF-UI-NAV-05 |
| **AC-UI-NAV-09** | Documentação listada na §8 atualizada após implementação verificada. | Docs sync |

Checklist de implementação (marcar só com evidência):

- [x] AC-UI-NAV-01 — `cookLayout.nav.test.tsx`
- [x] AC-UI-NAV-02 — `adminLayout.nav.test.tsx`
- [x] AC-UI-NAV-03 — `cookLayout.nav.test.tsx` / `adminLayout.nav.test.tsx`
- [x] AC-UI-NAV-04 — `cookLayout.nav.test.tsx`
- [x] AC-UI-NAV-05 — `adminLayout.nav.test.tsx`
- [x] AC-UI-NAV-06 — rotas/CTAs de create intactos (`App.tsx` + `*ListPage`); sem mudança de shell
- [x] AC-UI-NAV-07 — rotas/CTAs de edit intactos; sem mudança de shell
- [x] AC-UI-NAV-08 — nenhum modal de create/edit introduzido
- [x] AC-UI-NAV-09 — docs sincronizados (`02`, `03`, `05`, `README`, este arquivo)

---

## 7. Edge Cases

| Caso | Esperado |
|------|----------|
| Usuário em `/admin/usuarios/:id` (perfil) | Item **Usuários** ativo; sem item Cadastro na sidebar |
| Usuário em `/admin/usuarios/novo` | Chegou via CTA da lista (ou URL direta); item **Usuários** ativo; sidebar sem Cadastro |
| Bookmark antigo de `/cook/receitas/nova` | Continua funcionando (rota intacta) |
| Teclado / leitor de tela | Um link por domínio; labels compreensíveis (nome do objeto) |

---

## 8. Dependencies, constraints e docs a atualizar pós-implementação

### Dependências / impacto

- Arquivos principais: `CookLayout.tsx`, `AdminLayout.tsx` (+ CSS se a hierarquia label/nav mudar).
- `App.tsx` e páginas create/edit: **sem mudança obrigatória**.
- Fluxos de `returnTo` (restaurante no meio de referência): **sem impacto** esperado.

### Documentação a sincronizar após implementação validada

| Documento | Atualização |
|-----------|-------------|
| Este arquivo (`08-fn-ui-nav-sidebar-object.md`) | Marcar checklist AC como `[x]` com evidência |
| [02-mapa-de-rotas.md](02-mapa-de-rotas.md) | Seção **Layouts**: Cook/Admin — sidebar com nomes de objeto (não “listagem / cadastro”) |
| [03-fluxos-de-ui.md](03-fluxos-de-ui.md) | Se mencionar navegação via sidebar Cadastro, alinhar: entrada de create = CTA da listagem |
| [01-visao-e-escopo.md](01-visao-e-escopo.md) | Ajuste mínimo se descrever submenu da sidebar |
| [05-modulos-e-pendencias.md](05-modulos-e-pendencias.md) | Registrar FN concluída / observação de navegação, se houver checklist de UI |
| [README.md](README.md) | Incluir este FN no índice da wiki UI |

Não é necessário alterar docs da API.

---

## 9. Testing Recommendations

### Testes existentes

| Teste | Impacto |
|-------|---------|
| `cookMinePage.apiFetch.test.tsx` | Lista/API — provavelmente intacto |
| `credentialsRegister.apiFetch.test.tsx` | Stub “Listagem” é título de rota de teste, **não** sidebar |
| Demais `*.apiFetch.test.*` | Sem asserções encontradas a Listagem/Cadastro da sidebar |

**Lacuna:** não há teste automatizado cobrindo o submenu atual. Recomenda-se adicionar testes de layout (Cook/Admin) para AC-UI-NAV-01–05.

### Sugestão de novos testes

1. Render `CookLayout`: existe link “Receitas” para `/cook/receitas`; não existe link de nav “Cadastro” / “Listagem”.
2. Render `AdminLayout`: um link por domínio da tabela; ausência de pares Listagem/Cadastro.
3. Com `MemoryRouter` em rota create/edit, classe/estado ativo no item do objeto (quando testável).

---

## 10. Traceability

| Intenção do usuário | Requisitos / AC |
|---------------------|-----------------|
| Remover Listagem/Cadastro da sidebar | RF-UI-NAV-01, AC-UI-NAV-01/02 |
| Só o nome do objeto na sidebar | RF-UI-NAV-02/03, AC-UI-NAV-03 |
| Create/edit via botões da lista, full-page | RF-UI-NAV-05/06, AC-UI-NAV-06/07/08 |
| Sem modais | Decisão stakeholder, AC-UI-NAV-08 |

Identificador estável para PRs/issues: **`FN-UI-NAV-SIDEBAR-OBJECT`**.
