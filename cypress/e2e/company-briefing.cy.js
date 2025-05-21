import { COMPANIES } from "./constants";

describe("Company Briefing page", () => {
  before(() => {
    cy.resetDatabase();
  });

  it("should have all the elements on the page", () => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);

    cy.findByRole("heading", {
      level: 1,
      name: COMPANIES.testing_corp.name,
    }).should("be.visible");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", COMPANIES.testing_corp.duns_number);
    cy.contains("strong", "Sectors:")
      .parent()
      .should(
        "contain.text",
        "Advanced engineering, Aerospace, Agriculture, horticulture, fisheries and pets"
      );
    cy.contains("strong", "Last updated:").should("exist");
    cy.findByRole("button", { name: "Edit company details" }).should(
      "be.visible"
    );

    cy.assertCompanyBriefingSection("Summary and key facts", {
      content: [
        "Headquartered in Canada",
        "Has a global turnover of $1000000000",
        "Employs 6,000 people globally",
      ],
    });

    cy.assertCompanyBriefingSection("Key people in this company", {
      content: "Currently no key people are assigned.",
      buttonName: "Add people",
    });

    cy.assertCompanyBriefingSection("Company priorities for HMG engagement", {
      content: "Currently no company priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });

    cy.assertCompanyBriefingSection("HMG priorities for engagement", {
      content: "Currently no government priorities are assigned.",
      buttonName: "Add priority",
    });

    cy.assertCompanyBriefingSection("Engagements", {
      content: "No current engagements.",
      hasPrivilegedTag: true,
    });

    cy.assertCompanyBriefingSection("Account managers", {
      content: "Vyvyan Holland",
      links: [
        {
          text: "local.user@businessandtrade.gov.uk",
          href: "mailto:local.user@businessandtrade.gov.uk",
        },
      ],
    });

    cy.assertCompanyBriefingSectionOrder([
      "Summary and key facts",
      "Key people in this company",
      "Company priorities for HMG engagement",
      "HMG priorities for engagement",
    ]);

    cy.assertCompanyBriefingSectionOrder(["Engagements", "Account managers"]);
  });
});
