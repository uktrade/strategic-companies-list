import React, { useState, useContext } from "react";

import Breadcrumb from "../../components/Breadcrumb";
import NotificationBanner from "../../components/NotificationBanner";
import Notes from "./Notes";
import Details from "./Details";

import { AccountContext } from "../../providers";

const Page = ({ data, csrf_token }) => {

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isCreatingNotes, setIsCreatingNotes] = useState(false);

  const { isAccountManager } = useContext(AccountContext);

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
                isUpdatingDetails={isUpdatingDetails}
                setIsUpdatingDetails={setIsUpdatingDetails}
                showUpdateNotification={showUpdateNotification}
              />
              {isAccountManager && (
                <Notes
                  csrf_token={csrf_token}
                  data={data}
                  isUpdatingNotes={isUpdatingNotes}
                  isCreatingNotes={isCreatingNotes}
                  setIsUpdatingNotes={setIsUpdatingNotes}
                  setIsCreatingNotes={setIsCreatingNotes}
                  showUpdateNotification={showUpdateNotification}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
