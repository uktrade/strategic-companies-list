// Testing Corp has an account manager
const company = {
  duns_number: "123456",
};

describe("Company Details page", () => {
  before(() => {
    cy.resetDatabase();
  });

  it("should not show edit button when no key people are present", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.get("section").contains("Edit people").should("not.exist");
  });

  it("should allow you to add a Key Person with all fields", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Add people");
    cy.findByRole("textbox", {
      name: /role/i,
    })
      .clear()
      .type("Company Rep");
    cy.findByRole("textbox", {
      name: /name/i,
    })
      .clear()
      .type("Test Person");
    cy.findByRole("textbox", {
      name: /email/i,
    })
      .clear()
      .type("test.person@company.co.uk");
    cy.clickButton("Save");
    cy.get("section").contains("Company Rep - Test Person (test.person@company.co.uk)");
  });

  it("should not save a Key Person if you cancel", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Add people");
    cy.findByRole("textbox", {
      name: /role/i,
    })
      .clear()
      .type("Shouldn't Exist");
    cy.findByRole("textbox", {
      name: /name/i,
    })
      .clear()
      .type("Shouldn't Exist");
    cy.findByRole("textbox", {
      name: /email/i,
    })
      .clear()
      .type("shouldnt.exist@company.co.uk");
    cy.get("#cancel-add-key-person").click();
    cy.get("section")
      .contains("Shouldn't Exist - Shouldn't Exist")
      .should("not.exist");
  });

  it("should allow you to edit a Key Person", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Edit people");
    cy.get("#people\\.0\\.role").clear().type("Company Rep");
    cy.get("#people\\.0\\.name").clear().type("Test Person 2");
    cy.get("#people\\.0\\.email").clear().type("test.person@company.co.uk");
    cy.clickButton("Save");
    cy.get("section").contains("Company Rep - Test Person 2");
  });

  it("should not allow you to edit a Key Person if you cancel", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Edit people");
    cy.get("#people\\.0\\.role").clear().type("Shouldn't Exist");
    cy.get("#people\\.0\\.name").clear().type("Shouldn't Exist");
    cy.get("#people\\.0\\.email").clear().type("shouldnt.exist@company.co.uk");
    cy.get("#cancel-edit-key-person").click();
    cy.get("section")
      .contains("Shouldn't Exist - Shouldn't Exist")
      .should("not.exist");
  });

  it("should stop you from adding a Key Person if you are missing fields", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Add people");
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Name is required");
    cy.get(".govuk-error-message").contains("Role is required");
    cy.get(".govuk-error-message").contains("Email is required");
    cy.findByRole("textbox", {
      name: /role/i,
    })
      .clear()
      .type("Test Person");
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Name is required");
    cy.get(".govuk-error-message").contains("Email is required");
    cy.findByRole("textbox", {
      name: /name/i,
    })
      .clear()
      .type("Test Role");
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Email is required");
  });

  it("should stop you from editing a Key Person if you are missing fields", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Edit people");
    cy.get("#people\\.0\\.role").clear();
    cy.get("#people\\.0\\.name").clear();
    cy.get("#people\\.0\\.email").clear();
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Name is required");
    cy.get(".govuk-error-message").contains("Role is required");
    cy.get(".govuk-error-message").contains("Email is required");
    cy.get("#people\\.0\\.role").clear().type("Test Role");
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Name is required");
    cy.get(".govuk-error-message").contains("Email is required");
    cy.get("#people\\.0\\.name").clear().type("Test Name");
    cy.clickButton("Save");
    cy.get(".govuk-error-message").contains("Email is required");
  });

  it("should be abke to delete a Key Person successfully", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Edit people");
    cy.contains("Delete").click();
    cy.get("section").contains("Test Person").should("not.exist");
  });
});
