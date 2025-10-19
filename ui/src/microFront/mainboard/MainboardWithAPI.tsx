import React, { useState } from "react";
import "./Mainboard.css";
import { DashboardHeaderWithAPI } from "../dashboardheader/DashboardHeaderWithAPI";
import { BalancesRowWithAPI } from "../balancesrow/BalancesRowWithAPI";
import { PieChartComponentWithAPI } from "@/components/PieChartComponentWithAPI";
import { InteractiveAreaChartWithAPI } from "@/components/InteractiveAreaChartWithAPI";
import { Goals } from "../goals/Goals";
import Subscription from "../subscription/Subscription"
import { useDashboard } from "../../hooks/useDashboard";
import { useCards } from "../../hooks/useCards";
import { DateRange } from "../../api";

export const MainBoardWithAPI: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch dashboard data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboard({
    dateRange,
    autoFetch: true,
  });

  // Fetch cards data
  const { loading: cardsLoading } = useCards();

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  if (dashboardError) {
    return (
      <div className="main-board">
        <div className="error-message">
          <h3>Erro ao carregar dashboard</h3>
          <p>{dashboardError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-board">
      <DashboardHeaderWithAPI onDateRangeChange={handleDateRangeChange} />

      <BalancesRowWithAPI
        data={dashboardData?.cards_summary}
        loading={cardsLoading || dashboardLoading}
      />

      <div className="chart-container">
        <InteractiveAreaChartWithAPI
          data={dashboardData?.monthly_spending}
          loading={dashboardLoading}
        />
      </div>

      <div className="charts-and-goals">
        <div className="chart-container">
          <PieChartComponentWithAPI
            data={dashboardData?.spending_by_category}
            loading={dashboardLoading}
          />
        </div>
        <div className="goals-container">
          <Goals />
        </div>
        <div className="subscription-container">
          <Subscription />
        </div>
      </div>
    </div>
  );
};
