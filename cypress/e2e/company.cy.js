import { company } from "./fixtures";

describe("Company Briefing page", () => {
  beforeEach(() => {
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
  });

  it("renders the company section", () => {
    cy.findByRole("heading", {
      level: 1,
      name: "Testing Corp",
    }).should("be.visible");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", company.testingCorp.duns_number);
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
  });

  it("renders the summary section", () => {
    cy.assertCompanyBriefingSection("Summary", {
        content: "Currently this company has no summary.",
        buttonName: "Add summary",
      });
  });

  it("renders the Key Facts section", () => {
    cy.assertCompanyBriefingSection("Key Facts", {
      content: [
        "Headquartered in Canada",
        "Has a global turnover of $1000000000",
        "Employs 6,000 people globally",
      ],
    });
  });

  it("renders the Key People section", () => {
    cy.assertCompanyBriefingSection("Key People", {
      content: "Currently no key people are assigned.",
      buttonName: "Add people",
    });
  });

  it("renders the Company Priorities", () => {
    cy.assertCompanyBriefingSection("Company Priorities", {
      content: "Currently no company priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });
  });

  it("renders the HMG Priorities section", () => {
    cy.assertCompanyBriefingSection("HMG Priorities", {
      content: "Currently no HMG priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });
  });

  it("renders the Engagements section", () => {
    cy.assertCompanyBriefingSection("Engagements", {
      content: "No current engagements.",
      hasPrivilegedTag: true,
    });
  });

  it("renders the SCIT administrators section", () => {
    cy.assertCompanyBriefingSection("SCIT administrators", {
      content: "Vyvyan Holland",
      links: [
        {
          text: "local.user@businessandtrade.gov.uk",
          href: "mailto:local.user@businessandtrade.gov.uk",
        },
      ],
    });
  });

  it("renders the main sections in the correct order", () => {
    cy.assertCompanyBriefingSectionOrder([
      "Summary",
      "Key Facts",
      "Key People",
      "Company Priorities",
      "HMG Priorities",
    ]);
  });

  it("renders the side sections in the correct order", () => {
    cy.assertCompanyBriefingSectionOrder([
      "Engagements",
      "SCIT administrators",
    ]);
  });
});
