import React from "react";

const PageActions = ({
  isEditing,
  isAddingEngagement,
  setIsEditing,
  setIsAddingEngagement,
  label,
}) => {
  return (
    <div className="scl-page-actions">
      <button
        className={`govuk-button ${isEditing ? "govuk-button--secondary" : ""}`}
        onClick={() => {
          setIsEditing(!isEditing);
          setIsAddingEngagement(false);
        }}
      >
        {isEditing ? "Cancel" : "Edit"}
      </button>
      <button
        className={`govuk-button ${
          isAddingEngagement ? "govuk-button--secondary" : ""
        }`}
        onClick={() => {
          setIsAddingEngagement(!isAddingEngagement);
          setIsEditing(false);
        }}
      >
        {isAddingEngagement ? "Cancel" : "Add engagement"}
      </button>
    </div>
  );
};

export default PageActions;
