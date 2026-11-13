# Módulos e pendências — Interface

Estado da UI em relação aos requisitos de tela. Capacidade da API correspondente: consultar `../api-recipes-collection/docs/` (não repetida aqui).

---

## Matriz de módulos

| Módulo UI | Status | Observação |
|-----------|--------|------------|
| Área pública (home, busca, categorias, detalhe) | Feito | Reviews só como média; PDF fora do demo |
| Login / sessão / guards ADMIN e COOK | Feito | Parser de role alinhado ao token demo; JWT real exige leitura de claims |
| Admin — usuários | Feito (parcial) | Falta UI de `auth/register` no perfil; ver pendências |
| Admin — categorias | Feito | CRUD |
| Admin — papéis | Feito | CRUD; depende de `id` na resposta para editar/excluir |
| Admin — metas | Feito (parcial) | CRUD; sem tela de progresso |
| Admin — restaurantes | Não iniciado | Domínio na API |
| Admin — referências de emprego | Não iniciado | Depende de usuário COOK na API |
| Cook — receitas (list / create / edit) | Feito | Prévia + ingredientes + medidas |
| Cook — CRUD de medidas/ingredientes avulso | Não iniciado | Medidas embutidas no form de receita |
| Editor — livros / ingredientes | Não iniciado | Sem rotas |
| Taster — reviews | Não iniciado | Sem formulário de avaliação |

---

## Pendências priorizadas (UI)

### P1 — Fechar admin de usuários

1. **Credenciais de acesso** — tela/ação no perfil para `POST /auth/register` (`username`, `password`, `userId`) após o cadastro do perfil.
2. **`id` estável na API** — sem `id` em listagem/detalhe, edição e exclusão quebram fora do demo (ajuste na API; UI já consome quando presente).
3. Polimentos opcionais:
   - CPF imutável na edição
   - Filtro/busca na listagem (nome, papel, situação)
   - Campos condicionais por papel (`fantasyName` / `restaurantName`)

### P2 — Cook

1. Amarrar `userId` do payload ao ator autenticado (hoje fixo no demo).
2. CRUD explícito de ingredientes/medidas fora do formulário de receita (se produto exigir).
3. Ação de publicação / indicador `isPublished` editável (se regra de negócio liberar na API).

### P3 — Novos painéis

1. **EDITOR** — shell + livros + fluxo de ingredientes (approve / aliases / merge).
2. **TASTER** — criar/editar review na receita.
3. Admin: restaurantes e job references.

### P4 — Metas

1. Tela ou bloco de **progresso** (`GET /goals/{id}/progress`) por usuário/mês.

---

## Alinhamento com a API

| Tema | Onde consultar na API |
|------|------------------------|
| Endpoints e comportamento v1 | `docs/02-funcionalidades-atuais.md` |
| Matriz de papéis HTTP | `docs/03-papeis-e-permissoes.md` |
| Ownership, ciclo de receita, reviews, livros, ingredientes, metas, terminate, job refs | `docs/versao-2/` |

Quando uma pendência de UI depender de contrato ainda incompleto na API (ex.: `id` no DTO, persistência de `restaurantName`), a correção pode ser **só API**, **só UI** ou **ambos** — registrar a decisão no PR correspondente, sem misturar RNs nos dois `docs/` sem necessidade.
