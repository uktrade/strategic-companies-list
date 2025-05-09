import React, { useState, useContext } from "react";

import Section from "../../components/Section";
import Update from "../../forms/summary/Update";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";

import { GlobalContext } from "../../providers";

const Summary = ({ data, csrf_token }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(data.summary);
  const [notification, setNotification] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { isAccountManager } = useContext(GlobalContext);

  const ENDPOINT = `/api/v1/company/${data.duns_number}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);

    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );

    setIsLoading(false);
    setIsCreating(false);
    setIsUpdating(false);

    if (status === 200) {
      setSummary(data.data.summary);
      setNotification({ message: "Summary updated" });
    } else {
      setNotification({ message: data.message, status: "warning" });
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section title="Summary">
        <NotificationBanner
          message={notification?.message}
          status={notification?.status}
        />
        {!summary ? (
          <p className="govuk-body">Currently this company has no summary.</p>
        ) : (
          !isCreating && !isUpdating && <p className="govuk-body">{summary}</p>
        )}

        {isCreating && (
          <Update onSubmit={onSubmit} setIsCreating={setIsCreating} />
        )}

        {isUpdating && (
          <Update
            onSubmit={onSubmit}
            data={summary}
            setIsCreating={setIsUpdating}
          />
        )}

        {!isCreating && !isUpdating && isAccountManager && (
          <div className="govuk-!-margin-top-6">
            {Boolean(summary.length) ? (
              <button
                className="govuk-button govuk-button--secondary"
                onClick={() => setIsUpdating(!isUpdating)}
              >
                Edit summary
              </button>
            ) : (
              <button
                className="govuk-button govuk-button--secondary govuk-!-margin-right-2 govuk-!-margin-bottom-2"
                onClick={() => setIsCreating(!isCreating)}
              >
                Add summary
              </button>
            )}
          </div>
        )}
      </Section>
    </LoadingSpinner>
  );
};

export default Summary;
