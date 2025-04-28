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
 *   ]
 * });
 */

Cypress.Commands.add(
  "assertCompanyBriefingSection",
  (headingText, options = {}) => {
    const { content, buttonName, links } = options;

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

/**
 * Custom Cypress command to assert form validation errors for labeled elements
 * 
 * Finds form elements by their exact label text and verifies that the associated
 * error message is visible and has the correct styling.
 * 
 * @param {Object} expectedErrors - Object mapping field labels to their expected error messages
 * @param {string} expectedErrors.fieldName - The exact label text of the form field
 * @param {string} expectedErrors.errorMessage - The expected error message text (partial match)
 * 
 * @example
 * // Assert multiple form errors
 * cy.assertFormErrors({
 *   "Email address": "Enter a valid email address",
 *   "Password": "Password must be at least 8 characters",
 *   "Date of birth": "Enter a valid date"
 * });
 * 
 * // Assert a single form error
 * cy.assertFormErrors({
 *   "Full name": "Enter your full name"
 * });
 * 
 * // Works with any labeled form element (inputs, textareas, selects, radios, checkboxes, etc.)
 */
Cypress.Commands.add("assertFormErrors", (expectedErrors = {}) => {
  Object.entries(expectedErrors).forEach(([fieldName, errorMessage]) => {
    if (errorMessage) {
      cy.findByLabelText(fieldName, { exact: true })
        .parent()
        .within(() => {
          cy.findByText(errorMessage, { exact: false })
            .should("be.visible")
            .and("have.class", "govuk-error-message");
        });
    }
  });
});

/**
 * Custom Cypress command to assert the existence and content of a GOV.UK notification banner
 *
 * @param {Object} options - The options object
 * @param {string} [options.title] - The expected title text of the notification banner
 * @param {string} [options.heading] - The expected heading text within the notification banner
 *
 * @example
 * // Assert banner with both title and heading
 * cy.assertBanner({
 *   title: "Important",
 *   heading: "Your application has been submitted"
 * });
 *
 * // Assert banner with only title
 * cy.assertBanner({ title: "Success" });
 *
 * // Assert banner with only heading
 * cy.assertBanner({ heading: "Your changes have been saved" });
 */
Cypress.Commands.add("assertBanner", ({ title, heading }) => {
  cy.get('[role="alert"]')
    .should("exist")
    .within(() => {
      if (title) {
        cy.get("#govuk-notification-banner-title")
          .should("exist")
          .and("contain.text", title);
      }
      if (heading) {
        cy.get("h3").should("exist").and("contain.text", heading);
      }
    });
});
