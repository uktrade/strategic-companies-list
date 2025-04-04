import React from "react";

const PageActions = ({
  isEditing,
  isAddingEngagement,
  setIsEditing,
  setIsAddingEngagement,
  showAddEngagementBtn = true,
}) => {
  return (
    <div className="scl-page-header__actions">
      <button
        className={`govuk-button ${isEditing ? "govuk-button--secondary" : ""}`}
        onClick={() => {
          setIsEditing(!isEditing);
          setIsAddingEngagement(false);
        }}
      >
        {isEditing ? "Stop editing" : "Edit"}
      </button>
      {showAddEngagementBtn && (
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
      )}
    </div>
  );
};

export default PageActions;
