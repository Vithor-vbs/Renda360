import React from "react";
import "./DashboardHeader.css";
import ButtonDate from "../buttonDate/buttonDate";

interface Props {
  onDateRangeChange?: (start: Date, end: Date) => void;
}

export const DashboardHeaderWithAPI: React.FC<Props> = ({
  onDateRangeChange,
}) => {
  const handleDateChange = (start: Date, end: Date) => {
    onDateRangeChange?.(start, end);
  };

  return (
    <div className="dashboard-header">
      <div className="header-text">
        <h1 className="header-title">Dashboard</h1>
        <p className="header-subtitle">
          Gerencie seus pagamentos e transações em um clique
        </p>
      </div>

      <div className="header-actions">
        <ButtonDate onRangeChange={handleDateChange} />
      </div>
    </div>
  );
};
