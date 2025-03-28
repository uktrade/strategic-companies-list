import React from "react";

const SectionActions = ({
  addLabel,
  editLabel,
  showEdit = false,
  setIsUpdating,
  setIsCreating,
}) => {
  return (
    <>
      <div className="govuk-!-margin-top-6">
        <button
          className="govuk-button govuk-!-margin-right-2"
          onClick={() => setIsCreating()}
        >
          {addLabel}
        </button>
        {showEdit && (
          <button className="govuk-button" onClick={() => setIsUpdating(false)}>
            {editLabel}
          </button>
        )}
      </div>
    </>
  );
};

export default SectionActions;
