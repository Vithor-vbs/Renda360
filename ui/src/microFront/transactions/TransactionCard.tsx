import React from 'react';
import './transactionCard.css';
import clsx from 'clsx';
import { LuCreditCard } from 'react-icons/lu'; // exemplo de ícone

interface Props {
  title: string;
  value: string;
  subtitle: string;
  change: string;
  positive: boolean;
  selected?: boolean;
  onClick: () => void;
}

export const TransactionCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  change,
  positive,
  selected,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        'card-modern',
        selected && 'card-selected'
      )}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-icon"><LuCreditCard size={20} /></div>
        <div className={clsx('badge', positive ? 'badge-positive' : 'badge-negative')}>
          {positive ? '+' : '-'}{change}
        </div>
      </div>
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      <div className="card-subtitle">{subtitle}</div>
    </div>
  );
};
