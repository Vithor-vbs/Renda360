import React, { useState } from 'react';
import './InvestmentsChart.css';

type ChartData = {
  name: string;
  id: string;
  symbol: string;
  price: string;
  amount: string;
  change: string;
  isPositive: boolean;
};

type InvestmentsChartProps = {
  cryptoData: Array<{
    name: string;
    symbol: string;
    price: number;
    change: number;
    quantity: number;
  }>;
  stocksData: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    quantity: number;
  }>;
};

const InvestmentsChart: React.FC<InvestmentsChartProps> = ({ cryptoData, stocksData }) => {
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');

  // Preparar dados das criptos
  const cryptoChartData: ChartData[] = cryptoData.slice(0, 2).map((crypto) => {
    const valueInBRL = crypto.price * crypto.quantity * 5.85; // Conversão aproximada USD para BRL
    return {
      name: crypto.name,
      id: crypto.name.toLowerCase(),
      symbol: crypto.symbol,
      price: `${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      amount: `${crypto.quantity.toFixed(6)} ${crypto.symbol} • R$ ${valueInBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`,
      isPositive: crypto.change >= 0,
    };
  });

  // Preparar dados das ações
  const stockChartData: ChartData[] = stocksData.slice(0, 2).map((stock) => ({
    name: stock.name,
    id: stock.symbol.toLowerCase(),
    symbol: stock.symbol,
    price: `R$ ${stock.price.toFixed(2)}`,
    amount: `${stock.quantity} ações`,
    change: `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`,
    isPositive: stock.change >= 0,
  }));

  const allAssets = [...cryptoChartData, ...stockChartData];

  return (
    <div className="inv-chart-card">
      <div className="inv-chart-header">
        <span className="inv-chart-logo">Performance</span>
      </div>

      <fieldset className="inv-asset-switch">
        {allAssets.map((asset) => (
          <React.Fragment key={asset.id}>
            <input
              type="radio"
              id={asset.id}
              name="asset"
              checked={selectedAsset === asset.id}
              onChange={() => setSelectedAsset(asset.id)}
            />
            <label htmlFor={asset.id}>{asset.symbol}</label>
          </React.Fragment>
        ))}
<div className="inv-slider" style={{
  transform: `translateX(calc(${allAssets.findIndex(a => a.id === selectedAsset)} * (100% + 0.5rem)))`
}} />
      </fieldset>

      <div className="inv-price-infos">
        {allAssets.map((asset) => (
          <div
            key={asset.id}
            className={`inv-price-info ${selectedAsset === asset.id ? 'active' : ''}`}
          >
            <div className="inv-asset-name">{asset.name}</div>
            <div className="inv-price">{asset.price}</div>
            <div className="inv-stats">
              <span className="inv-amount">{asset.amount}</span>
              <div className="inv-change-container">
                <span className="inv-change-label">24h</span>
                <span className={`inv-change ${asset.isPositive ? 'positive' : 'negative'}`}>
                  {asset.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="inv-chart-graph">
        <svg
          className={selectedAsset === 'bitcoin' ? 'active' : ''}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
        >
          <path d="M0,28 L5,26 L10,24 L15,22 L20,23 L25,20 L30,19 L35,17 L40,18 L45,15 L50,17 L55,13 L60,15 L65,12 L70,14 L75,10 L80,12 L85,9 L90,11 L95,7 L100,9 L100,30 L0,30 Z" />
        </svg>
        <svg
          className={selectedAsset === 'ethereum' ? 'active' : ''}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
        >
          <path d="M0,25 L5,24 L10,22 L15,21 L20,20 L25,19 L30,18 L35,17 L40,16 L45,15 L50,14 L55,15 L60,13 L65,14 L70,11 L75,13 L80,10 L85,12 L90,9 L95,11 L100,8 L100,30 L0,30 Z" />
        </svg>
        <svg
          className={selectedAsset === 'petr4' ? 'active' : ''}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
        >
          <path d="M0,27 L5,26 L10,24 L15,25 L20,23 L25,21 L30,22 L35,20 L40,18 L45,17 L50,15 L55,16 L60,14 L65,12 L70,13 L75,11 L80,9 L85,10 L90,8 L95,6 L100,7 L100,30 L0,30 Z" />
        </svg>
        <svg
          className={selectedAsset === 'vale3' ? 'active' : ''}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
        >
          <path d="M0,26 L5,25 L10,23 L15,22 L20,20 L25,19 L30,17 L35,16 L40,14 L45,13 L50,12 L55,11 L60,10 L65,9 L70,8 L75,7 L80,6 L85,5 L90,4 L95,3 L100,2 L100,30 L0,30 Z" />
        </svg>
      </div>
    </div>
  );
};

export default InvestmentsChart;