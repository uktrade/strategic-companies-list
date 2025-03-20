import React, { useEffect, useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Update from "../../components/forms/company-priorites/Update";
import Create from "../../components/forms/company-priorites/Create";
import SectionActions from "../../components/SectionActions";

const CompanyPriorities = ({
  id,
  csrf_token,
  isEditing,
  companyPriorities,
}) => {
  const [priorities, setPriorities] = useState(companyPriorities);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, SetIsUpdating] = useState(false);
  const [isCreating, SetIsCreating] = useState(false);

  const ENDPOINT = `/api/v1/company/${id}/insights/company_priority`;

  const onDelete = async (insightId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { insightId },
      csrf_token
    );
    setPriorities(data.data);
    setIsLoading(false);
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
      SetIsCreating(false);
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
      SetIsUpdating(false);
    }
  };

  const resetFormState = () => {
    SetIsUpdating(false);
    SetIsCreating(false);
  };

  useEffect(() => {
    resetFormState();
  }, [isEditing]);

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section isPrivaliged title="Company Priorities">
        {!priorities.length ? (
          <p class="govuk-body">Currently no company priorites are assigned.</p>
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

        {isEditing && isCreating && (
          <Create onSubmit={onSubmit} SetIsCreating={SetIsCreating} />
        )}
        {isEditing && isUpdating && (
          <Update
            data={priorities}
            onSubmit={onSubmit}
            onDelete={onDelete}
            SetIsUpdating={SetIsUpdating}
          />
        )}
        <SectionActions
          addLabel="Add priority"
          editLabel="Edit priority"
          showActions={isEditing && !isCreating && !isUpdating}
          showEdit={Boolean(priorities.length)}
          setIsCreating={() => SetIsCreating(!isCreating)}
          setIsUpdating={() => SetIsUpdating(!isUpdating)}
        />
      </Section>
    </LoadingSpinner>
  );
};

export default CompanyPriorities;
