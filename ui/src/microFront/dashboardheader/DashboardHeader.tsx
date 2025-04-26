import React from 'react';
import './DashboardHeader.css'



export const DashboardHeader: React.FC = () => (
    <div className="dashboard-header">
    <div className="header-text">
      <h1 className="header-title">Dashboard</h1>
      <p className="header-subtitle">
        Manage your payments and transactions in one click
      </p>
    </div>

    <div className="header-actions">
      <button className="widget-button">+ Add widget</button>
      <button className="date-button">May 01 – May 15</button>
    </div>
  </div>
);
