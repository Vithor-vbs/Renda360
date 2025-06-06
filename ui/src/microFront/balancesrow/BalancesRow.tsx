import React from "react";
import "./BalancesRow.css";

export const BalancesRow: React.FC = () => (
  <div className="balances-row">
    <div className="balance-card">
      <span className="card-label">Saldo total</span>
      <span className="card-value">R$80,300</span>
    </div>
    <div className="balance-card">
      <span className="card-label">Fatura atual Cartão NuBank</span>
      <span className="card-value">R$3,300</span>
    </div>
    <div className="balance-card">
      <span className="card-label">Fatura atual Cartão PicPay</span>
      <span className="card-value">R$5,000</span>
    </div>
  </div>
);
