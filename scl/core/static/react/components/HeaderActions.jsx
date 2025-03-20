import React from 'react'

const HeaderActions = ({ isEditing }) => {
  return (
    <div className="govuk-grid-column-one-third">
      <div className="scl-page-actions">
        <button
          className={`govuk-button ${isEditing ? "govuk-button--warning" : ""}`}
          onClick={toggleIsEditing}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <a
          href={`/company-briefing/${data.duns_number}/add-engagement`}
          role="button"
          className="govuk-button"
        >
          Add engagement
        </a>
      </div>
    </div>
  );
};

export default HeaderActions