# syntax=docker/dockerfile:1

FROM node:20 AS build
WORKDIR /workspace
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY libs/contracts/package.json libs/contracts/package.json
COPY libs/view-models/package.json libs/view-models/package.json
RUN npm ci
COPY . .
RUN npm run build --workspace @architecture-browser-platform/web

FROM nginx:1.27-alpine
COPY apps/web/docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
