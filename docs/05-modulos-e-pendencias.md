# Módulos e pendências — Interface

Estado da UI em relação aos requisitos de tela. Capacidade da API correspondente: consultar `../api-recipes-collection/docs/` (não repetida aqui).

---

## Matriz de módulos

| Módulo UI | Status | Observação |
|-----------|--------|------------|
| Área pública (home, busca, categorias, detalhe) | Feito | Reviews só como média; PDF fora do demo |
| Login / sessão / guards ADMIN e COOK | Feito (gap vs spec) | Login/logout JWT em `sessionStorage` (RF-UI-API-05/07); restauração no boot e clear 403 ainda gap ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)) |
| Admin — usuários | Feito (parcial) | Credenciais: fetch `POST /auth/register` **aprovado**, implementação pendente |
| Admin — categorias | Feito | CRUD |
| Admin — papéis | Feito | CRUD; depende de `id` na resposta para editar/excluir |
| Admin — metas | Feito (parcial) | CRUD; UI GoalProgress **aprovada**, implementação pendente |
| Admin — restaurantes | Feito (demo) | CRUD; `id` no demo (API pode omitir) |
| Admin — referências de emprego | Feito (demo) | Hub no perfil COOK ([FN-UI-COOK-PROFILE](06-perfil-cook-contexto.md)); rotas globais como atalho |
| Cook — receitas (list / create / edit) | Feito | Prévia + ingredientes + medidas |
| Cook — CRUD de medidas/ingredientes avulso | Não iniciado | Medidas embutidas no form de receita |
| Editor — livros / ingredientes | Não iniciado | Sem rotas |
| Taster — reviews | Não iniciado | Sem formulário de avaliação |

---

## Corte aprovado — `FN-UI-API-FETCH`

Requisitos aprovados em [07-fn-ui-api-fetch.md](07-fn-ui-api-fetch.md). **Implementação parcial.**

- **Feito:** RF-UI-API-01 — com `VITE_USE_DEMO_API=false`, facades wired usam `apiRequest` (não `demoApi`); AC-05 coberto por testes. RF-UI-API-02 — `VITE_API_BASE_URL` obrigatório; URLs `{apiBaseUrl}{path}`; AC-09 coberto por testes. RF-UI-API-03 — proxy Vite. RF-UI-API-04 — Bearer a partir de `sessionStorage` (`receitou.auth.token`); RNF-UI-API-02 coberto por testes. RF-UI-API-05 — login `POST /auth/login` persiste JWT em `sessionStorage` e atualiza auth; AC-01 coberto por testes. RF-UI-API-07 — logout remove token de `sessionStorage` e limpa estado local.
- **Pendente:** restante de (A) (RF-UI-API-06 restauração no boot; RF-UI-API-11 clear 401/403; Docker demo=false); (B) `POST /auth/register`; (C) UI GoalProgress.

---

## Pendências priorizadas (UI)

### P1 — Fechar admin de usuários

1. **Credenciais de acesso** — tela desenhada; fetch `POST /auth/register` no corte [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente).
2. **`id` estável na API** — sem `id` em listagem/detalhe, edição e exclusão quebram fora do demo (ajuste na API; UI já consome quando presente; aberto na spec, não bloqueante).
3. Polimentos opcionais:
   - CPF imutável na edição
   - Filtro/busca na listagem (nome, papel, situação)
   - Campos condicionais por papel (`fantasyName` / `restaurantName`)

### P2 — Cook

1. Amarrar `userId` do payload ao ator autenticado — requisito em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (RF-UI-API-16).
2. CRUD explícito de ingredientes/medidas fora do formulário de receita (se produto exigir).
3. Ação de publicação / indicador `isPublished` editável (se regra de negócio liberar na API).

### P2.5 — Hub perfil COOK (`FN-UI-COOK-PROFILE`) — feito na UI

1. ~~Seção **Experiência profissional** no perfil do COOK~~
2. ~~Criar/editar/remover referência a partir do perfil (`userId` implícito); restaurante como apoio~~
3. Leitura atual: `GET /references?userId=` (ou filtro local no demo). Embed em `UserResponse` ainda evolutivo na API — ver [06-perfil-cook-contexto.md](06-perfil-cook-contexto.md).
4. ~~Sidebar sem item raiz “Referências”~~

### P3 — Novos painéis

1. **EDITOR** — shell + livros + fluxo de ingredientes (approve / aliases / merge).
2. **TASTER** — criar/editar review na receita.

### P4 — Metas

1. Tela ou bloco de **progresso** (`GET /goals/{id}/progress`) por usuário/mês — no corte [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente).

---

## Alinhamento com a API

| Tema | Onde consultar na API |
|------|------------------------|
| Endpoints e comportamento v1 | `docs/02-funcionalidades-atuais.md` |
| Matriz de papéis HTTP | `docs/03-papeis-e-permissoes.md` |
| Ownership, ciclo de receita, reviews, livros, ingredientes, metas, terminate, job refs | `docs/versao-2/` |

Quando uma pendência de UI depender de contrato ainda incompleto na API (ex.: `id` no DTO, persistência de `restaurantName`), a correção pode ser **só API**, **só UI** ou **ambos** — registrar a decisão no PR correspondente, sem misturar RNs nos dois `docs/` sem necessidade.
