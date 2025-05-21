import { COMPANIES } from "./constants";

describe("Company Details page", () => {
  before(() => {
    cy.resetDatabase();
  });

  it("should not change Title and Sector if changes are cancelled", () => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    cy.clickButton("Edit company details");
    cy.get("#title").clear().type("Test title");
    cy.get("#sectors_select").click();
    cy.contains("Defence").click();
    cy.contains("Cancel").click();
    cy.findByRole("heading", {
      level: 1,
      name: COMPANIES.testing_corp.name,
    })
      .invoke("text")
      .should("equal", "Testing Corp");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", COMPANIES.testing_corp.duns_number);
    cy.contains("strong", "Sectors:")
      .parent()
      .should(
        "contain.text",
        "Advanced engineering, Aerospace, Agriculture, horticulture, fisheries and pets"
      );
  });

  it("should change Title and Sector if changes are saved", () => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    cy.clickButton("Edit company details");
    cy.get("#title").clear().type("Test title");
    cy.get("#sectors_select").click();
    cy.contains("Defence").click();
    cy.clickButton("Save");
    cy.findByRole("heading", {
      level: 1,
      name: "Test title",
    })
      .invoke("text")
      .should("equal", "Test title");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", COMPANIES.testing_corp.duns_number);
    cy.contains("strong", "Sectors:")
      .parent()
      .should(
        "contain.text",
        "Advanced engineering, Aerospace, Agriculture, horticulture, fisheries and pets, Defence"
      );
  });

  it("should allow you to remove sectors", () => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    cy.clickButton("Edit company details");
    cy.get("#title").clear().type("Test title");
    cy.get(
      `[aria-label="Remove Agriculture, horticulture, fisheries and pets"]`
    ).click();

    cy.clickButton("Save");
    cy.findByRole("heading", {
      level: 1,
      name: "Test title",
    })
      .invoke("text")
      .should("equal", "Test title");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", COMPANIES.testing_corp.duns_number);
    cy.contains("strong", "Sectors:")
      .parent()
      .should("contain.text", "Advanced engineering, Aerospace");
  });

  it("should not allow you to remove all sectors", () => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    cy.clickButton("Edit company details");
    cy.get("#title").clear().type("Test title");
    cy.get(`[aria-label="Remove Advanced engineering"]`).click();
    cy.get(`[aria-label="Remove Aerospace"]`).click();
    cy.get(`[aria-label="Remove Defence"]`).click();
    cy.clickButton("Save");
    cy.findByRole("heading", {
      level: 1,
      name: "Test title",
    })
      .invoke("text")
      .should("equal", "Test title");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", COMPANIES.testing_corp.duns_number);
    cy.contains("strong", "Sectors:")
      .parent()
      .should("contain.text", "Advanced engineering, Aerospace, Defence");
  });
});
