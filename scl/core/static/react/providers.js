import React, { createContext } from "react";

export const FlagContext = createContext();

export const FeatureFlagContextProvider = ({ flags, children }) => (
  <FlagContext.Provider value={flags}>{children}</FlagContext.Provider>
);
