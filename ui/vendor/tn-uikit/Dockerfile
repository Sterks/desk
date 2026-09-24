ARG DOCKER_PROXY_HOST_1=docker.io
FROM $DOCKER_PROXY_HOST_1/node:22 as builder

# В образе установка git-хуков (prepare/simple-git-hooks) не нужна
ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=1

WORKDIR /app

# commands.js нужен в слое установки: он висит на postinstall-хуке
COPY ./package*.json ./commands.js /app/
RUN npm install --fund false --audit false --silent
COPY . /app
RUN npm run story:build

FROM $DOCKER_PROXY_HOST_1/nginx:1.25-alpine
WORKDIR /var/www/html
COPY .nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx /app/dist .
EXPOSE 80
