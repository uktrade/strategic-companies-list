import React, { useState } from "react";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/Spinner";
import Update from "../../forms/key-people/Update";
import Create from "../../forms/key-people/Create";
import Section from "../../components/Section";
import SectionActions from "../../components/SectionActions";
import NotificationBanner from "../../components/NotificationBanner";

const KeyPeople = ({ id, csrf_token, keyPeople, isAccountManager }) => {
  const [people, setPeople] = useState(keyPeople);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    setIsUpdating(false);
    setIsCreating(false);
  };

  const ENDPOINT = `/api/v1/key-people/${id}`;

  const onDelete = async (userId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { id: userId },
      csrf_token
    );

    resetState();

    if (status == 200) {
      setPeople(data.data);
      setNotification({ message: "Key person deleted" });
    } else {
      setNotification({
        message: `Status ${status}: ${data.message || data.error}`,
        status: "warning",
      });
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
        setPeople(data.data);
        setNotification({ message: "Key person created" });
      } else {
        setNotification({
          message: `Status ${status}: ${data.message || data.error}`,
          status: "warning",
        });
      }
    }

    if (method === "update") {
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload.people,
        csrf_token
      );

      resetState();

      if (status == 200) {
        setPeople(data.data);
        setNotification({ message: "Key person updated" });
      } else {
        setNotification({
          message: `Status ${status}: ${data.message || data.error}`,
          status: "warning",
        });
      }
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
      <Section title="Key people in this company">
        <NotificationBanner
          message={notification?.message}
          status={notification?.status}
        />

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
                      {people.role} - {people.name}
                      {isAccountManager ? ` (${people.email})` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {isCreating && (
          <Create onSubmit={onSubmit} setIsCreating={setIsCreating} />
        )}
        {isUpdating && (
          <Update
            id={id}
            data={people}
            onSubmit={onSubmit}
            onDelete={onDelete}
            setIsUpdating={setIsUpdating}
          />
        )}
        {!isCreating && !isUpdating && (
          <SectionActions
            addLabel="Add people"
            editLabel="Edit people"
            showEdit={Boolean(people?.length)}
            setIsCreating={() => setIsCreating(!isCreating)}
            setIsUpdating={() => setIsUpdating(!isUpdating)}
          />
        )}
      </Section>
    </LoadingSpinner>
  );
};

export default KeyPeople;
