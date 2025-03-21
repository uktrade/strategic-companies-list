import React, { useState } from "react";
import KeyPeople from "./KeyPeople";
import PageActions from "../../components/PageActions";
import Priorities from "./Priorities";
import CompanyDetails from "./CompanyDetails";

const Page = ({ data, id, csrf_token }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
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
              link={`/company-briefing/${data.duns_number}/add-engagement`}
              label="Add engagement"
              toggleIsEditing={() => setIsEditing(!isEditing)}
              isEditing={isEditing}
            />
          )}
        </div>
      </div>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
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
        </div>
      </div>
    </>
  );
};

export default Page;
