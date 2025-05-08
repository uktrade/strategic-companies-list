import React, { useState } from "react";

import { Tabs, TabsListItem, TabsListPanel } from "../../components/Tab";
import { Cell, Row, Table } from "../../components/Table";

const Page = ({ data, csrf_token }) => {
  return (
    <>
      <Tabs id="enagagments-tabs">
        <TabsListItem>Upcoming Engagements</TabsListItem>
        <TabsListItem>Past Engagements</TabsListItem>
        <TabsListPanel>
        <h2 class="govuk-heading-l">Upcoming Engagements</h2>
          <Table
            headers={["Date", "Engagements"]}
            numRows={data.engagements.length}
            data={data.enagements}
            hasScroll={false}
          >
            {data.engagements.map((x) => (
              <Row>
                <Cell><strong>{x.date}</strong></Cell>
                <Cell>
                  <a className="govuk-link" href={x.link}>
                    {x.title}
                  </a>
                </Cell>
              </Row>
            ))}
          </Table>
        </TabsListPanel>
        <TabsListPanel>
        <h2 class="govuk-heading-l">Past Engagements</h2>
          <Table
            headers={["Date", "Engagements"]}
            numRows={data.past_engagements.length}
            data={data.past_engagements}
            hasScroll={false}
          >
            {data.past_engagements.map((x) => (
              <Row>
                <Cell><strong>{x.date}</strong></Cell>
                <Cell>
                  <a className="govuk-link" href={x.link}>
                    {x.title}
                  </a>
                </Cell>
              </Row>
            ))}
          </Table>
        </TabsListPanel>
      </Tabs>
    </>
  );
};
export default Page;
