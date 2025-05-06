// Testing Corp has an account manager
const company = {
  duns_number: "123456",
};

describe("Company Briefing page", () => {
  before(() => {
    cy.resetDatabase();
  });

  it("should have all the elements on the page", () => {

    cy.visit(`/company-briefing/${company.duns_number}`);

    cy.findByRole("heading", {
      level: 1,
      name: company.name,
    }).should("be.visible");
    cy.contains("strong", "D-U-N-S:")
      .parent()
      .should("contain.text", company.duns_number);
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

    cy.assertCompanyBriefingSection("Summary", {
      content: "Currently this company has no summary.",
      buttonName: "Add summary",
    });

    cy.assertCompanyBriefingSection("Key Facts", {
      content: [
        "Headquartered in Canada",
        "Has a global turnover of $1000000000",
        "Employs 6,000 people globally",
      ],
    });

    cy.assertCompanyBriefingSection("Key People", {
      content: "Currently no key people are assigned.",
      buttonName: "Add people",
    });

    cy.assertCompanyBriefingSection("Company Priorities", {
      content: "Currently no company priorites are assigned.",
      hasPrivilegedTag: true,
      buttonName: "Add priority",
    });

    cy.assertCompanyBriefingSection("Government Priorities", {
      content: "Currently no Government Priorities are assigned.",
      buttonName: "Add priority",
    });

    cy.assertCompanyBriefingSection("Engagements", {
      content: "No current engagements.",
      hasPrivilegedTag: true,
    });

    cy.assertCompanyBriefingSection("People assigned to this company", {
      content: "Vyvyan Holland",
      links: [
        {
          text: "local.user@businessandtrade.gov.uk",
          href: "mailto:local.user@businessandtrade.gov.uk",
        },
      ],
    });

    cy.assertCompanyBriefingSectionOrder([
      "Summary",
      "Key Facts",
      "Key People",
      "Company Priorities",
      "Government Priorities",
    ]);

    cy.assertCompanyBriefingSectionOrder([
      "Engagements",
      "People assigned to this company",
    ]);
  });
});

describe("Add/edit an engagement", () => {
  before(() => {
    cy.resetDatabase();
  });

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

  const assertViewAllEngagementsLink = (company) => {
    cy.findByRole("heading", { name: "Engagements" })
      .closest("section")
      .within(() => {
        cy.findByText("View all engagements")
          .should("exist")
          .and(
            "have.attr",
            "href",
            `/company-briefing/${company.duns_number}/engagements`
          );
      });
  };

  it("should render error messages", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);

    cy.clickButton("Add engagement");
    cy.fillAndSubmitEngagementForm({
      title: "",
      date: "",
      details: "",
    });
    cy.assertFormErrors({
      Title: "Title is required",
      Date: "Date is required",
      Details: "Details are required",
    });
  });

  it("should add an engagement", () => {
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Add engagement");
    cy.fillAndSubmitEngagementForm({
      title: "My engagement title",
      date: "2026-12-03",
      details: "My engagement details",
    });
    cy.assertBanner({
      title: "Saved",
      heading: "Engagement added",
    });
    assertEngagementList([
      { date: "December 03, 2026", text: "My engagement title" },
    ]);
    assertViewAllEngagementsLink(company);
  });

  it("should edit an engagement (fixes a typo)", () => {
    cy.intercept("POST", "/api/v1/engagement/*").as("apiRequestPOST");
    cy.intercept("PATCH", "/api/v1/engagement/*").as("apiRequestPATCH");
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickButton("Add engagement");
    cy.fillAndSubmitEngagementForm({
      title: "My engagement tite", // typo
      date: "2026-12-03",
      details: "My engagement details",
    });
    cy.wait("@apiRequestPOST");
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

describe("add/edit/delete an engagement note", () => {
  const engagementNote = {
    title: "An engagement",
    date: "2025-06-24",
    details: "Details",
  };

  const engagementNoteLink = "June 24, 2025 An engagement";

  before(() => {
    cy.resetDatabase();
  });

  it("should add an engagement note", () => {
    cy.intercept("POST", "/api/v1/engagement/*").as("createEngagement");
    cy.intercept("POST", "/api/v1/engagement/*/note").as("createNote");
    cy.visit(`/company-briefing/${company.duns_number}`);

    // Create an engagement first
    cy.clickButton("Add engagement");
    cy.fillAndSubmitEngagementForm(engagementNote);
    cy.wait("@createEngagement");

    // Now add a note
    cy.clickLink(engagementNoteLink);
    cy.clickButton("Add note");
    cy.findByLabelText("Contents").type("My notes");
    cy.clickButton("Save");
    cy.wait("@createNote");

    // Ensure the banner has been rendered
    cy.assertBanner({
      title: "Saved",
      heading: "Note added",
    });
  });

  it("should edit an engagement note", () => {
    cy.intercept("PATCH", "/api/v1/engagement/*/note").as("updateNote");
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickLink(engagementNoteLink);
    cy.clickButton("Edit note");
    cy.findByLabelText("Contents").clear().type("My notes!!!");
    cy.clickButton("Save");
    cy.wait("@updateNote");
    cy.assertBanner({
      title: "Saved",
      heading: "Note updated",
    });
  });

  it("should delete an engagement note", () => {
    cy.intercept("DELETE", "/api/v1/engagement/*/note").as("deleteNote");
    cy.visit(`/company-briefing/${company.duns_number}`);
    cy.clickLink(engagementNoteLink);
    cy.clickButton("Edit note");
    cy.findByText("Delete").click();
    cy.wait("@deleteNote");
    cy.assertBanner({
      title: "Saved",
      heading: "Note deleted",
    });
  });
});
