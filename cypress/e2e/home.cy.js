describe("Homepage", () => {
  it("should render", () => {
    cy.visit("/");
    cy.findByRole("heading", {
      level: 1,
      name: "Full list of companies in this tool",
    }).should("be.visible");
    cy.findByText(
      "There are 2 companies. You'll only be able to edit and add information to companies you're assigned to."
    ).should("be.visible");
  });
});
