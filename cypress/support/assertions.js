import "@testing-library/cypress/add-commands";

/**
 * Asserts that a company briefing section exists with specified content and elements
 *
 * This command finds a section heading with the provided text and verifies various
 * elements within its parent container based on the provided options.
 *
 * @param {string} headingText - The text of the heading that identifies the briefing section
 * @param {Object} options - Configuration options for the assertion
 * @param {(string|string[])} [options.content] - The content to verify within the section
 *    If an array is provided, it checks for each string in a list element
 *    If a string is provided, it checks for the content as direct text
 * @param {string} [options.buttonName] - The name of a button to verify within the section
 * @param {Array<{text: string, href: string}>} [options.links] - Array of link objects to verify
 *    Each link object should have 'text' and 'href' properties
 * @param {boolean} [options.hasPrivilegedTag] - Whether to check for a red "PRIVILEGED" tag
 *
 * @example
 * // Assert a basic company briefing section with heading
 * cy.assertCompanyBriefingSection("Testing Corp");
 *
 * @example
 * // Assert a section with content text
 * cy.assertCompanyBriefingSection("Summary", {
 *   content: "Currently this company has no summary."
 * });
 *
 * @example
 * // Assert a section with list items
 * cy.assertCompanyBriefingSection("Key Products", {
 *   content: [
 *      "Headquartered in Canada",
 *      "Has a global turnover of $8000000",
 *      "Employs 6,000 people globally"
 *   ]
 * });
 *
 * @example
 * // Assert a section with links
 * cy.assertCompanyBriefingSection("SCIT administrators", {
 *   content: "Vyvyan Holland",
 *   links: [
 *     text: "local.user@businessandtrade.gov.uk",
 *     href: "mailto:local.user@businessandtrade.gov.uk",
 *   ],
 *   hasPrivilegedTag: true
 * });
 */

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
