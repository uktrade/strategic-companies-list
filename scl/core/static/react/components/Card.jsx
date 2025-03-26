import React from "react";

const Card = ({ children, title, className = "" }) => (
  <div className={`card ${className}`}>
    {title && <h3 className="govuk-heading-s">{title}</h3>}
    {children}
  </div>
);

export default Card;
