import React from "react";
import "./BalancesRow.css";

interface CardsSummary {
  total_cards: number;
  total_available_limit: number;
  total_used_limit: number;
}

interface Props {
  data?: CardsSummary;
  loading?: boolean;
}

export const BalancesRowWithAPI: React.FC<Props> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="balances-row">
        <div className="balance-card loading">
          <div className="skeleton-text"></div>
          <div className="skeleton-text small"></div>
        </div>
        <div className="balance-card loading">
          <div className="skeleton-text"></div>
          <div className="skeleton-text small"></div>
        </div>
        <div className="balance-card loading">
          <div className="skeleton-text"></div>
          <div className="skeleton-text small"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="balances-row">
        <div className="balance-card">
          <span className="label">Total de Cartões</span>
          <span className="value">--</span>
        </div>
        <div className="balance-card">
          <span className="label">Limite Disponível</span>
          <span className="value">R$ --</span>
        </div>
        <div className="balance-card">
          <span className="label">Limite Utilizado</span>
          <span className="value">R$ --</span>
        </div>
      </div>
    );
  }

  const utilizationPercentage =
    data.total_available_limit > 0
      ? (
          (data.total_used_limit /
            (data.total_available_limit + data.total_used_limit)) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="balances-row">
      <div className="balance-card">
        <span className="label">Total de Cartões</span>
        <span className="value">{data.total_cards}</span>
        <span className="subtitle">cartões ativos</span>
      </div>

      <div className="balance-card">
        <span className="label">Limite Disponível</span>
        <span className="value positive">
          {data.total_available_limit.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <span className="subtitle">disponível para uso</span>
      </div>

      <div className="balance-card">
        <span className="label">Limite Utilizado</span>
        <span className="value negative">
          {data.total_used_limit.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <span className="subtitle">
          {utilizationPercentage}% do limite total
        </span>
      </div>
    </div>
  );
};
