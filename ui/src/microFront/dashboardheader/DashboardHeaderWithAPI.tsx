import React from "react";
import "./DashboardHeader.css";


interface Props {
  onDateRangeChange?: (start: Date, end: Date) => void;
}

export const DashboardHeaderWithAPI: React.FC<Props> = ({
}) => {

  return (
    <div className="dashboard-header">
      <div className="header-text">
        <h1 className="header-title">Dashboard</h1>
        <p className="header-subtitle">
          Gerencie seus pagamentos e transações em um clique
        </p>
      </div>
    </div>
  );
};
