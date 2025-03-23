import React from "react";
import Section from "../../components/Section";

const AccountManagers = ({ accountManagers, isPrivaliged }) => (
  <Section isPrivaliged={isPrivaliged} title="Account managers">
    {accountManagers.length ? (
      <>
        <ul className="scl-multiline-list">
          {accountManagers.map((manager) => {
            return (
              <li className="scl-multiline-list__item" key={manager.name}>
                <div className="scl-key-list__item_header">
                  <a
                    className="govuk-link govuk-link--no-visited-state scl-link--no-underline"
                    href="#"
                  >
                    {manager.name}
                  </a>
                  {manager.is_lead == "true" && (
                    <strong className="govuk-tag govuk-tag--turquoise scl-tag scl-tag--small govuk-!-static-margin-left-1">
                      Lead
                    </strong>
                  )}
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
