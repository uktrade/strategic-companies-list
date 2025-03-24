import React, { useState } from "react";

import ApiProxy from "../../proxy";
import Header from "../../components/Header";
import Update from "../../forms/company-details/Update";
import LoadingSpinner from "../../components/Spinner";

const CompanyDetails = ({
  data,
  isEditing,
  csrf_token,
  showUpdateNotification,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(data);

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
    setIsUpdating(false);
    showUpdateNotification('Company updated');
  };

  return (
    <LoadingSpinner isLoading={false}>
      <Header
        title={companyDetails.title}
        duns_number={companyDetails.duns_number}
        sectors={companyDetails.sectors}
        last_updated={companyDetails.last_updated}
      />

      {isEditing && isUpdating && (
        <Update
          data={companyDetails}
          onSubmit={onSubmit}
          setIsUpdating={setIsUpdating}
        />
      )}
      {isEditing && !isUpdating && (
        <button
          className="govuk-button"
          onClick={() => setIsUpdating(!isUpdating)}
        >
          Edit company details
        </button>
      )}
    </LoadingSpinner>
  );
};

export default CompanyDetails;
