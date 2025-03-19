import React, { useState } from "react";
import Header from "../../components/Header";
import KeyPeople from "./KeyPeople";

const Page = ({ data, id, csrf_token }) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleIsEditing = () => setIsEditing(!isEditing);

  return (
    <>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <Header
            title={data.name}
            duns_number={data.duns_number}
            sectors={data.sectors}
            last_updated={data.last_updated}
          />
        </div>
        <div className="govuk-grid-column-one-third">
          <div className="scl-page-actions">
            <button
              className={`govuk-button ${
                isEditing ? "govuk-button--warning" : ""
              }`}
              onClick={toggleIsEditing}
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
            <a
              href={`/company-briefing/${data.duns_number}/add-engagement`}
              role="button"
              className="govuk-button"
            >
              Add engagement
            </a>
          </div>
        </div>
      </div>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <KeyPeople
            id={id}
            csrf_token={csrf_token}
            isEditing={isEditing}
            toggleIsEditing={toggleIsEditing}
          />
        </div>
      </div>
    </>
  );
};

export default Page;
