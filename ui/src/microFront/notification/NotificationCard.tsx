// NotificationCard.tsx
import React from "react";
import "./NotificationCards.css";
import { FiAlertCircle } from "react-icons/fi";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

interface Notification {
  id: number;
  type: "income" | "expense" | "alert" | "request";
  category?: string;
  message: string;
  timestamp: string;
  importance: "low" | "medium" | "high";
  read: boolean;
}

interface Props {
  notification: Notification;
  compact: boolean;
  onClick: (id: number) => void;
}

export const NotificationCard: React.FC<Props> = ({
  notification,
  compact,
  onClick,
}) => {
  const { type, category, message, timestamp, importance, read } = notification;

  const renderIcon = () => {
    if (type === "alert" && importance === "high") {
      return <FiAlertCircle className="notification-icon critical" />;
    }
    if (type === "income") {
      return <FaArrowDown className="notification-icon income" />;
    }
    if (type === "expense") {
      return <FaArrowUp className="notification-icon expense" />;
    }
    return null;
  };

  const getCardClass = () => {
    return `notification-card ${type} ${importance}`;
  };

  const formatDate = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={getCardClass()} onClick={() => onClick(notification.id)}>
      <div className="notification-icon-wrapper">{renderIcon()}</div>
      <div className="notification-content">
        <div className="notification-header-row">
          <p className="notification-message">
            {compact ? message.split(".")[0] : message}
          </p>
          {!read && <span className="new-tag">Novo</span>}
        </div>
        {!compact && category && (
          <p className="notification-category">{category}</p>
        )}
        <p className="notification-timestamp">{formatDate(timestamp)}</p>
      </div>
    </div>
  );
};
