import React, { createContext } from "react";

export const FlagContext = createContext();

export const FeatureContextProvider = ({ flags, children }) => (
  <FlagContext.Provider value={flags}>{children}</FlagContext.Provider>
);
