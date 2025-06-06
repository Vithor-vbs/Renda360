import React from "react";
import { DashboardHeader } from "../dashboardheader/DashboardHeader";
import { BalancesRow } from "../balancesrow/BalancesRow";
import "./Mainboard.css";
import { PieChartComponent } from "@/components/PieChartComponent";
import { InteractiveAreaChart } from "@/components/AreaChart";
import { Goals } from "../goals/Goals";

export const MainBoard: React.FC = () => (
  <div className="main-board">
    <DashboardHeader />
    <BalancesRow />
    <InteractiveAreaChart />
    <div className="charts-and-goals">
      <PieChartComponent />
      <Goals />
    </div>
    {/* outros blocos virão aqui */}
  </div>
);
