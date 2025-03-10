FROM node:23-bookworm-slim AS static-resources

WORKDIR /app

COPY package.json package-lock.json .
RUN npm ci

COPY webpack.config.js browser.js .
RUN npm run build


FROM python:3.13-slim-bookworm AS common

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
RUN pip install -r requirements.txt

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
RUN sed -i 's/python manage.py runserver 0.0.0.0:8001/python manage.py runserver 0.0.0.0:8002 --settings=scl.settings_vde/' start-dev.sh

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
