# Regras de negócio da UI

Regras **da interface**: validação de formulário, máscaras, guards visuais, confirmações e feedback.  
Regras de domínio (unicidade, ownership na API, publicação, progresso etc.): ver `../api-recipes-collection/docs/`.

---

## RN-UI-AUTH — Sessão e acesso

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-AUTH-01 | Token fica só em `sessionStorage` | Não há persistência em `localStorage` nem secret JWT no cliente; API real usa Bearer a partir desse token ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)) |
| RN-UI-AUTH-02 | Login exige usuário e senha | Campos `required`; submit bloqueado pelo HTML se vazios |
| RN-UI-AUTH-03 | Username enviado com trim | Espaços nas pontas não fazem parte do username |
| RN-UI-AUTH-04 | Erros de credencial são genéricos | 401/403 → “Usuário ou senha inválidos.” |
| RN-UI-AUTH-05 | 401/403 em qualquer request limpa sessão | Handler remove token e estado de auth |
| RN-UI-AUTH-06 | Painel admin só para `ADMIN` | `RequireAdmin` redireciona demais usuários |
| RN-UI-AUTH-07 | Painel cook só para `COOK` | `RequireCook` redireciona demais usuários |
| RN-UI-AUTH-08 | Pós-login por papel | ADMIN → `/admin/usuarios`; COOK → `/cook/receitas`; resto → `/` |
| RN-UI-AUTH-09 | Credenciais só para usuário ativo | Perfil desativado não exibe formulário de acesso |
| RN-UI-AUTH-10 | Formulário de acesso | Username (trim), senha e confirmação obrigatórios; senhas iguais; senha ≥ 4 caracteres |
| RN-UI-AUTH-11 | `userId` vem da rota | Não é editável no formulário; vinculado ao perfil aberto |

**Status:** tela desenhada; integração `POST /auth/register` **aprovada** em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente).

---

## RN-UI-USR — Usuários (formulário admin)

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-USR-01 | CPF com máscara visual | Exibição `000.000.000-00`; máximo 14 caracteres na máscara |
| RN-UI-USR-02 | CPF enviado só com dígitos | Payload contém até 11 dígitos, sem pontuação |
| RN-UI-USR-03 | CPF válido (algoritmo) | Rejeita tamanho ≠ 11, sequência repetida e dígitos verificadores inválidos |
| RN-UI-USR-04 | Nome e papel obrigatórios | Trim; papel em UPPERCASE; deve existir na lista de roles carregada |
| RN-UI-USR-05 | Salário ≥ 0 | Máscara monetária `R$ 0,00` (centavos pela esquerda); valor numérico ≥ 0 |
| RN-UI-USR-06 | Nome fantasia e restaurante opcionais | Trim; vazio → `null` no payload |
| RN-UI-USR-07 | Submit com roles indisponíveis | Botão desabilitado enquanto roles carregam ou lista vazia |
| RN-UI-USR-08 | Usuário desativado não edita | Tela de edição bloqueada se `terminatedAt` preenchido |
| RN-UI-USR-09 | Desativar exige confirmação | Diálogo danger; cancelar não chama a API |

**Referência API:** gestão de usuários e terminate em [Funcionalidades v1](../../api-recipes-collection/docs/02-funcionalidades-atuais.md) e RNs v2 de usuário/acesso.

---

## RN-UI-CAT — Categorias

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-CAT-01 | Nome obrigatório | Trim; vazio bloqueia submit |
| RN-UI-CAT-02 | Descrição opcional | Vazio → `null` |
| RN-UI-CAT-03 | Exclusão confirma | Diálogo “Excluir…” / ConfirmLabel “Excluir” / tone danger |

---

## RN-UI-ROL — Papéis

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-ROL-01 | Nome obrigatório em maiúsculas | Input força UPPERCASE |
| RN-UI-ROL-02 | Descrição opcional | Trim ou nulo/vazio conforme form |
| RN-UI-ROL-03 | Exclusão confirma | Mesmo padrão de categorias |

---

## RN-UI-MET — Metas

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-MET-01 | Título e papel obrigatórios | Trim; papel UPPERCASE e presente na lista |
| RN-UI-MET-02 | `amount` inteiro ≥ 1 | Valor inválido bloqueia submit com mensagem |
| RN-UI-MET-03 | Descrição opcional | Trim ou `''` |
| RN-UI-MET-04 | Exclusão confirma | Padrão danger |

**Nota UI:** progresso (`GoalProgress`) — UI **aprovada** em [FN-UI-API-FETCH](07-fn-ui-api-fetch.md) (implementação pendente). Cálculo na API: docs da API / `RN-MET`.

---

## RN-UI-RST — Restaurantes

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-RST-01 | Nome, cidade, endereço e tipo obrigatórios | Trim; vazios bloqueiam submit |
| RN-UI-RST-02 | Categoria obrigatória | `categoryId` deve existir na lista carregada |
| RN-UI-RST-03 | CNPJ opcional | Trim ou `null` |
| RN-UI-RST-04 | Exclusão confirma | Diálogo danger |

