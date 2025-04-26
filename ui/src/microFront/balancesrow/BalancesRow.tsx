import React from 'react'
import './BalancesRow.css'

export const BalancesRow: React.FC = () => (
  <div className="balances-row">
    <div className="balance-card">
      <span className="card-label">Total balance</span>
      <span className="card-value">$80,300</span>
    </div>
    <div className="balance-card">
      <span className="card-label">Main balance</span>
      <span className="card-value">$73,300</span>
    </div>
    <div className="balance-card">
      <span className="card-label">Credit balance</span>
      <span className="card-value">$5,000</span>
    </div>
  </div>
)
