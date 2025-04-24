/**
 * Clicks a button based on its accessible name.
 *
 * @param {string|RegExp} textOrRegex - The accessible name of the button.
 *   Accepts a string for exact matches or a RegExp for partial matches.
 *
 * @example
 * cy.clickButton('Submit')
 * cy.clickButton(/submit/i) // case-insensitive match
 */
Cypress.Commands.add("clickButton", (textOrRegex) =>
  cy.findByRole("button", { name: textOrRegex }).click()
);

/**
 * Clicks a link based on its accessible name.
 *
 * @param {string|RegExp} textOrRegex - The accessible name of the link.
 *   Accepts a string for exact matches or a RegExp for partial matches.
 *
 * @example
 * cy.clickLink('Home')
 * cy.clickLink(/home/i) // matches 'Home', case-insensitive
 */
Cypress.Commands.add("clickLink", (textOrRegex) => {
  cy.findByRole("link", { name: textOrRegex }).click();
});
