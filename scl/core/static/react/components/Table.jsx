import React, { useState } from "react";

const ROW_HEIGHT = 3.4;

const styles = {
  fontSize: "19px",
  tableLayout: "fixed",
  width: "100%",
  backgroundColor: "white",
  margin: 0,
};

const bodyStyle = {
  "word-break": "break-word",
};

const styleStickyHeader = {
  table: {
    position: "relative",
    borderCollapse: "separate",
    padding: 0,
  },
  th: {
    position: "sticky",
    top: 0,
    backgroundColor: "white",
    borderBottom: "1px solid var(--govuk-border)",
  },
};

const styleDivScroll = (num_rows, override_height) => {
  return {
    overflowY: "auto",
    "max-height": `${num_rows * ROW_HEIGHT + override_height}em`,
  };
};

export const Row = ({ children, ...props }) => (
  <tr class="govuk-table__row" {...props}>
    {children}
  </tr>
);

export const Cell = ({ children, header, scope, ...props }) => {
  return header ? (
    <th scope={scope} class="govuk-table__header" {...props}>
      {children}
    </th>
  ) : (
    <td class="govuk-table__cell" {...props}>
      {children}
    </td>
  );
};

/**
 * @param headers Display headers.
 * @param tableStyles Override table style.
 * @param headerStyles Override header style.
 * @param overrideTableHeight Override Table height.
 * @param numRows Rough calc for rows that show before scroll (if hasScroll == true).
 * @param hasStickyHeaders Do headers dissapear or remain fixed when scrolling?
 * @param hasScroll Navigate a fixed length table with a scrollbar or navigate the table down the page.
 * @param children react props
 */
export const Table = ({
  headers,
  tableStyles,
  headerStyles,
  overrideTableHeight = 0,
  numRows = 5,
  hasStickyHeaders = true,
  hasScroll = true,
  children,
  ...props
}) => (
  <div
    style={hasScroll ? { ...styleDivScroll(numRows, overrideTableHeight) } : {}}
  >
    <table
      {...props}
      class={`govuk-table ${props.className}`}
      style={{
        ...styles,
        ...tableStyles,
        ...(hasStickyHeaders ? { ...styleStickyHeader.table } : {}),
      }}
    >
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          {headers.map((header) => (
            <Cell
              header
              scope="col"
              style={{
                ...headerStyles,
                ...(hasStickyHeaders ? { ...styleStickyHeader.th } : {}),
              }}
            >
              {header}
            </Cell>
          ))}
        </tr>
      </thead>
      <tbody style={{ ...bodyStyle }}>{children}</tbody>
    </table>
  </div>
);
