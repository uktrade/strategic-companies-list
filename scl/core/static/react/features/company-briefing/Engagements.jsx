import React from "react";
import Section from "../../components/Section";

const colour_engagement_type_map = {
  "legacy": "grey",
  "Email or website": "light-blue",
  "Face to Face": "pink",
  "Letter": "yellow",
  "Non-contact Research": "grey",
  "Social Media": "purple",
  "Telephone": "green",
  "Video/Teleconf": "orange",
};

const Engagements = ({ engagements, duns_number }) => (
  <Section title="Engagements" data-testid="engagements">
    {engagements.length ? (
      <>
        <ul className="scl-multiline-list govuk-!-margin-top-2">
          {engagements.map((engagement) => {
            return (
              <li
                className="scl-multiline-list__item govuk-!-margin-bottom-3"
                key={engagement.id}
              >
                <a
                  href={`/engagement/${engagement.id}`}
                  className="govuk-link govuk-link--no-visited-state scl-multiline-list__link govuk-!-font-size-19 govuk-!-font-weight-bold"
                >
                  <strong
                    className={`govuk-tag govuk-tag--${
                      colour_engagement_type_map[engagement.engagement_type]
                    } scl-tag scl-tag--wide govuk-!-font-weight-regular govuk-!-margin-bottom-2`}
                  >
                    {engagement.engagement_type}
                  </strong>
                  <span className="scl-multiline-list__link_text">
                    {engagement.title}
                  </span>
                </a>
                <p class="govuk-body govuk-body-s govuk-!-margin-top-2 govuk-!-margin-bottom-2">
                  <strong>Date</strong>
                  <br />
                  <span class="govuk-!-text-break-word">{engagement.date}</span>
                </p>
                <p class="govuk-body govuk-body-s govuk-!-margin-bottom-2">
                  <strong>Atendees</strong>
                  <br />
                  <span>
                    {engagement.company_representatives
                      ?.concat(
                        engagement.civil_servants ?? [],
                        engagement.ministers ?? []
                      )
                      .join(", ")}
                  </span>
                </p>
                <hr class="govuk-section-break govuk-section-break--m govuk-section-break--visible govuk-!-margin-bottom-3"></hr>
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
