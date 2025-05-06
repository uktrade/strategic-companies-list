Cypress.Commands.add("resetDatabase", () =>
  cy.request("GET", "/__cypress__/reset-db/")
);

Cypress.Commands.add(
  "fillAndSubmitEngagementForm",
  ({ title, date, details, shouldSubmit = true, shouldCancel }) => {
    cy.findByRole("heading", { name: "Add engagement" })
      .parent()
      .within(() => {
        if (title) {
          cy.findByLabelText("Title").type(title);
        }

        if (date) {
          cy.findByLabelText("Date").type(date);
        }

        if (details) {
          cy.findByLabelText("Details").type(details);
        }

        if (shouldSubmit) {
          cy.clickButton("Save");
        } else if (shouldCancel) {
          cy.clickButton("Cancel");
        }
      });
  }
);
