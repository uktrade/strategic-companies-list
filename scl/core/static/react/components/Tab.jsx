import React, { useState } from "react";

const styles = {
  panel: {
    position: "relative",
    zIndex: 2,
    backgroundColor: "white",
  },
  li: {
    position: "relative",
    top: "1px",
    display: "inline-block",
    marginRight: "10px",
  },
  link: (selected) => ({
    padding: "15px 20px",
    display: "block",
    borderTop: "1px solid transparent",
    borderRight: "1px solid transparent",
    borderLeft: "1px solid transparent",
    color: "var(--govuk-black)",
    ...(selected && {
      borderTop: "1px solid #b1b4b6",
      borderRight: "1px solid #b1b4b6",
      borderBottom: "1px solid transparent",
      borderLeft: "1px solid #b1b4b6",
      backgroundColor: "white",
      textDecoration: "none",
    }),
  }),
};

export const Tabs = ({ id, children }) => {
  const [selected, setSelected] = useState(1);

  const handleClick = (e, index) => {
    e.preventDefault();
    setSelected(index + 1);
  };

  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabsListItem
  );
  const panels = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabsListPanel
  );

  return (
    <div className="govuk-frontend-supported">
      <div className="govuk-tabs govuk-!-margin-0" data-module="govuk-tabs">
        <ul className="govuk-tabs__list">
          {tabs.map((tab, index) => {
            return (
              <TabsListItem
                id={id}
                index={index}
                selected={index + 1 === selected}
                onClick={(e) => handleClick(e, index)}
              >
                {tab.props.children}
              </TabsListItem>
            );
          })}
        </ul>
        {panels.map((panel, index) => {
          return (
            <TabsListPanel
              id={id}
              index={index}
              selected={index + 1 === selected}
              style={panel.props.style}
            >
              {panel.props.children}
            </TabsListPanel>
          );
        })}
      </div>
    </div>
  );
};

export const TabsListItem = ({ children, selected, id, index, ...props }) => (
  <li style={styles.li}>
    <a
      className={selected && "selected"}
      href={`#${id}-${index + 1}`}
      {...props}
      style={styles.link(selected)}
    >
      {children}
    </a>
  </li>
);

export const TabsListPanel = ({ children, id, index, selected, ...props }) => (
  <div
    className={
      selected
        ? "govuk-tabs__panel"
        : "govuk-tabs__panel govuk-tabs__panel--hidden"
    }
    id={`${id}-${index + 1}`}
    style={{ ...styles.panel, ...props.style }}
  >
    {children}
  </div>
);
