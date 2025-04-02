import React, { useState } from "react";

import ApiProxy from "../../proxy";

import Update from "../../forms/engagements/Update";
import LoadingSpinner from "../../components/Spinner";

const Details = ({
  data,
  engagement,
  setEngagement,
  csrf_token,
  isEditing,
  showUpdateNotification,
  isUpdatingDetails,
  setIsUpdatingDetails,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const ENDPOINT = `/api/v1/engagement/${data.id}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );
    setEngagement(data.data);
    setIsLoading(false);
    setIsUpdatingDetails(false);
    showUpdateNotification("Engagement updated");
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      {!isUpdatingDetails && (
        <div className="govuk-!-margin-bottom-4">
          <h1 className="govuk-heading-l govuk-!-margin-bottom-4">
            {data.title}
          </h1>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Created:</strong> {data.created.date} by {data.created.name}
          </p>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Last updated:</strong> {data.last_updated.date} by{" "}
            {data.last_updated.name}
          </p>

          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible"></hr>
        </div>
      )}
      {!isUpdatingDetails && <p className="govuk-body">{engagement.details}</p>}
      {isEditing && isUpdatingDetails && (
        <Update
          id={data.id}
          data={engagement}
          onSubmit={onSubmit}
          setIsUpdatingDetails={setIsUpdatingDetails}
        />
      )}
      {isEditing && !isUpdatingDetails && (
        <div className="govuk-!-margin-top-6">
          <button
            className="govuk-button"
            onClick={() => setIsUpdatingDetails(true)}
          >
            Edit details
          </button>
        </div>
      )}
    </LoadingSpinner>
  );
};

export default Details;
