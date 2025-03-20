import React from "react";

const Header = ({ title, duns_number, sectors, last_updated }) => {
  return (
    <div className="govuk-!-margin-bottom-6">
      <h1 className="govuk-heading-l govuk-!-margin-bottom-4">{title}</h1>
      <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
        <strong>D-U-N-S:</strong> {duns_number}
      </p>
      <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
        <strong>Sectors:</strong> {sectors}
      </p>
      <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
        <strong>Last updated:</strong> {last_updated}
      </p>
    </div>
  );
};

export default Header;
