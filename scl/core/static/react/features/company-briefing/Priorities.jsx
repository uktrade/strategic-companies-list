import React, { useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Update from "../../forms/company-priorites/Update";
import Create from "../../forms/company-priorites/Create";
import SectionActions from "../../components/SectionActions";

const Priorities = ({
  id,
  csrf_token,
  insightType,
  companyPriorities,
  emptyMessage,
  title,
  showUpdateNotification,
}) => {
  const [priorities, setPriorities] = useState(companyPriorities);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const ENDPOINT = `/api/v1/company/${id}/insights/${insightType}`;

  const onDelete = async (insightId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { insightId },
      csrf_token
    );
    setPriorities(data.data);
    if (data.data.length <= 0) {
      setIsUpdating(false);
      setIsCreating(false);
    }
    setIsLoading(false);
    showUpdateNotification("Priority deleted");
  };

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );
      setPriorities(data.data);
      setIsLoading(false);
      setIsCreating(false);
      showUpdateNotification('Priority created');
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload.priorities,
        csrf_token
      );
      setPriorities(data.data);
      setIsLoading(false);
      setIsUpdating(false);
      showUpdateNotification("Priority updated");
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section title={title}>
        {!priorities.length ? (
          <p className="govuk-body">{emptyMessage}</p>
        ) : (
          !isCreating &&
          !isUpdating &&
          priorities.map((priority, index) => (
            <Card
              key={`${priority.title}-${index}`}
              title={priority.title}
              className="govuk-!-margin-bottom-4"
            >
              <p className="govuk-body">{priority.details}</p>
            </Card>
          ))
        )}

        {isCreating && (
          <Create onSubmit={onSubmit} setIsCreating={setIsCreating} />
        )}
        {isUpdating && (
          <Update
            data={priorities}
            onSubmit={onSubmit}
            onDelete={onDelete}
            setIsUpdating={setIsUpdating}
          />
        )}
        {!isCreating && !isUpdating && (
          <SectionActions
            addLabel="Add priority"
            editLabel={`Edit ${
              priorities.length > 1 ? "priorites" : "priority"
            }`}
            showEdit={Boolean(priorities.length)}
            setIsCreating={() => setIsCreating(!isCreating)}
            setIsUpdating={() => setIsUpdating(!isUpdating)}
          />
        )}
      </Section>
    </LoadingSpinner>
  );
};

export default Priorities;
