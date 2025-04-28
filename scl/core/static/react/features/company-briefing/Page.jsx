import React, { useState } from "react";

import ApiProxy from "../../proxy";

import PageActions from "../../components/PageActions";
import Breadcrumb from "../../components/Breadcrumb";

import KeyPeople from "./KeyPeople";
import KeyFacts from "./KeyFacts";
import Priorities from "./Priorities";
import CompanyDetails from "./CompanyDetails";
import Engagements from "./Engagements";
import AccountManagers from "./AccountManagers";
import AddEngagement from "./AddEngagement";
import NotificationBanner from "../../components/NotificationBanner";
import Summary from "./Summary";

const Page = ({ data, id, csrf_token, nonce }) => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [engagements, setEngagements] = useState(data.engagements);
  const [isAddingEngagement, setIsAddingEngagement] = useState(false);

  const showUpdateNotification = (notificationMessage) => {
    setNotificationMessage(notificationMessage);
    setIsUpdated(!isUpdated);
    setTimeout(() => {
      setIsUpdated(false);
    }, 2000);
  };

  const ENDPOINT = `/api/v1/engagement/${data.duns_number}`;

  const onSubmitAddEngagement = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.post(ENDPOINT, payload, csrf_token);

    setEngagements(data.data);
    setIsLoading(false);
    setIsAddingEngagement(false);
    showUpdateNotification("Engagement added");
  };

  return (
    <>
      {isUpdated && <NotificationBanner message={notificationMessage} />}
      <Breadcrumb
        links={[
          {
            label: data.title,
          },
        ]}
      />
      <main className="govuk-main-wrapper" id="main-content">
        <div className="govuk-grid-row">
          <div className="scl-page-header">
            <div className="scl-page-header__two-thirds">
              <CompanyDetails
                data={data}
                nonce={nonce}
                isAddingEngagement={isAddingEngagement}
                csrf_token={csrf_token}
                showUpdateNotification={showUpdateNotification}
              />
            </div>
            <div className="scl-page-header__one-third">
              {data.is_account_manager && (
                <PageActions
                  setIsAddingEngagement={setIsAddingEngagement}
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
                <Summary
                  data={data}
                  csrf_token={csrf_token}
                  showUpdateNotification={showUpdateNotification}
                />
                <KeyFacts data={data} />
                <KeyPeople
                  id={id}
                  showUpdateNotification={showUpdateNotification}
                  csrf_token={csrf_token}
                  keyPeople={data.key_people}
                />
                {data.has_access && (
                  <>
                    <Priorities
                      id={id}
                      insightType="company_priority"
                      title="Company Priorities"
                      emptyMessage="Currently no company priorites are assigned."
                      csrf_token={csrf_token}
                      companyPriorities={data.company_priorities}
                      showUpdateNotification={showUpdateNotification}
                    />
                    <Priorities
                      id={id}
                      title="Government Priorities"
                      insightType="hmg_priority"
                      emptyMessage="Currently no Government Priorities are assigned."
                      csrf_token={csrf_token}
                      companyPriorities={data.hmg_priorities}
                      showUpdateNotification={showUpdateNotification}
                    />
                  </>
                )}
              </>
            )}
          </div>
          <div className="govuk-grid-column-one-third">
            {data.has_access && (
              <Engagements
                engagements={engagements}
                duns_number={data.duns_number}
              />
            )}

            <AccountManagers accountManagers={data.account_managers} />
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
