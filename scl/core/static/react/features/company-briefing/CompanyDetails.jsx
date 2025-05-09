import React, { useState, useContext } from "react";

import ApiProxy from "../../proxy";
import Update from "../../forms/company-details/Update";
import LoadingSpinner from "../../components/Spinner";
import NotificationBanner from "../../components/NotificationBanner";

import { GlobalContext } from "../../providers";

const CompanyDetails = ({ data, csrf_token, isAddingEngagement, nonce }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(data);

  const { isAccountManager } = useContext(GlobalContext);

  const ENDPOINT = `/api/v1/company/${data.duns_number}`;

  const onSubmit = async (payload) => {
    setIsLoading(true);

    const { data, status } = await ApiProxy.update(
      ENDPOINT,
      payload,
      csrf_token
    );

    setIsLoading(false);
    setIsUpdating(false);

    if (status === 200) {
      setCompanyDetails(data.data);
      setNotification({ message: "Company details updated" });
    } else {
      setNotification({ message: data.message, status: "warning" });
    }
  };

  return (
    <LoadingSpinner isLoading={isLoading}>
        <NotificationBanner
          message={notification?.message}
          status={notification?.status}
        />
      <div className="govuk-!-margin-bottom-4">
        <h1 className="govuk-heading-l govuk-!-margin-bottom-4">
          {companyDetails.title}
        </h1>
        {!isUpdating && (
          <>
            <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
              <strong>D-U-N-S:</strong> {companyDetails.duns_number}
            </p>
            <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
              <strong>Sectors:</strong>{" "}
              {companyDetails.company_sectors
                .map((sector) => sector.label)
                .join(", ")}
            </p>
            <p className="govuk-body govuk-body-s govuk-!-margin-bottom-1">
              <strong>Last updated:</strong> {companyDetails.last_updated}
            </p>
          </>
        )}
      </div>

      {isUpdating && (
        <Update
          data={companyDetails}
          onSubmit={onSubmit}
          setIsUpdating={setIsUpdating}
          nonce={nonce}
        />
      )}
      {!isUpdating && !isAddingEngagement && isAccountManager && (
        <button
          className="govuk-button govuk-button--secondary"
          onClick={() => setIsUpdating(!isUpdating)}
        >
          Edit company details
        </button>
      )}
    </LoadingSpinner>
  );
};

export default CompanyDetails;
