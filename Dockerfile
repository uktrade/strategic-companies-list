FROM oven/bun:1.2.5-slim AS static-resources

WORKDIR /app

COPY package.json bun.lock .
RUN bun install

COPY browser.js bunfig.toml .
RUN bun run build


FROM python:3.13-slim-bookworm AS common
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        nginx \
        nginx-extras \
        parallel \
        postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

COPY nginx.conf /etc/nginx/nginx.conf
COPY manage.py .
COPY scl ./scl

# Copy in assets (images and fonts), stylesheets and JavaScript files to where they're expected
COPY --from=static-resources /app/bundle.js ./scl/static/static/bundle.js
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk/assets ./scl/static/static
COPY --from=static-resources /app/node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.* ./scl/static/static
RUN \
    python manage.py collectstatic && \
    find /app/assets/ -type f -exec gzip -k -9 {} \;

RUN useradd -m scl


FROM common AS dev

# Disable nginx serving of static assets, so Django serves them without collect static
RUN sed -i 's/assets/__dummy/' /etc/nginx/nginx.conf

COPY start-dev.sh .

ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT}
USER scl

CMD ["./start-dev.sh"]

FROM common AS vde

# Sidestep port overlap between SSO and Django services in VDE host network
RUN sed -i 's/server 127.0.0.1:8001;/server 127.0.0.1:8002;/' /etc/nginx/nginx.conf
# Disable nginx serving of static assets, so Django serves them without collect static
RUN sed -i 's/assets/__dummy/' /etc/nginx/nginx.conf

COPY start-dev.sh .
RUN sed -i 's/python manage.py runserver 0.0.0.0:8001/python manage.py runserver 0.0.0.0:8002/' start-dev.sh

RUN sed -i 's/CSRF_COOKIE_SECURE = True/CSRF_COOKIE_SECURE = False/' scl/settings.py
RUN sed -i 's/CSRF_COOKIE_DOMAIN/c\CSRF_COOKIE_DOMAIN = None' scl/settings.py || echo 'CSRF_COOKIE_DOMAIN = None' >> scl/settings.py
RUN sed -i 's/SESSION_COOKIE_SECURE = True/SESSION_COOKIE_SECURE = False/' scl/settings.py
RUN sed -i 's/SESSION_COOKIE_DOMAIN/c\SESSION_COOKIE_DOMAIN = None' scl/settings.py || echo 'SESSION_COOKIE_DOMAIN = None' >> scl/settings.py

ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT}
USER scl

CMD ["./start-dev.sh"]

FROM common AS prod

COPY start.sh .

ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT}
USER scl

CMD ["./start.sh"]
