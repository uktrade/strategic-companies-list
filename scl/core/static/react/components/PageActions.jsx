import React from "react";

const PageActions = ({
  isAddingEngagement,
  setIsAddingEngagement,
  showAddEngagementBtn = true,
}) => {
  return (
    <div className="scl-page-header__actions">
      {showAddEngagementBtn && !isAddingEngagement && (
        <button
          className={`govuk-button ${
            isAddingEngagement ? "govuk-button--secondary" : ""
          }`}
          onClick={() => {
            setIsAddingEngagement(!isAddingEngagement);
          }}
        >
          {"Add engagement"}
        </button>
      )}
    </div>
  );
};

export default PageActions;
