import React from "react";
import Section from "../../components/Section";

const AccountManagers = ({ accountManagers }) => (
  <Section
    className="govuk-!-display-none-print"
    caption="Only account managers can add or edit this company's information."
    captionStyle={{ color: "#505A5F", marginBottom: "15px" }}
    title="Account managers"
  >
    {accountManagers.length ? (
      <>
        <ul className="scl-multiline-list">
          {accountManagers.map((manager) => {
            return (
              <li className="scl-multiline-list__item" key={manager.name}>
                <div className="govuk-body-s govuk-!-margin-bottom-0">
                  {manager.name}
                </div>
                <div className="govuk-body-s govuk-!-margin-bottom-0">
                  <a
                    className="govuk-link govuk-link--no-visited-state scl-link--no-underline"
                    href={`mailto:${manager.email}`}
                  >
                    {manager.email}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </>
    ) : (
      <p className="govuk-body">No account managers assigned.</p>
    )}
  </Section>
);

export default AccountManagers;
