import React from "react";

const NotificationBanner = ({ message }) => {
  return (
    <div className="scl-notification">
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
          <h3 className="govuk-notification-banner__heading">
            {message}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
