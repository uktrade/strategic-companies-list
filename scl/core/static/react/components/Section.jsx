import React from "react";

const Section = ({
  children,
  title,
  className = "",
  caption = "",
  captionStyle = { color: "#505A5F", marginBottom: "20px" },
  ...props
}) => (
  <section className={`section ${className}`} {...props}>
    <h2 className="govuk-heading-m govuk-!-margin-bottom-3">{title}</h2>
    {caption && (
      <p className="govuk-body" style={captionStyle}>
        {caption}
      </p>
    )}
    {children}
  </section>
);

export default Section;
