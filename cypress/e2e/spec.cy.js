describe("Homepage", () => {
  it("should render", () => {
    cy.visit("/");
    cy.findByRole("heading", {
      level: 1,
      name: "All 2 companies on the Strategic Companies List",
    }).should("be.visible");
  });
});
