import React, { useEffect, useState } from "react";

const NotificationBanner = ({ message, status = "info" }) => {
  const [isUpdated, setIsUpdated] = useState(false);
  useEffect(() => {
    if (message) {
      setIsUpdated(true);
      setTimeout(() => {
        setIsUpdated(false);
      }, 3000);
    }
  }, [message]);
  
  if (isUpdated) {
    if (status === "info") {
      return (
        <div
          className="govuk-notification-banner govuk-notification-banner--success"
          role="alert"
          aria-labelledby="govuk-notification-banner-title"
          data-module="govuk-notification-banner"
        >
          <div className="govuk-notification-banner__header">
            <h2
              className="govuk-notification-banner__title"
              id="govuk-notification-banner-title"
            >
              Saved
            </h2>
          </div>
          <div className="govuk-notification-banner__content">
            <h3 className="govuk-notification-banner__heading">{message}</h3>
          </div>
        </div>
      );
    }

    if (status === "warning") {
      return (
        <div className="govuk-error-summary" data-module="govuk-error-summary">
          <div role="alert">
            <h2 className="govuk-error-summary__title">There is a problem</h2>
            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                <li>{message}</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
  } else {
    return null;
  }
};

export default NotificationBanner;
