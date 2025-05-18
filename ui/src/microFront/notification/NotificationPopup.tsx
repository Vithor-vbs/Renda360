// components/notifications/NotificationPopup.tsx
import React from 'react';
import './notificationPopup.css';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

const NotificationPopup: React.FC<Props> = ({ notifications, onClose }) => {
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read);

  const handleClick = () => {
    onClose();
    navigate('/Notification');
  };

  if (unread.length === 0) return null;

  return (
    <div className="notification-popup" onClick={handleClick}>
      <p className="popup-header">Novas notificações</p>
      <div className="popup-list">
        {unread.map((n) => (
          <div key={n.id} className="popup-item">
            <div className="popup-avatar" />
            <div className="popup-message">
              <p className="popup-text">{n.message}</p>
              <span className="popup-time">{n.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="popup-footer">Ver todas</p>
    </div>
  );
};

export default NotificationPopup;
