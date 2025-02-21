FROM node:23-bookworm-slim

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN \
	npm install && \
	npm install -g local-web-server

COPY index.html .

CMD ws --rewrite '/assets/(.*) -> /node_modules/govuk-frontend/dist/govuk/assets/$1' --rewrite '/stylesheets/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1' --rewrite '/javascripts/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1'
