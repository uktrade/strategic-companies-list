import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FeatureContextProvider } from "./providers";


const mount = (Component, id) => {
  const rootElement = document.getElementById(id);
  const dataProps = rootElement.getAttribute("data-props");
  const props = dataProps ? JSON.parse(dataProps) : {};
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <FeatureContextProvider flags={props.data.flags}>
        <Component {...props} />
      </FeatureContextProvider>
    </StrictMode>
  );
};

export default mount;
