import React from "react";

const PageActions = ({
  isAddingEngagement,
  setIsAddingEngagement,
  showAddEngagementBtn = true,
}) => {
  return (
    <div className="scl-page-header__actions">
      {showAddEngagementBtn && (
        <button
          className={`govuk-button ${
            isAddingEngagement ? "govuk-button--secondary" : ""
          }`}
          onClick={() => {
            setIsAddingEngagement(!isAddingEngagement);
          }}
        >
          {isAddingEngagement ? "Cancel" : "Add engagement"}
        </button>
      )}
    </div>
  );
};

export default PageActions;
