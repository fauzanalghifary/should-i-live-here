FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

RUN pnpm --dir apps/web build

FROM nginx:1.29-alpine

ENV WEB_API_UPSTREAM=http://api:8080

COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
