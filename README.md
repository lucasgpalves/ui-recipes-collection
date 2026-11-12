# Receitou (frontend)

Área pública do Acervo de Receitas: home, busca/categorias, detalhe e login JWT contra a API FastAPI.

## Stack

- React + Vite + TypeScript
- React Router
- Config pública via variáveis `VITE_*` (sem secrets JWT no frontend)

## Configuração

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | Base das chamadas (em dev use `/api` com o proxy do Vite) |
| `VITE_API_PROXY_TARGET` | Destino do proxy em desenvolvimento (ex. `http://localhost:8080`) |

O frontend **não** embute chave privada nem secret JWT. O login chama `POST /auth/login` e guarda apenas o token opaco em `sessionStorage`. A API assina/valida com RS256 via secrets próprios.

## Desenvolvimento

1. Suba a API (`api-recipes-collection`) em `:8080` com as chaves JWT configuradas.
2. Neste repositório:

```bash
npm install
npm run dev
```

Abra a URL do Vite (geralmente `http://localhost:5173`).

## Docker

Com a API já rodando em `:8080` no host:

```bash
docker compose -f docker/docker-compose.yml up --build
```

A aplicação fica em `http://localhost:3000`. O nginx do container faz proxy de `/api` para a API (`API_UPSTREAM`, padrão `http://host.docker.internal:8080`).

Variáveis opcionais:

```bash
FRONTEND_PORT=3000
API_UPSTREAM=http://host.docker.internal:8080
```

Se a API estiver em outra rede Docker, aponte `API_UPSTREAM` para o serviço (ex. `http://api:8080`) e conecte os compose na mesma rede.

Para parar:

```bash
docker compose -f docker/docker-compose.yml down
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build
