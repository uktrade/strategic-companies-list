Cypress.Commands.add("resetDatabase", () =>
  cy.request("GET", "/__cypress__/reset-db/")
);
