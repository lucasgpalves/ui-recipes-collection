# Admin — pendências e próximos módulos

## Usuários (perfil) — quase fechado

Já coberto no front (modo demo): cadastro, listagem, perfil, edição, desativação, máscaras (CPF/salário), validação de CPF, papéis via `GET /roles`.

### Pendente

1. **Credenciais de acesso** — UI para `POST /auth/register` (`RegisterRequest`: username, password, userId) no perfil do usuário, após o cadastro do perfil.
2. **`id` no `UserResponseDTO` / `RoleResponseDTO` (API)** — a API real ainda não devolve `id` em listagem/detalhe; o demo inclui `id`. Sem isso, edição e exclusão quebram fora do demo.
3. **Polimentos opcionais**
   - CPF imutável na edição
   - Filtro/busca na listagem (nome, papel, situação)
   - Campos condicionais por papel (`fantasyName` / `restaurantName`)
4. **Alinhamento API** — `restaurantName` existe no `UserRequestDTO` mas o service atual não persiste; salário na listagem foi omitido no front (ajustável no DTO se desejado).

## Próximos módulos admin (telas)

Ordem sugerida para fechar fatias verticais no mesmo padrão (sidebar + listagem + formulário):

| Módulo        | Prioridade | Notas                                      |
|---------------|------------|--------------------------------------------|
| Categorias    | Feito (demo) | Listagem, cadastro, edição, exclusão      |
| Roles / Papéis| Feito (demo) | CRUD; `id` só no demo (API ainda não devolve) |
| Goals / Metas | Feito (demo) | CRUD por papel; progresso (`/progress`) pendente |
| Restaurants   | Depois     | Ligado a usuários / job references         |
| Job references| Depois     | Depende de usuário COOK                    |

## Painéis por tipo de usuário (fora do admin puro)

Ainda não iniciados — superfícies autenticadas por papel:

- **COOK** — receitas, ingredientes, medidas
- **EDITOR** — livros / seleção de receitas
- **TASTER** — reviews

## Decisão atual

Pendências de usuários registradas acima. Fatias **Categorias**, **Papéis** e **Metas** finalizadas no admin (demo). Progresso de meta (`GET /goals/{id}/progress?userId=`) fica para um próximo incremento. Próximo módulo natural: **Restaurants**.
