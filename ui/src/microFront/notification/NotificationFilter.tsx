import React from 'react';
import './notificationFilter.css';

interface Props {
  selected: string;
  onChange: (type: string) => void;
}

const types = [
  { label: 'Todos', value: 'all' },
  { label: 'Entradas', value: 'income' },
  { label: 'Saídas', value: 'expense' },
  { label: 'Alertas', value: 'alert' },
];

const NotificationFilter: React.FC<Props> = ({ selected, onChange }) => {
  return (
    <div className="notification-filter">
      {types.map((t) => (
        <button
          key={t.value}
          className={`filter-button ${selected === t.value ? 'selected' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default NotificationFilter;
