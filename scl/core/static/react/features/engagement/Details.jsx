import React, { useState } from "react";

import ApiProxy from "../../proxy";

import Update from "../../forms/engagements/Update";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";

const Details = ({
  data,
  csrf_token,
  setIsUpdatingEngagement,
  isUpdatingEngagement,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [notification, setNotification] = useState(null);
  const [engagementDetails, setEngagementDetails] = useState(data);

  const ENDPOINT = `/api/v1/engagement/${data.id}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );

    setIsLoading(false);
    setIsUpdatingEngagement(false);

    if (status == 200) {
      setEngagementDetails(data.data);
      setNotification({ message: "Engagement updated" });
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
      {!isUpdatingEngagement && (
        <div className="govuk-!-margin-bottom-4">
          <strong className={`govuk-tag scl-tag--wide govuk-!-margin-bottom-4 govuk-tag--${engagementDetails.engagement_type_colour}`}>
            {engagementDetails.engagement_type}
          </strong>
          <h1 className="govuk-heading-l govuk-!-margin-bottom-4">
            {engagementDetails.title}
          </h1>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Engagement date:</strong> {engagementDetails.date}
          </p>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Company representatives:</strong>{" "}
            {engagementDetails.company_representatives.join(", ")}
          </p>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Civil servants:</strong>{" "}
            {engagementDetails.civil_servants.join(", ")}
          </p>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Minister(s):</strong>{" "}
            {engagementDetails.ministers.join(", ")}
          </p>
          <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
            <strong>Last updated:</strong> {engagementDetails.last_updated.date}{" "}
            by {engagementDetails.last_updated.name}
          </p>

          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible"></hr>
        </div>
      )}
      {!isUpdatingEngagement && (
        <>
          <h2 className="govuk-heading-m">Agenda</h2>
          <p className="govuk-body">{engagementDetails.agenda}</p>
          <h2 className="govuk-heading-m">Outcomes</h2>
          <p className="govuk-body">
            {engagementDetails.outcomes
              ? engagementDetails.outcomes
              : "Currently there are no outcomes."}
          </p>
          <h2 className="govuk-heading-m">Actions</h2>
          <p className="govuk-body">
            {engagementDetails.actions
              ? engagementDetails.actions
              : "Currently there are no actions."}
          </p>
        </>
      )}
      {isUpdatingEngagement && (
        <Update
          id={data.id}
          data={engagementDetails}
          onSubmit={onSubmit}
          handleCancel={() => setIsUpdatingEngagement(false)}
          setIsUpdating={setIsUpdatingEngagement}
        />
      )}
    </LoadingSpinner>
  );
};

export default Details;
