import "@testing-library/cypress/add-commands";

Cypress.Commands.add(
  "assertCompanyBriefingSection",
  (headingText, options = {}) => {
    const { content, buttonName, links, hasPrivilegedTag } = options;

    cy.findByRole("heading", { name: headingText })
      .should("be.visible")
      .parent()
      .within(() => {
        if (Array.isArray(content)) {
          cy.findByRole("list")
            .should("exist")
            .within(() => {
              content.forEach((text) => {
                cy.findByText(text).should("be.visible");
              });
            });
        } else if (content) {
          cy.findByText(content).should("be.visible");
        }
        if (buttonName) {
          cy.findByRole("button", { name: buttonName }).should("be.visible");
        }
        if (links) {
          links.forEach((link) => {
            cy.findByRole("link", { name: link.text }).should(
              "have.attr",
              "href",
              link.href
            );
          });
        }
        if (hasPrivilegedTag) {
          cy.findByText("PRIVILEGED")
            .should("be.visible")
            .and("have.attr", "class")
            .and("include", "govuk-tag--red");
        }
      });
  }
);

Cypress.Commands.add("assertCompanyBriefingSectionOrder", (sections) => {
  cy.findAllByRole("heading").then(($headings) => {
    const headingsText = $headings.map((i, el) => Cypress.$(el).text()).get();
    // Verify the sections are in the right order
    let lastIndex = -1;
    sections.forEach((section) => {
      const index = headingsText.findIndex((text) => text === section);
      expect(index).to.be.greaterThan(-1);
      expect(index).to.be.greaterThan(lastIndex);
      lastIndex = index;
    });
  });
});
