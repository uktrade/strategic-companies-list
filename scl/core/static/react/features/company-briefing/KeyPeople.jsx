import React, { useEffect, useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Update from "../../forms/key-people/Update";
import Create from "../../forms/key-people/Create";
import Section from "../../components/Section";
import SectionActions from "../../components/SectionActions";

const KeyPeople = ({ id, csrf_token, isEditing, keyPeople }) => {
  const [people, setPeople] = useState(keyPeople);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, SetIsUpdating] = useState(false);
  const [isCreating, SetIsCreating] = useState(false);

  const onDelete = async (userId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      `/api/v1/key-people/${id}`,
      { id: userId },
      csrf_token
    );
    setPeople(data.data);
    setIsLoading(false);
  };

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        `/api/v1/key-people/${id}`,
        payload,
        csrf_token
      );
      setPeople(data.data);
      setIsLoading(false);
      SetIsCreating(false);
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        `/api/v1/key-people/${id}`,
        payload.people,
        csrf_token
      );
      setPeople(data.data);
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
      <Section title="Key People">
        {!people?.length ? (
          <p className="govuk-body">Currently no key people are assigned.</p>
        ) : (
          !isCreating &&
          !isUpdating && (
            <ul className="govuk-list govuk-list--bullet scl-key-people-list">
              {people.map((people, index) => (
                <li key={index} className="scl-key-people-list__item">
                  <div>
                    <span>
                      {people.role}: {people.name}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {isEditing && isCreating && (
          <Create onSubmit={onSubmit} SetIsCreating={SetIsCreating} />
        )}
        {isEditing && isUpdating && (
          <Update
            id={id}
            data={people}
            onSubmit={onSubmit}
            onDelete={onDelete}
            SetIsUpdating={SetIsUpdating}
          />
        )}
        {isEditing && !isCreating && !isUpdating && (
          <SectionActions
            addLabel="Add people"
            editLabel="Edit people"
            showEdit={Boolean(people.length)}
            setIsCreating={() => SetIsCreating(!isCreating)}
            setIsUpdating={() => SetIsUpdating(!isUpdating)}
          />
        )}
      </Section>
    </LoadingSpinner>
  );
};

export default KeyPeople;
