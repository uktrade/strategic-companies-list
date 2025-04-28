import React from "react";

const Section = ({ children, title }) => (
  <section className="section">
    <h2 className="govuk-heading-m">{title}</h2>
    {children}
  </section>
);

export default Section;
