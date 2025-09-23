import React from "react";
import "./settingsPage.css";
import UserCard from "../../microFront/userCard/userCard";
import { useAuth } from "@/context/AuthContext";

const settingsPage: React.FC = () => {
  const { loggedUser, loading } = useAuth();

  const name = loading ? "" : loggedUser?.username ?? "Usuário";
  const subtitle = loading ? "" : loggedUser?.email ?? "";

  return (
    <div className="settings-content">
      {}
      <div className="settings-card-center">
        <UserCard name={name} subtitle={subtitle} />
      </div>

      {}
      <div className="settings-panel">
        <h3>Preferências / Conteúdo</h3>
        {}
      </div>
    </div>
  );
};

export default settingsPage;
