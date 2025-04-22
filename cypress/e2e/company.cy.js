import { company } from "./fixtures";

describe("Company Briefing page", () => {
  beforeEach(() => {
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
  });

  it("renders the company name as a level 1 heading", () => {
    cy.findByRole("heading", {
      level: 1,
      name: "Testing Corp",
    }).should("be.visible");
  });

  it("displays the D-U-N-S number", () => {
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", company.testingCorp.duns_number);
  });

  it("displays the sectors correctly", () => {
    cy.contains("strong", "Sectors:")
      .parent()
      .should(
        "contain.text",
        "Advanced engineering, Aerospace, Agriculture, horticulture, fisheries and pets"
      );
  });

  it("shows the Last updated label (even if empty)", () => {
    cy.contains("strong", "Last updated:").should("exist");
  });
});
