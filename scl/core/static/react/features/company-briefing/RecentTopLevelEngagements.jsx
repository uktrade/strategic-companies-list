import React from "react";
import Section from "../../components/Section";

const RecentTopLevelEngagements = ({ engagements, duns_number }) => (
  <Section isPrivaliged title="Recent top-level engagements across HMG">
    {engagements.length ? (
      <>
        <ul class="scl-multiline-list govuk-!-margin-top-5">
          {engagements.map((engagement) => {
            return (
              <li className="scl-multiline-list__item">
                <a
                  href={`/engagement/${engagement.id}`}
                  class="govuk-link govuk-link--no-visited-state scl-multiline-list__link"
                >
                  <strong class="govuk-tag govuk-tag--grey govuk-!-font-tabular-numbers scl-tag scl-tag--small scl-tag--date scl-multiline-list__date">
                    {engagement.date}
                  </strong>
                  <span class="scl-multiline-list__link_text">
                    {engagement.title}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p class="govuk-body govuk-!-margin-top-0 govuk-!-margin-bottom-0 scl-body--small">
          <a
            href={`/company-briefing/${duns_number}/engagements`}
            class="govuk-link govuk-link--no-visited-state scl-link--no-underline"
          >
            View working-level engagements
          </a>
        </p>
      </>
    ) : (
      <p class="govuk-body">No current engagements.</p>
    )}
  </Section>
);

export default RecentTopLevelEngagements;
