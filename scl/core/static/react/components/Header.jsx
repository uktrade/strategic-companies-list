import React from "react";

const Header = ({ title, duns_number, sectors, last_updated }) => {
  return (
    <>
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
      <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible govuk-!-margin-top-10"></hr>
    </>
  );
};

export default Header;
