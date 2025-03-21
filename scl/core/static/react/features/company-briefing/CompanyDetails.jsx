import React, { useState } from "react";

import ApiProxy from "../../proxy";
import Header from "../../components/Header";
import Update from "../../forms/company-details/Update";

const CompanyDetails = ({ data, isEditing, csrf_token }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, SetIsUpdating] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(data)

  const ENDPOINT = `/api/v1/company/${data.duns_number}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );


    setCompanyDetails(data);
    setIsLoading(false);
    SetIsUpdating(false);
  };

  return (
    <>
      <Header
        title={companyDetails.title}
        duns_number={companyDetails.duns_number}
        sectors={companyDetails.sectors}
        last_updated={companyDetails.last_updated}
      />
      {true && isUpdating && (
        <Update data={companyDetails} onSubmit={onSubmit} />
      )}
      {isEditing && !isUpdating && (
        <button
          className="govuk-button"
          onClick={() => SetIsUpdating(!isUpdating)}
        >
          Edit company details
        </button>
      )}
    </>
  );
};

export default CompanyDetails;
