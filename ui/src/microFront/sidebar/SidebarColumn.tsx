import React from "react";
import "./SidebarColumn.css";
import { LuLayoutDashboard, LuCreditCard } from "react-icons/lu";
import { Link } from "react-router-dom";
import { FaUniversity, FaBell, FaSignOutAlt } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";
import { useAuth } from "../../context/AuthContext"; // Adjust path if needed
import { Temperature } from "../temperature/Temperature";


interface Props {
  selected?: string;
}

export const SidebarColumn: React.FC<Props> = ({ selected }) => {
  const { logout } = useAuth();

  return (
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
            to="/extractor"
            className={`sidebar-item ${
              selected === "/extractor" ? "active" : ""
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
            className={`sidebar-item ${
              selected === "/julius-ai" ? "active" : ""
            }`}
          >
            <span className="sidebar-icon">
              <MdAutoAwesome size={25} />
            </span>
            Julius IA
          </div>
        </li>
        <li>
          <Link
            to="/notification"
            className={`sidebar-item ${
              selected === "/notification" ? "active" : ""
            }`}
          >
            <span className="sidebar-icon">
              <FaBell />
            </span>
            Notificações
          </Link>
      < Temperature />
        </li>
      </ul>
      <button
        className="sidebar-item sidebar-logout"
        style={{
          marginTop: "auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1em",
          background: "none",
          border: "none",
          color: "#dae7e5",
          cursor: "pointer",
          fontWeight: 500,
          padding: "1.3rem 1rem",
        }}
        onClick={logout}
      >
        <span className="sidebar-icon">
          <FaSignOutAlt />
        </span>
        Sair
      </button>
    </div>
  );
};
