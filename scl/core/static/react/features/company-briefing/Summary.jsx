import React, { useState, useContext } from "react";

import Section from "../../components/Section";
import Update from "../../forms/summary/Update";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";
import KeyFacts from "./KeyFacts";

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
      setNotification({
        message: `Status ${status}: ${data.message || data.error}`,
        status: "warning",
      });
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section
        caption="This publicly available information provides an overview of the company."
        title="Summary and key facts"
      >
        <NotificationBanner
          message={notification?.message}
          status={notification?.status}
        />
        {!summary ? (
          <p className="govuk-body">
            Currently there is no summary for this company.
          </p>
        ) : (
          !isCreating && !isUpdating && <p className="govuk-body">{summary}</p>
        )}
        <KeyFacts data={data} />
      </Section>
    </LoadingSpinner>
  );
};

export default Summary;
