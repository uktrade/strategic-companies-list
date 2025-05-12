import React, { useState, useContext } from "react";

import ApiProxy from "../../proxy";

import Update from "../../forms/engagements/Update";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";

import { GlobalContext } from "../../providers";

const Details = ({ data, csrf_token }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [notification, setNotification] = useState(null);
  const [engagementDetails, setEngagementDetails] = useState(data);

  const { isAccountManager } = useContext(GlobalContext);

  const ENDPOINT = `/api/v1/engagement/${data.id}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );

    setIsLoading(false);
    setIsUpdating(false);

    if (status == 200) {
      setEngagementDetails(data.data);
      setNotification({ message: "Engagement updated"});
    } else {
      setNotification({
        message: `Status ${status}: ${data.message || data.error}`,
        status: "warning",
      });
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <NotificationBanner
        message={notification?.message}
        status={notification?.status}
      />
      {!isUpdating && (
        <div className="govuk-!-margin-bottom-4">
          <h1 className="govuk-heading-l govuk-!-margin-bottom-4">
            {engagementDetails.title}
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
      {!isUpdating && <p className="govuk-body">{engagementDetails.details}</p>}
      {isUpdating && (
        <Update
          id={data.id}
          data={engagementDetails}
          onSubmit={onSubmit}
          setIsUpdating={setIsUpdating}
        />
      )}
      {!isUpdating && isAccountManager && (
        <div className="govuk-!-margin-top-6">
          <button
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsUpdating(true)}
          >
            Edit details
          </button>
        </div>
      )}
    </LoadingSpinner>
  );
};

export default Details;
