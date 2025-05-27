import React from "react";
import Section from "../../components/Section";

const Engagements = ({ engagements, duns_number }) => (
  <Section
    title="Engagements"
    data-testid="engagements"
    className="scl-engagement-list"
  >
    {engagements.length ? (
      <>
        <ul className="scl-multiline-list govuk-!-margin-top-2">
          {engagements.map((engagement) => {
            return (
              <li
                className="scl-multiline-list__item govuk-!-margin-bottom-3"
                key={engagement.id}
              >
                <p
                  className={`govuk-tag govuk-!-font-size-16 govuk-!-font-weight-regular govuk-tag govuk-tag--${engagement.engagement_type_colour}`}
                >
                  {engagement.engagement_type}
                </p>
                <a
                  href={`/engagement/${engagement.id}`}
                  className="govuk-link govuk-link--no-visited-state scl-multiline-list__link govuk-!-font-size-19 govuk-!-font-weight-bold"
                >
                  <p className="scl-multiline-list__link_text govuk-link govuk-!-font-weight-bold govuk-!-font-size-19 govuk-!-margin-bottom-2 govuk-!-margin-top-2">
                    {engagement.title}
                  </p>
                </a>
                <dl className="govuk-summary-list govuk-summary-list--no-border govuk-!-font-size-16 govuk-!-margin-bottom-3">
                  <div className="govuk-summary-list__row govuk-!-margin-bottom-2">
                    <dt className="govuk-summary-list__key">Date</dt>
                    <dd className="govuk-summary-list__value">
                      {engagement.date}
                    </dd>
                  </div>
                  <div className="govuk-summary-list__row govuk-!-margin-bottom-2">
                    <dt className="govuk-summary-list__key">Attendees</dt>
                    <dd className="govuk-summary-list__value">
                      {(engagement.all_attendees ?? []).join(", ")}
                    </dd>
                  </div>
                </dl>
                <div className="govuk-!-display-none engagement-details">
                  <p className="govuk-body">{engagement.details}</p>
                </div>
                <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-bottom-4" />
              </li>
            );
          })}
        </ul>
        <p className="govuk-body govuk-!-margin-top-0 govuk-!-margin-bottom-0 scl-body--small">
          <a
            href={`/company-briefing/${duns_number}/engagements`}
            className="govuk-link govuk-link--no-visited-state scl-link--no-underline"
          >
            View all engagements
          </a>
        </p>
      </>
    ) : (
      <>
        <p className="govuk-body">No current engagements.</p>
        <p className="govuk-body govuk-!-margin-top-0 govuk-!-margin-bottom-0 scl-body--small">
          <a
            href={`/company-briefing/${duns_number}/engagements`}
            className="govuk-link govuk-link--no-visited-state scl-link--no-underline"
          >
            View all engagements
          </a>
        </p>
      </>
    )}
  </Section>
);

export default Engagements;
