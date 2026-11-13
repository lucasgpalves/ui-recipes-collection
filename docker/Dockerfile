FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL=/api
ARG VITE_USE_DEMO_API=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_DEMO_API=$VITE_USE_DEMO_API

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache gettext

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

ENV API_UPSTREAM=http://host.docker.internal:8080

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
