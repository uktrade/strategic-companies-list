FROM node:23-bookworm-slim AS static-resources

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY images ./images
COPY index.html .

FROM node:23-bookworm-slim

WORKDIR /app

RUN npm install -g local-web-server

# Copy in assets (images and fonts), stylesheets and JavaScript files to where they're expected
# (Technically copying a bit too much, but a trivial amount and can be tidied later)
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk/assets ./assets
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk ./stylesheets
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk ./javascripts

COPY images ./images
COPY index.html .

CMD ws
