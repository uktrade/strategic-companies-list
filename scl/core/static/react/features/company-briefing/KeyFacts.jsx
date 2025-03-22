import React from "react";
import Section from "../../components/Section";

const KeyFacts = ({ data }) => {
  return (
    <Section title="Key Facts">
      <ul className="govuk-list govuk-list--bullet scl-key-people-list">
        {data.global_hq_country && (
          <li className="scl-key-people-list__item">
            Headquartered in {data.global_hq_country}
          </li>
        )}
        {data.turn_over && (
          <li className="scl-key-people-list__item">
            Has a global turnover of ${data.turn_over}
          </li>
        )}{" "}
        {data.employees && (
          <li className="scl-key-people-list__item">
            Employs {data.employees} people globally
          </li>
        )}
      </ul>
    </Section>
  );
};

export default KeyFacts;
