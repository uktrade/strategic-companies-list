import React, { useState, useContext, useEffect } from "react";

import PageActions from "../../components/PageActions";
import Breadcrumb from "../../components/Breadcrumb";

import KeyPeople from "./KeyPeople";
import KeyFacts from "./KeyFacts";
import Priorities from "./Priorities";
import CompanyDetails from "./CompanyDetails";
import Engagements from "./Engagements";
import AccountManagers from "./AccountManagers";
import AddEngagement from "./AddEngagement";
import Summary from "./Summary";
import NotificationBanner from "../../components/NotificationBanner";

const Page = ({ data, id, csrf_token, nonce }) => {
  const [isAddingEngagement, setIsAddingEngagement] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isEngagementsUpdated, setIsEngagementsUpdated] = useState(false);
  const [engagements, setEngagements] = useState(data.engagements);

  return (
    <>
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
              {isEngagementsUpdated && (
                <NotificationBanner
                  message={notification.message}
                  status={notification.status}
                />
              )}
              <CompanyDetails
                data={data}
                nonce={nonce}
                isAddingEngagement={isAddingEngagement}
                csrf_token={csrf_token}
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
            <div
              className={`${
                isAddingEngagement
                  ? "govuk-!-display-block"
                  : "govuk-!-display-none"
              }`}
            >
              <AddEngagement
                data={data}
                csrf_token={csrf_token}
                setNotification={setNotification}
                setEngagements={setEngagements}
                setIsAddingEngagement={setIsAddingEngagement}
                setIsEngagementsUpdated={setIsEngagementsUpdated}
              />
            </div>

            <div
              className={`${
                isAddingEngagement
                  ? "govuk-!-display-none"
                  : "govuk-!-display-block"
              }`}
            >
              <Summary data={data} csrf_token={csrf_token} />
              <KeyFacts data={data} />
              <KeyPeople
                id={id}
                csrf_token={csrf_token}
                keyPeople={data.key_people}
                isAccountManager={data.is_account_manager}
              />
              {data.has_access && data.is_account_manager && (
                <>
                  <Priorities
                    id={id}
                    insightType="company_priority"
                    title="Company Priorities"
                    emptyMessage="Currently no company priorites are assigned."
                    csrf_token={csrf_token}
                    companyPriorities={data.company_priorities}
                  />
                  <Priorities
                    id={id}
                    title="Government Priorities"
                    insightType="hmg_priority"
                    emptyMessage="Currently no Government Priorities are assigned."
                    csrf_token={csrf_token}
                    companyPriorities={data.hmg_priorities}
                  />
                </>
              )}
            </div>
          </div>
          <div className="govuk-grid-column-one-third">
            {data.has_access && data.is_account_manager && (
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
