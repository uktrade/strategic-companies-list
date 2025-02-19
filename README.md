# strategic-companies-list

A service for maintaining and securely sharing information on top tier companies.


## Developing

Install dependencies: GOV.UK Design System and a local web server:

```bash
npm install
npm install -g local-web-server
```

Run the local web server:

```bash
ws --rewrite '/assets/(.*) -> /node_modules/govuk-frontend/dist/govuk/assets/$1' --rewrite '/stylesheets/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1' --rewrite '/javascripts/(.*) -> /node_modules/govuk-frontend/dist/govuk/$1'
```

Visit http://localhost:8000/
