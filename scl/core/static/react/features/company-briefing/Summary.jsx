import React, { useState } from "react";

import Section from "../../components/Section";

const Summary = ({ data, isEditing }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const ENDPOINT = `/api/v1/company/${data.duns_number}`;

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );
      // setPeople(data.data);
      setIsLoading(false);
      setIsCreating(false);
      showUpdateNotification("Summary created");
    }
    //   if (method === "update") {
    //     setIsLoading(true);
    //     const { data, status } = await ApiProxy.update(
    //       ENDPOINT,
    //       payload.people,
    //       csrf_token
    //     );
    //     setPeople(data.data);
    //     setIsLoading(false);
    //     setIsUpdating(false);
    //     showUpdateNotification('Key person updated');
    //   }
  };
  return (
    <>
      <Section title="Summary">
        {!data.summary ? (
          <p className="govuk-body">Currently there is no summary.</p>
        ) : (
          <p className="govuk-body">{data.summary}</p>
        )}
      </Section>

      {isEditing && isCreating && (
        <Create onSubmit={onSubmit} setIsCreating={setIsCreating} />
      )}
    </>
  );
};

export default Summary;