## RN-UI-JOB — Referências de emprego

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-JOB-01 | Só COOK ativo | No atalho global, select limitado a `COOK` sem `terminatedAt`; no perfil, `userId` implícito |
| RN-UI-JOB-02 | Restaurante cadastrado | Nome escolhido na lista de restaurantes |
| RN-UI-JOB-03 | `startsAt` obrigatório | Input date válido |
| RN-UI-JOB-04 | `endsAt` opcional | Vazio = aberto; se preenchido, `endsAt >= startsAt` |
| RN-UI-JOB-05 | Contato obrigatório | Regex mínima: dígitos e `+()- ` |
| RN-UI-JOB-06 | Exclusão confirma | Diálogo danger |
| RN-UI-JOB-07 | Hub no perfil COOK | Seção Experiência só se `roleName === 'COOK'`; CRUD sob `/admin/usuarios/:id/referencias/*` |
| RN-UI-JOB-08 | Restaurante como apoio | Atalho de cadastro no fluxo com retorno e restaurante pré-selecionado |

**Referência API:** `docs/versao-2/RN-referencia-emprego.md`.

---

## RN-UI-REC — Receitas (formulário cook)

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-REC-01 | Nome, categoria e método obrigatórios | Trim; mensagem de validação se faltar |
| RN-UI-REC-02 | Porções inteiro > 0 | Default 1 |
| RN-UI-REC-03 | Tempo de preparo inteiro ≥ 0 | Default 30; na edição deriva de `durationMinutes` |
| RN-UI-REC-04 | Descrição opcional | Trim ou `''` |
| RN-UI-REC-05 | Pelo menos 1 ingrediente na lista | Lista vazia bloqueia submit |
| RN-UI-REC-06 | Quantidade de cada item > 0 | Valida itens já adicionados |
| RN-UI-REC-07 | Draft pendente bloqueia submit | Se nome digitado sem “Adicionar à lista”, avisa e não envia |
| RN-UI-REC-08 | Composer: Enter adiciona | Enter nos campos do composer chama adicionar |
| RN-UI-REC-09 | Unidade canônica | Seleção entre medidas suportadas (`g`, `kg`, `ml`, `L`, xícara, colheres, unidade, lata, folha, ramo, pitada, a gosto) |
| RN-UI-REC-10 | Edição só da própria receita | Se autor ≠ username da sessão, UI impede o fluxo de edição |
| RN-UI-REC-11 | Listagem cook = próprias | Filtra pela identidade da sessão |

**Referência API:** ciclo de receita, unicidade e ownership — `api-recipes-collection/docs/versao-2/`.

**Requisito ([FN-UI-API-FETCH](07-fn-ui-api-fetch.md)):** create/update usam `userId` da sessão autenticada (não constante de demo). Ownership na API: docs v2.

---

## RN-UI-PUB — Área pública

| ID | Regra | Critério de aceite |
|----|--------|-------------------|
| RN-UI-PUB-01 | Leitura sem login | Home, busca, categorias e detalhe acessíveis anonimamente |
| RN-UI-PUB-02 | Filtro de busca no cliente | `q` casa com nome, categoria ou autor (case-insensitive onde aplicável) |
| RN-UI-PUB-03 | Categorias com fallback | API vazia → lista comum local para chips |
| RN-UI-PUB-04 | Reviews só como média | Detalhe não lista reviews; só `StarRating` da média |
| RN-UI-PUB-05 | PDF só fora do demo | Link de download oculto quando `VITE_USE_DEMO_API` ativo |
| RN-UI-PUB-06 | Card sem id não navega | `id == null` não renderiza link útil |

---

## RN-UI-UX — Feedback compartilhado

### Confirmação (`useConfirm`)

- Título default: “Confirmar”; cancelar: “Cancelar”
- Escape / Cancel → retorna falso (aborta)
- Confirmação aberta em paralelo → rejeita a segunda

### Notificações

| Tipo | Duração aproximada |
|------|--------------------|
| success | 3,2 s |
| error | 5,2 s |
| warning | 4,5 s |
| info | 4 s |

Fila máxima: 4 toasts. Validação → warning; falha de operação/carga → error; sucesso de CRUD → success.

---

## Demo vs. API real (impacto na UI)

| Aspecto | Demo | API real |
|---------|------|----------|
| Credenciais conhecidas | `admin/admin`, `cook/cook` | Contas provisionadas na API |
| Subtítulo do login | Indica modo demo | “Acesse com as credenciais da API” |
| `id` em users/roles | Presente nos fixtures | Pode faltar → ações de editar/excluir limitadas (“Sem id”) |
| Download PDF | Oculto | Visível no detalhe |
| Latência | Simulada | Rede |

A existência do modo demo **não** cria regra de negócio de produto; é suporte a desenvolvimento.
