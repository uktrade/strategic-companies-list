FROM node:23-bookworm-slim AS static-resources

WORKDIR /app

COPY package.json package-lock.json .

RUN npm ci

COPY webpack.config.js browser.js .

RUN npm run build

FROM python:3.13-slim-bookworm

RUN \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        nginx \
        nginx-extras \
        parallel && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m scl

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY nginx.conf /etc/nginx/nginx.conf

# Copy in assets (images and fonts), stylesheets and JavaScript files to where they're expected
COPY --from=static-resources /app/bundle.js ./scl/core/static/bundle.js
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk/assets ./scl/core/static
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.* ./scl/core/static

COPY start.sh .
COPY manage.py .
COPY scl ./scl

RUN \
    python manage.py collectstatic && \
    find /app/assets/ -type f -exec gzip -k -9 {} \;

USER scl

CMD ["./start.sh"]
