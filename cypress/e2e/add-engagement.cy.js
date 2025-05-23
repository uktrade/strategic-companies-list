import { COMPANIES } from "./constants";

const assertEngagementList = (expectedItems = []) => {
  cy.findByRole("heading", { name: "Engagements" })
    .closest("section")
    .within(() => {
      expectedItems.forEach((item, index) => {
        cy.findAllByRole("listitem")
          .eq(index)
          .within(() => {
            cy.findByRole("link").within(() => {
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

const assertEmptyNotes = () => {
  cy.findByRole("heading", { name: "Business intelligence", level: 2 });
  cy.findByText(
    "Only other account managers for this company can add or view information in this section."
  ).should("be.visible");
  cy.findByText(
    "This engagement has no business intelligence recorded."
  ).should("be.visible");
  cy.findByRole("button", { name: "Add business intelligence" }).should(
    "be.visible"
  );
  cy.findByRole("button", { name: "Edit business intelligence" }).should(
    "not.exist"
  );
};

describe("Add/edit an engagement", () => {
  before(() => {
    cy.resetDatabase();
  });

  context("when the user views the page for the first time", () => {
    beforeEach(() => {
      cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    });
    it("should NOT show any engagements in the right column", () => {
      cy.findByRole("heading", { name: "Engagements" }).should("be.visible");
      cy.findByTestId("engagements").within(() => {
        cy.findAllByRole("list").should("not.exist");
      });
      cy.findByText("No current engagements.").should("be.visible");
    });
    it("should render a form correctly", () => {
      cy.clickButton("Add engagement");
      cy.findByRole("heading", { name: "Add engagement", level: 2 });
      cy.findByLabelText("Title", { selector: "input" });
      cy.findByLabelText("Date", { selector: "input[type='date']" });
      cy.findByLabelText("Engagement type", { selector: "select" });
      cy.findByLabelText("Who are you meeting from the company?", {
        selector: "textarea",
      });
      cy.findByLabelText("Who will be there from the Civil Service?", {
        selector: "textarea",
      });
      cy.findByLabelText("Which minister(s) will be present? (Optional)", {
        selector: "textarea",
      });
      cy.findByLabelText("Agenda", {
        selector: "textarea",
      });
      cy.findByLabelText("Outcomes (Optional)", {
        selector: "textarea",
      });
      cy.findByLabelText("Actions (Optional)", {
        selector: "textarea",
      });
      cy.findByRole("button", { name: "Save" });
      cy.findByRole("button", { name: "Cancel" });
    });
  });

  context("when the user submits the form with errors", () => {
    it("should display error messages", () => {
      cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);

      cy.clickButton("Add engagement");
      cy.clickButton("Save");
      cy.assertFormErrors({
        Title: "Title is required",
        Date: "Date is required",
        Agenda: "Agenda is required",
        "Engagement type": "Engagement type is required",
        "Who will be there from the Civil Service?":
          "Civil servants are required",
        "Who are you meeting from the company?":
          "Company representatives are required",
      });
    });
  });

  context("when the user decides to cancel the form", () => {
    it("should hide the form", () => {
      cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
      cy.get("form").should("not.be.visible");
      cy.clickButton("Add engagement");
      cy.findByRole("button", { name: "Add engagement" }).should("not.exist");
      cy.get("form").should("be.visible");
      cy.clickButton("Cancel");
      cy.get("form").should("not.be.visible");
      cy.findByRole("button", { name: "Add engagement" }).should("be.visible");
    });
  });

  context("when the user submits the form correctly", () => {
    beforeEach(() => {
      cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    });
    it("should add an engagement", () => {
      cy.clickButton("Add engagement");
      // Deliberate typo: My engagement tite
      cy.findByLabelText("Title").type("My engagement tite");
      cy.findByLabelText("Date").type("2030-02-01");
      cy.findByLabelText("Engagement type").select("Social media");
      cy.findByLabelText("Engagement type").select("Social media");
      cy.findByLabelText("Who are you meeting from the company?").type(
        "Bob,Sarah"
      );
      cy.findByLabelText("Who will be there from the Civil Service?").type(
        "Jack,Jill"
      );
      cy.findByLabelText("Which minister(s) will be present? (Optional)").type(
        "Cara,Louise"
      );
      cy.findByLabelText("Agenda").type("Some agenda");
      cy.findByLabelText("Outcomes (Optional)").type("An outcome");
      cy.findByLabelText("Actions (Optional)").type("An action");
      cy.clickButton("Save");
      cy.assertBanner({
        title: "Saved",
        heading: "Engagement added",
      });
      assertEngagementList([
        { date: "February 01 2030", text: "My engagement tite" },
      ]);
      assertViewAllEngagementsLink(COMPANIES.testing_corp);
      cy.findByTestId("engagements").within(() => {
        cy.findByRole("link", {
          name: "My engagement tite",
        }).click();
      });
      cy.findByText("February 01 2030").should("be.visible");
      cy.findByText("Bob, Sarah").should("be.visible");
      cy.findByText("Jack, Jill").should("be.visible");
      cy.findByText("Cara, Louise").should("be.visible");
      cy.findByText("Some agenda").should("be.visible");
      cy.findByText("An outcome").should("be.visible");
      cy.findByText("An action").should("be.visible");
    });

    it("should edit the engagement (fixes a typo)", () => {
      cy.findByTestId("engagements").within(() => {
        cy.findByRole("link", {
          name: "My engagement tite",
        }).click();
      });
      cy.clickButton("Edit engagement");
      cy.findByLabelText("Title").clear().type("My engagement title");
      cy.clickButton("Save");
      cy.assertBanner({
        title: "Saved",
        heading: "Engagement updated",
      });
      cy.findByRole("heading", {
        name: "My engagement title",
        level: 1,
      }).should("be.visible");
    });
  });
});

describe("Add/edit/delete a business intelligence note", () => {
  beforeEach(() => {
    cy.visit(`/company-briefing/${COMPANIES.testing_corp.duns_number}`);
    cy.findByTestId("engagements").within(() => {
      cy.findByRole("link", {
        name: "My engagement title",
      }).click();
    });
  });
  context("when the engagement has no notes", () => {
    it("should display basic guidance around notes", () => {
      assertEmptyNotes();
    });
  });
  context("when the user views the note form", () => {
    it("should render correctly", () => {
      cy.clickButton("Add business intelligence");
      cy.findByLabelText("Add business intelligence").should("be.visible");
      cy.findByRole("button", { name: "Delete" }).should("not.exist");
      cy.findAllByRole("button", { name: "Save" }).should("be.visible");
      cy.findAllByRole("button", { name: "Cancel" }).should("be.visible");
    });
  });
  context("when the the user tries to add a note without any input", () => {
    it("should display an error", () => {
      cy.clickButton("Add business intelligence");
      cy.clickButton("Save");
      cy.assertFormErrors({
        "Add business intelligence": "Business intelligence is required",
      });
    });
  });
  context("when the user adds a note correctly", () => {
    it("should display an error", () => {
      cy.clickButton("Add business intelligence");
      cy.findByLabelText("Add business intelligence").type("Some notes");
      cy.clickButton("Save");
      cy.assertBanner({
        title: "Saved",
        heading: "Business intelligence added",
      });
      cy.findByText("Some notes").should("be.visible");
    });
  });
  context("when the user edits a note", () => {
    it("should update the contents of the note", () => {
      cy.clickButton("Edit business intelligence");
      cy.findByLabelText("Update business intelligence")
        .clear()
        .type("Some longer notes");
      cy.clickButton("Save");
      cy.assertBanner({
        title: "Saved",
        heading: "Business intelligence updated",
      });
      cy.findByText("Some longer notes").should("be.visible");
    });
  });
  context("when the user deletes a note", () => {
    it("should remove the note from the engagement", () => {
      cy.clickButton("Edit business intelligence");
      cy.findByText("Delete").click();
      cy.assertBanner({
        title: "Saved",
        heading: "Business intelligence deleted",
      });
      cy.findByText("Some longer notes").should("not.exist");
      assertEmptyNotes();
    });
  });
});
