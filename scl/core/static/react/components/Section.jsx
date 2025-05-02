import React from "react";

const Section = ({ children, title, className = '' }) => (
  <section className={`section ${className}`}>
    <h2 className="govuk-heading-m">{title}</h2>
    {children}
  </section>
);

export default Section;
