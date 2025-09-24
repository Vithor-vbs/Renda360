import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarColumn } from "../../microFront/sidebar/SidebarColumn";
import Banner from "../../microFront/banner/Banner";
import NotificationPopup from "../../microFront/notification/NotificationPopup";
import { JuliusAIManager } from "../JuliusAIManager/JuliusAIManager";
import "./AppLayout.css";
import { useAuth } from "@/context/AuthContext";

const mockNotifications = [
  {
    id: 1,
    message: "Você recebeu um Pix de R$ 860,00",
    timestamp: "15/05/2025 09:20",
    read: false,
  },
  {
    id: 2,
    message: "Compra no cartão de crédito de R$ 200,00",
    timestamp: "14/05/2025 21:00",
    read: false,
  },
];

const AppLayout: React.FC = () => {
  const [hovering, setHovering] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setHovering(false);
    navigate("/Notification");
  };

  const { loggedUser, loading } = useAuth();
  console.log("Logged user:", loggedUser);

  return (
    <div className="app-layout-wrapper">
      <Banner
        onNotificationHover={setHovering}
        clientName={loading ? "" : loggedUser?.username ?? ""}
      />
      <div className="app-layout-body">
        <div className="app-layout-sideBar">
          <SidebarColumn selected={location.pathname} />
        </div>
        <div className="app-layout-content">
          {hovering && (
            <NotificationPopup
              notifications={notifications}
              onClose={handleClose}
            />
          )}
          <Outlet />
        </div>
      </div>

      {/* Floating Julius AI Manager Button*/}
      <JuliusAIManager />
    </div>
  );
};

export default AppLayout;
