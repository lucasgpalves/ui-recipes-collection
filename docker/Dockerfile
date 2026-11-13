# DEPRECATED: use docker/Dockerfile.frontend + docker/Dockerfile.nginx via
# docker/docker-compose.yml (assets volume + nginx gateway).
#
# Kept as a thin pointer so old `docker build -f docker/Dockerfile` commands fail clearly.
FROM alpine:3.21
RUN printf '%s\n' \
  'This monolithic image was replaced.' \
  'Build with: docker compose -f docker/docker-compose.yml up -d --build' \
  'See docker/Dockerfile.frontend and docker/Dockerfile.nginx.' \
  >&2; exit 1
