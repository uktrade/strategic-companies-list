import React from "react";
import Section from "../../components/Section";

const AccountManagers = ({ accountManagers }) => (
  <Section isPrivaliged title="Account managers">
    {accountManagers.length ? (
      <>
        <ul class="scl-multiline-list">
          {accountManagers.map((manager) => {
            return (
              <li className="scl-multiline-list__item">
                <div class="scl-key-list__item_header">
                  <a
                    class="govuk-link govuk-link--no-visited-state scl-link--no-underline"
                    href="##"
                  >
                    {manager.name}
                  </a>
                  {manager.is_lead == "true" && (
                    <strong class="govuk-tag govuk-tag--turquoise scl-tag scl-tag--small govuk-!-static-margin-left-1">
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
      <p class="govuk-body">No account managers assigned.</p>
    )}
  </Section>
);

export default AccountManagers;
