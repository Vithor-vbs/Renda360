// SidebarColumn.tsx
import React from "react";
import "./SidebarColumn.css";
import { LuLayoutDashboard, LuCreditCard } from "react-icons/lu";
import { Link } from "react-router-dom";
import {
  FaChartPie,
  FaWallet,
  FaUniversity,
  FaUserTie,
  FaTasks,
  FaBell,
} from "react-icons/fa";

interface Props {
  selected?: string;
}

export const SidebarColumn: React.FC<Props> = ({ selected }) => (
  <div className="sidebar-column">
    <ul className="sidebar-list">
      <li>
        <Link
          to="/home"
          className={`sidebar-item ${selected === "Dashboard" ? "active" : ""}`}
        >
          <span className="sidebar-icon">
            <LuLayoutDashboard />
          </span>
          Dashboard
        </Link>
      </li>
      <li>
        <Link
          to="/transactions"
          className={`sidebar-item ${
            selected === "Transactions" ? "active" : ""
          }`}
        >
          <span className="sidebar-icon">
            <LuCreditCard />
          </span>
          Transações
        </Link>
      </li>
      {/* <li>
        <div className={`sidebar-item ${selected === 'Net Worth' ? 'active' : ''}`}>
          <span className="sidebar-icon"><FaChartPie /></span>
          Net Worth
        </div>
      </li>
      <li>
        <div className={`sidebar-item ${selected === 'Budget' ? 'active' : ''}`}>
          <span className="sidebar-icon"><FaWallet /></span>
          Budget
        </div>
      </li> */}
      <li>
        <Link
          to="/extractor  "
          className={`sidebar-item ${
            selected === "Doc Extractor" ? "active" : ""
          }`}
        >
          <span className="sidebar-icon">
            <FaUniversity />
          </span>
          Extrator de Faturas
        </Link>
      </li>
      <li>
        <div
          className={`sidebar-item ${selected === "JuliusAI" ? "active" : ""}`}
        >
          <span className="sidebar-icon">
            <FaUserTie />
          </span>
          Julius IA
        </div>
      </li>
      {/* <li>
        <div className={`sidebar-item ${selected === 'Action Plan' ? 'active' : ''}`}>
          <span className="sidebar-icon"><FaTasks /></span>
          Action Plan
        </div>
      </li> */}
      <li>
        <Link to="/Notification" className={`sidebar-item ${selected === 'Notification' ? 'active' : ''}`}>
          <span className="sidebar-icon"><FaBell /></span>
          Notificações
        </Link>
      </li>
    </ul>
  </div>
);
