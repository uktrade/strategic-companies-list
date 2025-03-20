import React from "react";

const PageActions = ({ isEditing, toggleIsEditing, link, label }) => {
  return (
    <div className="scl-page-actions">
      <button
        className={`govuk-button ${isEditing ? "govuk-button--warning" : ""}`}
        onClick={toggleIsEditing}
      >
        {isEditing ? "Cancel" : "Edit"}
      </button>
      <a href={link} role="button" className="govuk-button">
        {label}
      </a>
    </div>
  );
};

export default PageActions;
