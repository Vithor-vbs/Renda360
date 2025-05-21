import React from "react";
import { DashboardHeader } from "../dashboardheader/DashboardHeader";
import { BalancesRow } from "../balancesrow/BalancesRow";
import "./Mainboard.css";
import { PieChartComponent } from "@/components/PieChartComponent";
import { LineGraph } from "@/components/LineGraph";
import { InteractiveAreaChart } from "@/components/AreaChart";

// import { LineGraph } from '@/components/LineGraph'

export const MainBoard: React.FC = () => (
  <div className="main-board">
    <DashboardHeader />
    <BalancesRow />
    {/* <LineGraph /> */}
    <InteractiveAreaChart />
    <PieChartComponent />
    {/* outros blocos virão aqui */}
  </div>
);
