import React from "react";
import "./Home.css";
import { MainBoardWithAPI } from "../mainboard/MainboardWithAPI";
import { JuliusAIManager } from "@/components/JuliusAIManager/JuliusAIManager";

const HomeWithAPI: React.FC = () => (
  <div className="home-container">
    <div className="home-main">
      <MainBoardWithAPI />
      <JuliusAIManager />
    </div>
  </div>
);

export default HomeWithAPI;
