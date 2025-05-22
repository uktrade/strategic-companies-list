import React, { useState, useContext } from "react";

import Breadcrumb from "../../components/Breadcrumb";
import Notes from "./Notes";
import Details from "./Details";

import { GlobalContext } from "../../providers";

const Page = ({ data, csrf_token }) => {
  const [isUpdatingEngagement, setIsUpdatingEngagement] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  const { isAccountManager } = useContext(GlobalContext);

  return (
    <>
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
          <div className="govuk-grid-column-two-thirds">
            <Details
              data={data}
              csrf_token={csrf_token}
              isUpdatingEngagement={isUpdatingEngagement}
              setIsUpdatingEngagement={setIsUpdatingEngagement}
            />
            {isAccountManager && (
              <Notes
                csrf_token={csrf_token}
                data={data}
                isUpdatingEngagement={isUpdatingEngagement}
                setIsUpdatingNotes={setIsUpdatingNotes}
              />
            )}
          </div>
          <div className="govuk-grid-column-one-third">
            {!isUpdatingEngagement && !isUpdatingNotes && isAccountManager && (
              <div className="scl-page-header__actions">
                <button
                  className="govuk-button govuk-button--secondary"
                  onClick={() => setIsUpdatingEngagement(true)}
                >
                  Edit engagement
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
