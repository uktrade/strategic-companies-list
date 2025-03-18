import React, { useEffect, useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Update from "../../components/forms/key-people/Update";
import Create from "../../components/forms/key-people/Create";

const KeyPeople = ({ id, csrf_token, isEditing }) => {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, SetIsUpdating] = useState(false);
  const [isCreating, SetIsCreating] = useState(false);

  const resetFormState = () => {
    SetIsUpdating(false);
    SetIsCreating(false);
  };

  const onDelete = async (personId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      `/api/v1/key-people/${id}`,
      { id: personId },
      csrf_token
    );
    setPeople(data);
    setIsLoading(false);
    SetIsUpdating(false);
  };

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        `/api/v1/key-people/${id}`,
        payload,
        csrf_token
      );
      setPeople(data);
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
      setPeople(data);
      setIsLoading(false);
      SetIsUpdating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data, status } = await ApiProxy.get(
        `/api/v1/key-people/${id}`,
        csrf_token
      );
      setIsLoading(false);
      setPeople(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    resetFormState();
  }, [isEditing]);

  return (
    <LoadingSpinner isLoading={isLoading}>
      <h2 className="govuk-heading-m">Key People</h2>
      {!people.keyPeople?.length && (
        <p className="govuk-body">Currently no key people are assigned.</p>
      )}
      <ul className="govuk-list govuk-list--bullet scl-key-people-list">
        {!isLoading &&
          people.keyPeople.map((people, index) => (
            <li key={index} className="scl-key-people-list__item">
              <div>
                <span>
                  {people.role}: {people.name}
                </span>
                {isEditing && (
                  <button
                    className="govuk-button govuk-button--warning govuk-!-margin-bottom-0"
                    onClick={() => onDelete(people.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
      </ul>
      {isEditing && isCreating && (
        <Create onSubmit={onSubmit} SetIsCreating={SetIsCreating} />
      )}
      {isEditing && isUpdating && (
        <Update
          people={people}
          onSubmit={onSubmit}
          SetIsUpdating={SetIsUpdating}
        />
      )}

      {isEditing && !isCreating && !isUpdating && (
        <div className="govuk-!-margin-top-6">
          <button
            className="govuk-button govuk-!-margin-right-2"
            onClick={() => SetIsCreating(!isCreating)}
          >
            Add people
          </button>
          {Boolean(people.keyPeople.length) && (
            <button
              className="govuk-button"
              onClick={() => SetIsUpdating(!isUpdating)}
            >
              Edit people
            </button>
          )}
        </div>
      )}
    </LoadingSpinner>
  );
};

export default KeyPeople;
