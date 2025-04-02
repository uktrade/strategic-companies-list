import React, { useState } from "react";

import Breadcrumb from "../../components/Breadcrumb";
import NotificationBanner from "../../components/NotificationBanner";
import Notes from "./Notes";
import Details from "./Details";

const Page = ({ data, id, csrf_token }) => {
  const [engagement, setEngagement] = useState({
    title: data.title,
    details: data.details,
  });

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isCreatingNotes, setIsCreatingNotes] = useState(false);

  const showUpdateNotification = (notificationMessage) => {
    setNotificationMessage(notificationMessage);
    setIsUpdated(!isUpdated);
    setTimeout(() => {
      setIsUpdated(false);
    }, 2000);
  };

  return (
    <>
      {isUpdated && <NotificationBanner message={notificationMessage} />}
      <Breadcrumb
        links={[
          {
            label: data.company.name,
            href: `/company-briefing/${data.company.duns_number}`,
          },
          {
            label: data.title,
          },
        ]}
      />
      <main className="govuk-main-wrapper" id="main-content">
        <div className="govuk-grid-row">
          <div className="scl-page-header">
            <div className="scl-page-header__two-thirds">
              <Details
                data={data}
                csrf_token={csrf_token}
                engagement={engagement}
                setEngagement={setEngagement}
                isEditing={isEditing}
                isUpdatingDetails={isUpdatingDetails}
                setIsUpdatingDetails={setIsUpdatingDetails}
                showUpdateNotification={showUpdateNotification}
              />
              {data.is_account_manager && (
                <Notes
                  csrf_token={csrf_token}
                  id={data.id}
                  data={data.notes}
                  isEditing={isEditing}
                  isUpdatingNotes={isUpdatingNotes}
                  isCreatingNotes={isCreatingNotes}
                  setIsUpdatingNotes={setIsUpdatingNotes}
                  setIsCreatingNotes={setIsCreatingNotes}
                  showUpdateNotification={showUpdateNotification}
                />
              )}
            </div>
            <div className="scl-page-header__one-third">
              {data.is_account_manager && (
                <div className="scl-page-header__actions">
                  <button
                    className={`govuk-button ${
                      isEditing ? "govuk-button--secondary" : ""
                    }`}
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setIsUpdatingDetails(false);
                      setIsUpdatingNotes(false);
                      setIsCreatingNotes(false);
                    }}
                  >
                    {isEditing ? "Stop editing" : "Edit"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
