import React, { useState, useContext } from "react";

import Breadcrumb from "../../components/Breadcrumb";
import Notes from "./Notes";
import Details from "./Details";

import { GlobalContext } from "../../providers";

const Page = ({ data, csrf_token }) => {
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isCreatingNotes, setIsCreatingNotes] = useState(false);

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
          <div className="scl-page-header">
            <div className="scl-page-header__two-thirds">
              <Details
                data={data}
                csrf_token={csrf_token}
              />
              {isAccountManager && (
                <Notes
                  csrf_token={csrf_token}
                  data={data}
                  isUpdatingNotes={isUpdatingNotes}
                  isCreatingNotes={isCreatingNotes}
                  setIsUpdatingNotes={setIsUpdatingNotes}
                  setIsCreatingNotes={setIsCreatingNotes}
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
