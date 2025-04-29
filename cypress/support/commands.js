Cypress.Commands.add("resetDatabase", () => {
  return cy.request("GET", "/__cypress__/reset-db/").then((response) => {
    if (!response.body.data || !response.body.data.companies) {
      throw new Error("Response doesn't contain expected data structure");
    }

    // Store companies directly in Cypress.env
    Object.entries(response.body.data.companies).forEach(([key, value]) => {
      Cypress.env(key, value);
    });

    // Store users
    Object.entries(response.body.data.users).forEach(([key, value]) => {
      Cypress.env(key, value);
    });

    // Store account managers
    Object.entries(response.body.data.accountManagers).forEach(
      ([key, value]) => {
        Cypress.env(key, value);
      }
    );

    // Store the complete data structure
    Cypress.env("testData", response.body.data);

    console.log(
      `Reset database with ${
        Object.keys(response.body.data.companies).length
      } companies`
    );
    console.log(
      "Companies:",
      Object.keys(response.body.data.companies).join(", ")
    );

    return response.body;
  });
});
