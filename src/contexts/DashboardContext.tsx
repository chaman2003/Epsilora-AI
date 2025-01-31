import React, { createContext, useContext, useState } from 'react';

interface DashboardContextType {
  refreshDashboard: () => void;
  shouldRefresh: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshDashboard = () => {
    setShouldRefresh(true);
  };

  const value = {
    refreshDashboard,
    shouldRefresh,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
