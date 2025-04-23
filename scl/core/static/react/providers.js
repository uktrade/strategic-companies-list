import React, { createContext } from "react";

export const AccountContext = createContext();

export const AccountContextProvider = ({ values, children }) => (
  <AccountContext.Provider value={values}>{children}</AccountContext.Provider>
);
