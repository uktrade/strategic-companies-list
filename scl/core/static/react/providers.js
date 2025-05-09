import React, { createContext } from "react";

export const GlobalContext = createContext();

export const GlobalContextProvider = ({ values, children }) => {
  return (
    <GlobalContext.Provider
      value={{
        ...values,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
