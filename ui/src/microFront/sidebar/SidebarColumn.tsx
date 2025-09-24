import React from "react";
import "./SidebarColumn.css";
import { LuLayoutDashboard, LuCreditCard } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUniversity,
  FaBell,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
} from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

interface Props {
  selected?: string;
}

export const SidebarColumn: React.FC<Props> = ({ selected }) => {
  const { logout } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const navigate = useNavigate();

  return (
    <div className={`sidebar-column ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <ul className="sidebar-list">
        <li>
          <Link
            to="/home"
            className={`sidebar-item ${selected === "/home" ? "active" : ""}`}
            title="Dashboard"
          >
            <span className="sidebar-icon">
              <LuLayoutDashboard />
            </span>
            {!isCollapsed && <span className="sidebar-text">Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/transactions"
            className={`sidebar-item ${selected === "/transactions" ? "active" : ""}`}
            title="Transações"
          >
            <span className="sidebar-icon">
              <LuCreditCard />
            </span>
            {!isCollapsed && <span className="sidebar-text">Transações</span>}
          </Link>
        </li>
        <li>
          <Link
            to="/extractor"
            className={`sidebar-item ${selected === "/extractor" ? "active" : ""}`}
            title="Extrator de Faturas"
          >
            <span className="sidebar-icon">
              <FaUniversity />
            </span>
            {!isCollapsed && <span className="sidebar-text">Extrator de Faturas</span>}
          </Link>
        </li>
        <li>
          <div
            className={`sidebar-item ${selected === "/julius-ai" ? "active" : ""}`}
            title="Julius IA"
          >
            <span className="sidebar-icon">
              <MdAutoAwesome size={25} />
            </span>
            {!isCollapsed && <span className="sidebar-text">Julius IA</span>}
          </div>
        </li>
        <li>
          <Link
            to="/notification"
            className={`sidebar-item ${selected === "/notification" ? "active" : ""}`}
            title="Notificações"
          >
            <span className="sidebar-icon">
              <FaBell />
            </span>
            {!isCollapsed && <span className="sidebar-text">Notificações</span>}
          </Link>
        </li>
      </ul>

      <div className="sidebar-bottom">
        <button
          type="button"
          className={`sidebar-item sidebar-button ${selected === "/settings" ? "active" : ""}`}
          onClick={() => navigate("/settingsPage")}
          title="Configurações"
        >
          <span className="sidebar-icon">
            <FaCog />
          </span>
          {!isCollapsed && <span className="sidebar-text">Configurações</span>}
        </button>

        <button
          className="sidebar-item sidebar-logout"
          onClick={logout}
          title="Sair"
        >
          <span className="sidebar-icon">
            <FaSignOutAlt />
          </span>
          {!isCollapsed && <span className="sidebar-text">Sair</span>}
        </button>
      </div>
    </div>
  );
};