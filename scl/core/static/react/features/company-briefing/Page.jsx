import React, { useState } from "react";

import ApiProxy from "../../proxy";

import PageActions from "../../components/PageActions";
import Breadcrumb from "../../components/Breadcrumb";

import KeyPeople from "./KeyPeople";
import KeyFacts from "./KeyFacts";
import Priorities from "./Priorities";
import CompanyDetails from "./CompanyDetails";
import RecentTopLevelEngagements from "./RecentTopLevelEngagements";
import AccountManagers from "./AccountManagers";
import AddEngagement from "./AddEngagement";
import NotificationBanner from "../../components/NotificationBanner";

const Page = ({ data, id, csrf_token }) => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [engagements, setEngagements] = useState(data.engagements);
  const [isAddingEngagement, setIsAddingEngagement] = useState(false);

  const showUpdateNotification = (notificationMessage)=> {
    setNotificationMessage(notificationMessage);
    setIsUpdated(!isUpdated);
    setTimeout(()=>{
      setIsUpdated(false);
    }, 2000)
  }

  const showDeleteNotification = (notificationMessage) => {
    setNotificationMessage(notificationMessage);
    setIsDeleted(!isDeleted);
    setTimeout(() => {
      setIsDeleted(false);
    }, 2000);
  };

  const ENDPOINT = `/api/v1/engagement/${data.duns_number}`;
  
  const onSubmitAddEngagement = async (payload) => {

    setIsLoading(true);
    const { data, status } = await ApiProxy.post(ENDPOINT, payload, csrf_token);

    setEngagements(data.data);
    setIsLoading(false);
    setIsAddingEngagement(false);
    showUpdateNotification('Engagement added');
  };

  return (
    <>
      {isUpdated && <NotificationBanner message={notificationMessage} />}
      {isDeleted && <NotificationBanner message={notificationMessage} />}
      <Breadcrumb company={data.title} />
      <main className="govuk-main-wrapper" id="main-content">
        <div className="govuk-grid-row">
          <div className="scl-page-header">
            <div className="scl-page-header__two-thirds">
              <CompanyDetails
                data={data}
                isEditing={isEditing}
                csrf_token={csrf_token}
                showUpdateNotification={showUpdateNotification}
              />
            </div>
            <div className="scl-page-header__one-third">
              {data.is_privileged && (
                <PageActions
                  setIsEditing={setIsEditing}
                  setIsAddingEngagement={setIsAddingEngagement}
                  isEditing={isEditing}
                  isAddingEngagement={isAddingEngagement}
                />
              )}
            </div>
          </div>
        </div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds">
            {isAddingEngagement ? (
              <AddEngagement
                isLoading={isLoading}
                setIsAddingEngagement={setIsAddingEngagement}
                onSubmitAddEngagement={onSubmitAddEngagement}
              />
            ) : (
              <>
                <KeyFacts data={data} />
                <KeyPeople
                  id={id}
                  showUpdateNotification={showUpdateNotification}
                  showDeleteNotification={showDeleteNotification}
                  csrf_token={csrf_token}
                  isEditing={isEditing}
                  keyPeople={data.key_people}
                />
                {data.is_privileged && (
                  <>
                    <Priorities
                      id={id}
                      insightType="company_priority"
                      title="Company Priorities"
                      emptyMessage="Currently no company priorites are assigned."
                      csrf_token={csrf_token}
                      isEditing={isEditing}
                      companyPriorities={data.company_priorities}
                      showUpdateNotification={showUpdateNotification}
                      showDeleteNotification={showDeleteNotification}
                    />
                    <Priorities
                      id={id}
                      title="HMG Priorities"
                      insightType="hmg_priority"
                      emptyMessage="Currently no HMG priorites are assigned."
                      csrf_token={csrf_token}
                      isEditing={isEditing}
                      companyPriorities={data.hmg_priorities}
                      showUpdateNotification={showUpdateNotification}
                      showDeleteNotification={showDeleteNotification}
                    />
                  </>
                )}
              </>
            )}
          </div>
          <div className="govuk-grid-column-one-third">
            {data.is_privileged && (
              <RecentTopLevelEngagements
                engagements={engagements}
                duns_number={data.duns_number}
              />
            )}

            <AccountManagers
              isPrivaliged={false}
              accountManagers={data.account_managers}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
