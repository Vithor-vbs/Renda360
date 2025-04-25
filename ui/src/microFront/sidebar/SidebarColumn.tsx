import React from 'react';
import './SidebarColumn.css';
import { LuLayoutDashboard } from "react-icons/lu";
import { FaChartPie, FaWallet, FaUniversity, FaUserTie, FaTasks } from 'react-icons/fa';

export const SidebarColumn: React.FC = () => (
  <div className="sidebar-column">
    <ul className="sidebar-list">
      <li className="sidebar-item">
        <span className="sidebar-icon"><LuLayoutDashboard  /></span>
        Dashboard
      </li>
      <li className="sidebar-item">
        <span className="sidebar-icon"><FaChartPie /></span>
        Net Worth
      </li>
      <li className="sidebar-item">
        <span className="sidebar-icon"><FaWallet /></span>
        Budget
      </li>
      <li className="sidebar-item">
        <span className="sidebar-icon"><FaUniversity /></span>
        Doc Extractor
      </li>
      <li className="sidebar-item">
        <span className="sidebar-icon"><FaUserTie /></span>
        JuliusAI
      </li>
      <li className="sidebar-item">
        <span className="sidebar-icon"><FaTasks /></span>
        Action Plan
      </li>
    </ul>
  </div>
);
