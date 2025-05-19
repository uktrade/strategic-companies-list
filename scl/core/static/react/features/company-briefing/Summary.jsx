import React, { useState } from "react";

import Section from "../../components/Section";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";
import KeyFacts from "./KeyFacts";

const Summary = ({ data, csrf_token }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(data.summary);
  const [notification, setNotification] = useState(null);

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
        {!summary &&
        !data.global_hq_country &&
        !data.turn_over &&
        !data.employees ? (
          <p className="govuk-body">
            Currently there is no summary for this company.
          </p>
        ) : (
          <p className="govuk-body">{summary}</p>
        )}
        <KeyFacts data={data} />
      </Section>
    </LoadingSpinner>
  );
};

export default Summary;
