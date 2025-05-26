import React from "react";
import "./notificationPage.css";
import Notification from "./Notification";

const NotificationPage: React.FC = () => (
  <div className="notification-page-container">
    <div className="notification-page-main">
      <Notification />
    </div>
  </div>
);

export default NotificationPage;
