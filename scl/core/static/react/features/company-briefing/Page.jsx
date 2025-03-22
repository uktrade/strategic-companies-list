import React, { useState } from "react";

import ApiProxy from "../../proxy";

import KeyPeople from "./KeyPeople";
import KeyFacts from "./KeyFacts";
import Priorities from "./Priorities";

import PageActions from "../../components/PageActions";
import CompanyDetails from "./CompanyDetails";
import RecentTopLevelEngagements from "./RecentTopLevelEngagements";
import AccountManagers from "./AccountManagers";
import AddEngagement from "./AddEngagement";

const Page = ({ data, id, csrf_token }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [engagements, setEngagements] = useState(data.engagements);
  const [isAddingEngagement, setIsAddingEngagement] = useState(false);

  const ENDPOINT = `/api/v1/engagement/${data.duns_number}`;

  const onSubmitAddEngagement = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.post(ENDPOINT, payload, csrf_token);

    setEngagements(data.data);
    setIsLoading(false);
    setIsAddingEngagement(false);
  };

  return (
    <main className="govuk-main-wrapper" id="main-content">
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <CompanyDetails
            data={data}
            isEditing={isEditing}
            csrf_token={csrf_token}
          />
        </div>
        <div className="govuk-grid-column-one-third">
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
                  />
                  <Priorities
                    id={id}
                    title="HMG Priorities"
                    insightType="hmg_priority"
                    emptyMessage="Currently no HMG priorites are assigned."
                    csrf_token={csrf_token}
                    isEditing={isEditing}
                    companyPriorities={data.hmg_priorities}
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
          {data.is_privileged && (
            <AccountManagers accountManagers={data.account_managers} />
          )}
        </div>
      </div>
    </main>
  );
};

export default Page;
