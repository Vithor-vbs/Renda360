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
          className={`sidebar-item ${selected === "/home" ? "active" : ""}`}
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
            selected === "/transactions" ? "active" : ""
          }`}
        >
          <span className="sidebar-icon">
            <LuCreditCard />
          </span>
          Transações
        </Link>
      </li>
      <li>
        <Link
          to="/extractor  "
          className={`sidebar-item ${
            selected === "/doc-extractor" ? "active" : ""
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
          className={`sidebar-item ${selected === "/julius-ai" ? "active" : ""}`}
        >
          <span className="sidebar-icon">
            <FaUserTie />
          </span>
          Julius IA
        </div>
      </li>
      <li>
        <Link
          to="/notification"
          className={`sidebar-item ${selected === "/notification" ? "active" : ""}`}
        >
          <span className="sidebar-icon">
            <FaBell />
          </span>
          Notificações
        </Link>
      </li>
    </ul>
  </div>
);