import React from "react";

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <h3 className="govuk-heading-s">{title}</h3>
      {children}
    </div>
  );
};

export default Card;
