import React from "react";

const Section = ({ isPrivaliged = false, children, title }) => (
  <section className="section">
    {isPrivaliged && (
      <strong className="govuk-tag govuk-tag--red scl-tag scl-tag--security scl-tag--hanging section__tag">
        PRIVILEGED
      </strong>
    )}
    <h2 className="govuk-heading-m">{title}</h2>
    {children}
  </section>
);

export default Section;
