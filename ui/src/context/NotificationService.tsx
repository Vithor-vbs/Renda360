import React, { createContext, useContext, useState, ReactNode } from "react";
import { MdCheckCircle, MdError } from "react-icons/md";

type NotificationType = "success" | "error";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifications: Notification[];
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: NotificationType) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 4000);
  };

  const notifySuccess = (message: string) => notify(message, "success");
  const notifyError = (message: string) => notify(message, "error");

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifySuccess, notifyError, notifications, removeNotification }}
    >
      {children}
      <div
        className="notification-toast-container"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              marginBottom: 10,
              padding: "12px 20px",
              borderRadius: 6,
              color: "#fff",
              background: n.type === "success" ? "#43a047" : "#e53935",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minWidth: 180,
              fontWeight: 500,
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.3s",
            }}
          >
            <span
              style={{
                fontSize: "1.4em",
                display: "flex",
                alignItems: "center",
              }}
            >
              {n.type === "success" ? (
                <MdCheckCircle color="#fff" />
              ) : (
                <MdError color="#fff" />
              )}
            </span>
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
