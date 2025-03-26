import React from "react";

const Header = ({ title, last_updated, children }) => {
  return (
    <div className="govuk-!-margin-bottom-4">
      <h1 className="govuk-heading-l govuk-!-margin-bottom-4">{title}</h1>
      {children}
    </div>
  );
};

export default Header;
