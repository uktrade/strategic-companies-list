import React from "react";
import Section from "../../components/Section";

const Engagements = ({ engagements, duns_number }) => (
  <Section isPrivaliged title="Engagements">
    {engagements.length ? (
      <>
        <ul className="scl-multiline-list govuk-!-margin-top-5">
          {engagements.map((engagement) => {
            return (
              <li className="scl-multiline-list__item" key={engagement.id}>
                <a
                  href={`/engagement/${engagement.id}`}
                  className="govuk-link govuk-link--no-visited-state scl-multiline-list__link"
                >
                  <strong className="govuk-tag govuk-tag--grey govuk-!-font-tabular-numbers scl-tag scl-tag--small scl-tag--date scl-multiline-list__date">
                    {engagement.date}
                  </strong>
                  <span className="scl-multiline-list__link_text">
                    {engagement.title}
                  </span>
                </a>
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
      <p className="govuk-body">No current engagements.</p>
    )}
  </Section>
);

export default Engagements;
