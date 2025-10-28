import React from 'react';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => (
  <div className="app-layout">
    {children}
  </div>
);

export default AppLayout;

