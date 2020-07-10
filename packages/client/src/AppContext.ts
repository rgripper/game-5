import React, { useContext } from "react";

export type AppContext = { userId: string };
export const AppContext = React.createContext<AppContext | undefined>(
  undefined
);
export const useAppContext = (): AppContext => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("AppContext must be provided");
  }

  return context;
};
