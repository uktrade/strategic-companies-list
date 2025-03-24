import React, { useEffect, useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Update from "../../forms/key-people/Update";
import Create from "../../forms/key-people/Create";
import Section from "../../components/Section";
import SectionActions from "../../components/SectionActions";

const KeyPeople = ({
  id,
  csrf_token,
  isEditing,
  keyPeople,
  showUpdateNotification,
  showDeleteNotification,
}) => {
  const [people, setPeople] = useState(keyPeople);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const ENDPOINT = `/api/v1/key-people/${id}`;

  const onDelete = async (userId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { id: userId },
      csrf_token
    );
    setPeople(data.data);
    if (data.data.length <= 0) {
      setIsUpdating(false);
      setIsCreating(false);
    }
    setIsLoading(false);
    showDeleteNotification('Key person deleted');
  };

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );
      setPeople(data.data);
      setIsLoading(false);
      setIsCreating(false);
      showUpdateNotification('Key person created');
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload.people,
        csrf_token
      );
      setPeople(data.data);
      setIsLoading(false);
      setIsUpdating(false);
      showUpdateNotification('Key person updated');
    }
  };

  const resetFormState = () => {
    setIsUpdating(false);
    setIsCreating(false);
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
          <Create onSubmit={onSubmit} setIsCreating={setIsCreating} />
        )}
        {isEditing && isUpdating && (
          <Update
            id={id}
            data={people}
            onSubmit={onSubmit}
            onDelete={onDelete}
            setIsUpdating={setIsUpdating}
          />
        )}
        {isEditing && !isCreating && !isUpdating && (
          <SectionActions
            addLabel="Add people"
            editLabel="Edit people"
            showEdit={Boolean(people.length)}
            setIsCreating={() => setIsCreating(!isCreating)}
            setIsUpdating={() => setIsUpdating(!isUpdating)}
          />
        )}
      </Section>
    </LoadingSpinner>
  );
};

export default KeyPeople;
