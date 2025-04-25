import { company } from "./fixtures";

describe("Company Briefing page", () => {
  beforeEach(() => {
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
  });

  it("asserts the company section", () => {
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

  it("asserts the summary section", () => {
    cy.assertCompanyBriefingSection("Summary", {
      content: "Currently this company has no summary.",
      buttonName: "Add summary",
    });
  });

  it("asserts the Key Facts section", () => {
    cy.assertCompanyBriefingSection("Key Facts", {
      content: [
        "Headquartered in Canada",
        "Has a global turnover of $1000000000",
        "Employs 6,000 people globally",
      ],
    });
  });

  it("asserts the Key People section", () => {
    cy.assertCompanyBriefingSection("Key People", {
      content: "Currently no key people are assigned.",
      buttonName: "Add people",
    });
  });

  it("asserts the Company Priorities", () => {
    cy.assertCompanyBriefingSection("Company Priorities", {
      content: "Currently no company priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });
  });

  it("asserts the HMG Priorities section", () => {
    cy.assertCompanyBriefingSection("HMG Priorities", {
      content: "Currently no HMG priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });
  });

  it("asserts the Engagements section", () => {
    cy.assertCompanyBriefingSection("Engagements", {
      content: "No current engagements.",
      hasPrivilegedTag: true,
    });
  });

  it("asserts the SCIT administrators section", () => {
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

  it("asserts the main sections in the correct order", () => {
    cy.assertCompanyBriefingSectionOrder([
      "Summary",
      "Key Facts",
      "Key People",
      "Company Priorities",
      "HMG Priorities",
    ]);
  });

  it("asserts the side sections in the correct order", () => {
    cy.assertCompanyBriefingSectionOrder([
      "Engagements",
      "SCIT administrators",
    ]);
  });
});

describe("Add/edit an engagement", () => {
  const fillAndSubmitForm = (
    { title, date, details },
    { shouldSubmit, shouldCancel }
  ) => {
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
  };

  const assertEngagementList = (expectedItems = []) => {
    cy.findByRole("heading", { name: "Engagements" })
      .closest("section")
      .within(() => {
        expectedItems.forEach((item, index) => {
          cy.findAllByRole("listitem")
            .eq(index)
            .within(() => {
              cy.findByRole("link").within(() => {
                cy.findByText(item.date).should("exist");
                cy.findByText(item.text).should("exist");
              });
            });
        });
      });
  };

  const assertViewAllEngagementsLink = () => {
    cy.findByRole("heading", { name: "Engagements" })
      .closest("section")
      .within(() => {
        cy.findByText("View all engagements")
          .should("exist")
          .and(
            "have.attr",
            "href",
            `/company-briefing/${company.testingCorp.duns_number}/engagements`
          );
      });
  };

  it("should render error messages", () => {
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
    cy.clickButton("Add engagement");
    fillAndSubmitForm(
      {
        title: "",
        date: "",
        details: "",
      },
      { shouldSubmit: true }
    );
    cy.assertFormErrors({
      Title: "Title is required",
      Date: "Date is required",
      Details: "Details are required",
    });
  });

  it("should add an engagement", () => {
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
    cy.clickButton("Add engagement");
    fillAndSubmitForm(
      {
        title: "My engagement title",
        date: "2026-12-03",
        details: "My engagement details",
      },
      { shouldSubmit: true }
    );
    cy.assertBanner({
      title: "Saved",
      heading: "Engagement added",
    });
    assertEngagementList([
      { date: "December 03, 2026", text: "My engagement title" },
    ]);
    assertViewAllEngagementsLink();
  });

  it("should edit an engagement (fixes a typo)", () => {
    cy.intercept("POST", "/api/v1/engagement/*").as("apiRequest");
    cy.intercept("PATCH", "/api/v1/engagement/*").as("apiRequestPATCH");
    cy.visit(`/company-briefing/${company.testingCorp.duns_number}`);
    cy.clickButton("Add engagement");
    fillAndSubmitForm(
      {
        title: "My engagement tite", // typo
        date: "2026-12-03",
        details: "My engagement details",
      },
      { shouldSubmit: true }
    );
    cy.wait("@apiRequest");
    cy.clickLink("December 03, 2026 My engagement tite");
    cy.clickButton("Edit details");
    cy.findByLabelText("Title").clear().type("My engagement title"); // typo fixed
    cy.clickButton("Save");
    cy.wait("@apiRequestPATCH");
    cy.assertBanner({
      title: "Saved",
      heading: "Engagement updated",
    });
  });
});
