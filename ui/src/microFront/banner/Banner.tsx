import React from "react";
import "./Banner.css";
import logo from "../../assets/logo_with_name.png";
import accountIcon from "../../assets/account.png";
import { IconButton } from "../iconButton/IconButton";
import settingsIcon from "../../assets/settings.svg";
import notificationIcon from "../../assets/notification.svg";

interface BannerProps {
  onNotificationHover: (hovering: boolean) => void;
  clientName: string; // Prop para o nome do cliente
}

const Banner: React.FC<BannerProps> = ({ onNotificationHover, clientName }) => {
  return (
    <div className="banner-container">
      <a href="/" className="banner-left">
        <img className="banner-image" src={logo} alt="Renda360" />
      </a>

      <div className="banner-buttons">
        <div>
          <span style={{ color: "#fff" }}>Olá,</span>{" "}
          <span className="client-name ">{clientName}</span> 👋
        </div>
        <div className="account-info">
          {/* Exibe o nome do cliente */}
          <img className="settings-button" src={accountIcon} alt="Renda360" />
        </div>
        <div
          onMouseEnter={() => onNotificationHover(true)}
          onMouseLeave={() => onNotificationHover(false)}
        >
          <IconButton
            className="notification-button"
            src={notificationIcon}
            alt="notification"
            onClick={() => {}}
          />
        </div>
        <IconButton
          className="settings-button"
          src={settingsIcon}
          alt="Configurações"
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Banner;
