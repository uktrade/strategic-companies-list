import React, { useState, useContext } from "react";

import Section from "../../components/Section";
import Update from "../../forms/summary/Update";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";

import { AccountContext } from "../../providers";

const Summary = ({ data, csrf_token, showUpdateNotification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(data.summary);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { isAccountManager } = useContext(AccountContext);

  const ENDPOINT = `/api/v1/company/${data.duns_number}`;

  const onSubmit = async (payload, method) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );
    setSummary(data.data.summary);
    setIsLoading(false);
    setIsCreating(false);
    setIsUpdating(false);
    showUpdateNotification("Summary created");
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section title="Summary">
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

        {!isCreating &&
          !isUpdating &&
          isAccountManager && (
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
