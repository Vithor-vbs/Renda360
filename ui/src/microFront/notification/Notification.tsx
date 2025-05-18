import React, { useState } from 'react';
import './notifications.css';
import { NotificationCard } from './notificationCards';
import ButtonDate from '../buttonDate/buttonDate';
import NotificationFilter from './NotificationFilter';

interface Notification {
  id: number;
  type: 'income' | 'expense' | 'alert' | 'request';
  category?: string;
  message: string;
  timestamp: string;
  importance: 'low' | 'medium' | 'high';
  read: boolean;
}


const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'income',
    category: 'Pix',
    message: 'Você recebeu um Pix de R$ 860,00',
    timestamp: '2025-05-15T09:20:00',
    importance: 'medium',
    read: false
  },
  {
    id: 2,
    type: 'expense',
    category: 'Cartão de Crédito',
    message: 'Compra no cartão de crédito de R$ 200,00',
    timestamp: '2025-05-14T21:00:00',
    importance: 'low',
    read: true
  },
  {
    id: 3,
    type: 'alert',
    message: 'Seu consumo mensal ultrapassou o limite.',
    timestamp: '2025-05-14T20:00:00',
    importance: 'high',
    read: false
  }
];


const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<string>('all');
  const [compact, setCompact] = useState<boolean>(true);

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  return (
    <div className="notifications-wrapper">
      <div className="notifications-header">
        <h2>Notificações</h2>
        <div className="notifications-header-actions">
          <ButtonDate onRangeChange={() => {}} />
          <button className="clear-button" onClick={() => setNotifications([])}>Limpar Tudo</button>
          <button className="toggle-mode" onClick={() => setCompact(!compact)} title={compact ? 'Modo detalhado' : 'Modo compacto'}> {compact ? 'Detalhado' : '➖ Compacto'} </button>

        </div>
      </div>

      <NotificationFilter selected={filter} onChange={setFilter} />

      <div className="notifications-list">
        {filtered.map((n) => (
        <NotificationCard key={n.id} notification={n} compact={compact}  onClick={(id) => { setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }} />
        ))}
      </div>
    </div>
  );
};

export default Notifications;
