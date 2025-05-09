import React, { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";
import { GlobalContextProvider } from "./providers";

const mount = (Component, id) => {
  const rootElement = document.getElementById(id);
  const dataProps = rootElement.getAttribute("data-props");
  const props = dataProps ? JSON.parse(dataProps) : {};
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <GlobalContextProvider
        values={{
          featureFlags: props.data.flags,
          isAccountManager: props.data.is_account_manager,
        }}
      >
        <Component {...props} />
      </GlobalContextProvider>
    </StrictMode>
  );
};

export default mount;
