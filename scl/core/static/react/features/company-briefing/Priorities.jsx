import React, { useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Update from "../../forms/company-priorites/Update";
import Create from "../../forms/company-priorites/Create";
import SectionActions from "../../components/SectionActions";
import NotificationBanner from "../../components/NotificationBanner";

const Priorities = ({
  id,
  csrf_token,
  insightType,
  companyPriorities,
  emptyMessage,
  title,
}) => {
  const [priorities, setPriorities] = useState(companyPriorities);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    setIsUpdating(false);
    setIsCreating(false);
  };

  const ENDPOINT = `/api/v1/company/${id}/insights/${insightType}`;

  const onDelete = async (insightId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { insightId },
      csrf_token
    );

    resetState();

    if (status == 200) {
      setPriorities(data.data);
      setNotification({ message: "Priortiy deleted", success: true });
    } else {
      setNotification({ message: data.message, status: "warning" });
    }
  };

  const onSubmit = async (payload, method) => {
    setIsLoading(true);

    if (method === "create") {
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );

      resetState();

      if (status == 200) {
        setPriorities(data.data);
        setNotification({ message: "Priortiy created", success: true });
      } else {
        setNotification({ message: data.message, status: "warning" });
      }
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload.priorities,
        csrf_token
      );

      resetState();

      if (status == 200) {
        setPriorities(data.data);
        setNotification({ message: "Priortiy updated", success: true });
      } else {
        setNotification({ message: data.message, status: "warning" });
      }
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section title={title}>
        <NotificationBanner
          message={notification?.message}
          success={notification?.success}
        />
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
