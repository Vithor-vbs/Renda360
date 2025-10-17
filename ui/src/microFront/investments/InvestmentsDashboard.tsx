import React, { useState, useEffect, useCallback, useMemo, useRef  } from "react";
import InvestmentsChart from "../investmentsChart/InvestmentsChart.tsx"

import "./InvestmentsDashboard.css";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Bitcoin,
  LineChart,
  Briefcase,
  RefreshCcw,
  Banknote,
} from "lucide-react";

type CryptoRow = {
  name: string;
  symbol: string;
  price: number;
  change: number;
  invested: number;
  quantity: number;
  avgPrice: number;
};

type StockRow = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  invested: number;
  quantity: number;
  avgPrice: number;
};

type FixedIncomeRow = {
  name: string;
  type: string;
  rate: number;
  maturity: string;
  invested: number;
  accrued: number;
};

type CurrencyRow = {
  name: string;
  symbol: string;
  amount: number;
  rate: number;
  change: number;
  invested: number;
};

const InvestmentHeader: React.FC<{
  onDateRangeChange: (s: Date, e: Date) => void;
  onReload: () => void;
  reloading: boolean;
}> = ({onReload, reloading }) => {
  return (
    <div className="inv-panel inv-header">
      <div className="inv-header-top">
        <h1>Dashboard de Investimentos</h1>
        <div className="inv-actions">
          <button
            className="inv-reload-btn"
            onClick={onReload}
            disabled={reloading}
            title="Atualizar dados"
          >
            <RefreshCcw size={16} className={reloading ? "spin" : ""} />
            <span>{reloading ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ValueCards: React.FC<{
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  percentageChange: number;
}> = ({ totalInvested, currentValue, profitLoss, percentageChange }) => {
  const isPositive = percentageChange >= 0;
  return (
    <div className="inv-cards">
      <div className="inv-card">
        <div className="inv-card-head">
          <div>
            <p className="inv-card-subtitle">Valor Investido</p>
            <p className="inv-card-value">
              R${" "}
              {totalInvested.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <span className="inv-card-icon">
            <DollarSign size={28} />
          </span>
        </div>
      </div>
      <div className="inv-card">
        <div className="inv-card-head">
          <div>
            <p className="inv-card-subtitle">Valor Atual</p>
            <p className="inv-card-value">
              R${" "}
              {currentValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            <div className={`inv-delta ${isPositive ? "up" : "down"}`}>
              {isPositive ? (
                <TrendingUp size={18} />
              ) : (
                <TrendingDown size={18} />
              )}
              <span>
                {isPositive ? "+" : ""}
                {percentageChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <span className="inv-card-icon">
            <Target size={28} />
          </span>
        </div>
      </div>
      <div className="inv-card">
        <div className="inv-card-head">
          <div>
            <p className="inv-card-subtitle">Lucro/Prejuízo</p>
            <p className={`inv-card-value ${isPositive ? "up" : "down"}`}>
              {isPositive ? "+" : ""}R${" "}
              {Math.abs(profitLoss).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <span className="inv-card-icon">
            {isPositive ? (
              <TrendingUp size={28} />
            ) : (
              <TrendingDown size={28} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const CryptoList: React.FC<{ data: CryptoRow[] }> = ({ data }) => (
  <div className="inv-panel inv-panel-fixed">
    <div className="inv-panel-title">
      <Bitcoin size={20} />
      <h3>Criptomoedas</h3>
    </div>
    <div className="inv-list">
      {data.map((c, i) => {
        const currentValue = c.price * c.quantity;
        const profitLoss = currentValue - c.invested;
        const pnlPct = (profitLoss / c.invested) * 100;
        const isProfit = pnlPct >= 0;
        return (
          <div className="inv-list-row inv-list-row-large" key={i}>
            <div className="inv-row-left">
              <div className="inv-asset-header">
                <span className="inv-asset-name">{c.name}</span>
                <span className="inv-asset-symbol">{c.symbol}</span>
              </div>
              <div className="inv-metrics-grid">
                <div className="inv-metric">
                  <span className="inv-metric-label">Quantidade</span>
                  <span className="inv-metric-value">{c.quantity.toFixed(6)}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Preço atual</span>
                  <span className="inv-metric-value">${c.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Variação 24h</span>
                  <span className={`inv-metric-value ${c.change >= 0 ? "up" : "down"}`}>
                    {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="inv-row-right">
              <div className="inv-pnl-container">
                <span className="inv-pnl-label">Valor Atual</span>
                <span className="inv-pnl-current">${currentValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <div className={`inv-pnl-badge ${isProfit ? "profit" : "loss"}`}>
                  {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{isProfit ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                </div>
                <span className={`inv-pnl-amount ${isProfit ? "up" : "down"}`}>
                  {isProfit ? "+" : ""}${profitLoss.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const FixedIncomeList: React.FC<{ data: FixedIncomeRow[] }> = ({ data }) => (
  <div className="inv-panel inv-panel-fixed">
    <div className="inv-panel-title">
      <Briefcase size={20} />
      <h3>Renda Fixa</h3>
    </div>
    <div className="inv-list">
      {data.map((b, i) => {
        const totalValue = b.invested + b.accrued;
        const returnPct = (b.accrued / b.invested) * 100;
        return (
          <div className="inv-list-row inv-list-row-large" key={i}>
            <div className="inv-row-left">
              <div className="inv-asset-header">
                <span className="inv-asset-name">{b.name}</span>
                <span className="inv-asset-symbol">{b.type}</span>
              </div>
              <div className="inv-metrics-grid">
                <div className="inv-metric">
                  <span className="inv-metric-label">Taxa</span>
                  <span className="inv-metric-value">{b.rate.toFixed(2)}% a.a.</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Vencimento</span>
                  <span className="inv-metric-value">{b.maturity}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Investido</span>
                  <span className="inv-metric-value">R$ {b.invested.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            <div className="inv-row-right">
              <div className="inv-pnl-container">
                <span className="inv-pnl-label">Valor Total</span>
                <span className="inv-pnl-current">R$ {totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <div className="inv-pnl-badge profit">
                  <TrendingUp size={16} />
                  <span>+{returnPct.toFixed(2)}%</span>
                </div>
                <span className="inv-pnl-amount up">
                  +R$ {b.accrued.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const StocksList: React.FC<{ data: StockRow[] }> = ({ data }) => (
  <div className="inv-panel inv-panel-fixed">
    <div className="inv-panel-title">
      <LineChart size={20} />
      <h3>Ações</h3>
    </div>
    <div className="inv-list">
      {data.map((s, i) => {
        const currentValue = s.price * s.quantity;
        const profitLoss = currentValue - s.invested;
        const pnlPct = (profitLoss / s.invested) * 100;
        const isProfit = pnlPct >= 0;
        return (
          <div className="inv-list-row inv-list-row-large" key={i}>
            <div className="inv-row-left">
              <div className="inv-asset-header">
                <span className="inv-asset-name">{s.symbol}</span>
                <span className="inv-asset-symbol">{s.name}</span>
              </div>
              <div className="inv-metrics-grid">
                <div className="inv-metric">
                  <span className="inv-metric-label">Quantidade</span>
                  <span className="inv-metric-value">{s.quantity} ações</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Preço atual</span>
                  <span className="inv-metric-value">R$ {s.price.toFixed(2)}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Variação dia</span>
                  <span className={`inv-metric-value ${s.change >= 0 ? "up" : "down"}`}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="inv-row-right">
              <div className="inv-pnl-container">
                <span className="inv-pnl-label">Valor Atual</span>
                <span className="inv-pnl-current">R$ {currentValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <div className={`inv-pnl-badge ${isProfit ? "profit" : "loss"}`}>
                  {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{isProfit ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                </div>
                <span className={`inv-pnl-amount ${isProfit ? "up" : "down"}`}>
                  {isProfit ? "+R$ " : "-R$ "}{Math.abs(profitLoss).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const CurrencyList: React.FC<{ data: CurrencyRow[] }> = ({ data }) => (
  <div className="inv-panel inv-panel-fixed">
    <div className="inv-panel-title">
      <Banknote size={20} />
      <h3>Moedas Estrangeiras</h3>
    </div>
    <div className="inv-list">
      {data.map((c, i) => {
        const currentValue = c.amount * c.rate;
        const profitLoss = currentValue - c.invested;
        const pnlPct = (profitLoss / c.invested) * 100;
        const isProfit = pnlPct >= 0;
        return (
          <div className="inv-list-row inv-list-row-large" key={i}>
            <div className="inv-row-left">
              <div className="inv-asset-header">
                <span className="inv-asset-name">{c.name}</span>
                <span className="inv-asset-symbol">{c.symbol}</span>
              </div>
              <div className="inv-metrics-grid">
                <div className="inv-metric">
                  <span className="inv-metric-label">Quantidade</span>
                  <span className="inv-metric-value">{c.amount.toFixed(2)}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Cotação</span>
                  <span className="inv-metric-value">R$ {c.rate.toFixed(2)}</span>
                </div>
                <div className="inv-metric">
                  <span className="inv-metric-label">Variação dia</span>
                  <span className={`inv-metric-value ${c.change >= 0 ? "up" : "down"}`}>
                    {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="inv-row-right">
              <div className="inv-pnl-container">
                <span className="inv-pnl-label">Valor Atual</span>
                <span className="inv-pnl-current">R$ {currentValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <div className={`inv-pnl-badge ${isProfit ? "profit" : "loss"}`}>
                  {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{isProfit ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                </div>
                <span className={`inv-pnl-amount ${isProfit ? "up" : "down"}`}>
                  {isProfit ? "+R$ " : "-R$ "}{Math.abs(profitLoss).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const InvestmentsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoRow[]>([]);
  const [stocksData, setStocksData] = useState<StockRow[]>([]);
  const [fixedIncomeData, setFixedIncomeData] = useState<FixedIncomeRow[]>([]);
  const [currencyData, setCurrencyData] = useState<CurrencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const totalInvested = useMemo(() => {
    const c = cryptoData.reduce((sum, x) => sum + x.invested, 0);
    const s = stocksData.reduce((sum, x) => sum + x.invested, 0);
    const f = fixedIncomeData.reduce((sum, x) => sum + x.invested, 0);
    const cur = currencyData.reduce((sum, x) => sum + x.invested, 0);
    return c + s + f + cur;
  }, [cryptoData, stocksData, fixedIncomeData, currencyData]);

  const currentValue = useMemo(() => {
    const c = cryptoData.reduce((sum, x) => sum + x.price * x.quantity, 0);
    const s = stocksData.reduce((sum, x) => sum + x.price * x.quantity, 0);
    const f = fixedIncomeData.reduce((sum, x) => sum + x.invested + x.accrued, 0);
    const cur = currencyData.reduce((sum, x) => sum + x.amount * x.rate, 0);
    return c + s + f + cur;
  }, [cryptoData, stocksData, fixedIncomeData, currencyData]);

  const profitLoss = currentValue - totalInvested;
  const percentageChange = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const fetchSpotPrices = async (signal?: AbortSignal) => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd&include_24hr_change=true&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error("CoinGecko error");
    return res.json();
  };

  const fetchHistoricalInRange = async (id: string, start: Date, end: Date, signal?: AbortSignal) => {
    const from = Math.floor(start.getTime() / 1000);
    const to = Math.floor(end.getTime() / 1000);
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart/range?vs_currency=usd&from=${from}&to=${to}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error("CoinGecko range error");
    const data = await res.json();
    const last = Array.isArray(data?.prices) && data.prices.length ? data.prices[data.prices.length - 1][1] : null;
    const first = Array.isArray(data?.prices) && data.prices.length ? data.prices[0][1] : null;
    const change = first && last ? ((last - first) / first) * 100 : 0;
    return { last: last ?? 0, change };
  };

const loadData = useCallback(
  async (isReload = false) => {
    const controller = new AbortController();
    try {
      isReload ? setReloading(true) : setLoading(true);
      setError(null);

      if (dateRange) {
        const [btc, eth, ada] = await Promise.all([
          fetchHistoricalInRange(
            "bitcoin",
            dateRange.start,
            dateRange.end,
            controller.signal
          ),
          fetchHistoricalInRange(
            "ethereum",
            dateRange.start,
            dateRange.end,
            controller.signal
          ),
          fetchHistoricalInRange(
            "cardano",
            dateRange.start,
            dateRange.end,
            controller.signal
          ),
        ]);
        setCryptoData([
          {
            name: "Bitcoin",
            symbol: "BTC",
            price: btc.last || 45000,
            change: btc.change,
            invested: 2500,
            quantity: 0.055556,
            avgPrice: 45000,
          },
          {
            name: "Ethereum",
            symbol: "ETH",
            price: eth.last || 3200,
            change: eth.change,
            invested: 1800,
            quantity: 0.5625,
            avgPrice: 3200,
          },
          {
            name: "Cardano",
            symbol: "ADA",
            price: ada.last || 0.45,
            change: ada.change,
            invested: 700,
            quantity: 1555.56,
            avgPrice: 0.45,
          },
        ]);
      } else {
        const spot = await fetchSpotPrices(controller.signal);
        setCryptoData([
          {
            name: "Bitcoin",
            symbol: "BTC",
            price: spot.bitcoin?.usd ?? 45000,
            change: spot.bitcoin?.usd_24h_change ?? 2.5,
            invested: 2500,
            quantity: 0.055556,
            avgPrice: 45000,
          },
          {
            name: "Ethereum",
            symbol: "ETH",
            price: spot.ethereum?.usd ?? 3200,
            change: spot.ethereum?.usd_24h_change ?? -1.2,
            invested: 1800,
            quantity: 0.5625,
            avgPrice: 3200,
          },
          {
            name: "Cardano",
            symbol: "ADA",
            price: spot.cardano?.usd ?? 0.45,
            change: spot.cardano?.usd_24h_change ?? 3.8,
            invested: 700,
            quantity: 1555.56,
            avgPrice: 0.45,
          },
        ]);
      }

      setFixedIncomeData([
        {
          name: "Tesouro Selic",
          type: "Pós-fixado",
          rate: 13.75,
          maturity: "2026",
          invested: 15000,
          accrued: 320.45,
        },
        {
          name: "Tesouro IPCA+",
          type: "Híbrido",
          rate: 6.52,
          maturity: "2029",
          invested: 12000,
          accrued: 210.3,
        },
        {
          name: "CDB Banco XYZ",
          type: "Pós-fixado",
          rate: 14.2,
          maturity: "2025",
          invested: 8000,
          accrued: 95.1,
        },
      ]);

      setStocksData([
        {
          symbol: "PETR4",
          name: "Petrobras",
          price: 38.45,
          change: 1.8,
          invested: 5200,
          quantity: 135,
          avgPrice: 38.52,
        },
        {
          symbol: "VALE3",
          name: "Vale",
          price: 65.2,
          change: -0.5,
          invested: 4300,
          quantity: 66,
          avgPrice: 65.15,
        },
        {
          symbol: "ITUB4",
          name: "Itaú Unibanco",
          price: 28.9,
          change: 2.1,
          invested: 3900,
          quantity: 135,
          avgPrice: 28.89,
        },
      ]);

      setCurrencyData([
        {
          name: "Dólar Americano",
          symbol: "USD",
          amount: 2500,
          rate: 5.85,
          change: 0.8,
          invested: 14500,
        },
        {
          name: "Euro",
          symbol: "EUR",
          amount: 1800,
          rate: 6.35,
          change: -0.3,
          invested: 11200,
        },
        {
          name: "Libra Esterlina",
          symbol: "GBP",
          amount: 950,
          rate: 7.42,
          change: 1.1,
          invested: 6900,
        },
      ]);
    } catch (e: any) {
      setError("Erro ao carregar dados");
      setCryptoData([
        {
          name: "Bitcoin",
          symbol: "BTC",
          price: 45000,
          change: 2.5,
          invested: 2500,
          quantity: 0.055556,
          avgPrice: 45000,
        },
        {
          name: "Ethereum",
          symbol: "ETH",
          price: 3200,
          change: -1.2,
          invested: 1800,
          quantity: 0.5625,
          avgPrice: 3200,
        },
        {
          name: "Cardano",
          symbol: "ADA",
          price: 0.45,
          change: 3.8,
          invested: 700,
          quantity: 1555.56,
          avgPrice: 0.45,
        },
      ]);
      setFixedIncomeData([
        {
          name: "Tesouro Selic",
          type: "Pós-fixado",
          rate: 13.75,
          maturity: "2026",
          invested: 15000,
          accrued: 320.45,
        },
        {
          name: "Tesouro IPCA+",
          type: "Híbrido",
          rate: 6.52,
          maturity: "2029",
          invested: 12000,
          accrued: 210.3,
        },
        {
          name: "CDB Banco XYZ",
          type: "Pós-fixado",
          rate: 14.2,
          maturity: "2025",
          invested: 8000,
          accrued: 95.1,
        },
      ]);
      setStocksData([
        {
          symbol: "PETR4",
          name: "Petrobras",
          price: 38.45,
          change: 1.8,
          invested: 5200,
          quantity: 135,
          avgPrice: 38.52,
        },
        {
          symbol: "VALE3",
          name: "Vale",
          price: 65.2,
          change: -0.5,
          invested: 4300,
          quantity: 66,
          avgPrice: 65.15,
        },
        {
          symbol: "ITUB4",
          name: "Itaú Unibanco",
          price: 28.9,
          change: 2.1,
          invested: 3900,
          quantity: 135,
          avgPrice: 28.89,
        },
      ]);
      setCurrencyData([
        {
          name: "Dólar Americano",
          symbol: "USD",
          amount: 2500,
          rate: 5.85,
          change: 0.8,
          invested: 14500,
        },
        {
          name: "Euro",
          symbol: "EUR",
          amount: 1800,
          rate: 6.35,
          change: -0.3,
          invested: 11200,
        },
        {
          name: "Libra Esterlina",
          symbol: "GBP",
          amount: 950,
          rate: 7.42,
          change: 1.1,
          invested: 6900,
        },
      ]);
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  },
  []
);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="inv-board inv-loading">
        <div className="inv-spinner" />
        <p className="inv-muted">Carregando dados...</p>
      </div>
    );
  }

  if (error && !cryptoData.length) {
    return (
      <div className="inv-board">
        <div className="inv-alert">
          <div className="inv-alert-title">Erro ao carregar dashboard</div>
          <div className="inv-alert-text">{error}</div>
        </div>
      </div>
    );
  }

return (
  <div className="inv-board">
    <InvestmentHeader
      onDateRangeChange={(start, end) => setDateRange({ start, end })}
      onReload={() => loadData(true)}
      reloading={reloading}
    />
    
    <ValueCards
      totalInvested={totalInvested}
      currentValue={currentValue}
      profitLoss={profitLoss}
      percentageChange={percentageChange}
    />
    
    {/* COLOQUE AQUI - FORA DO DIV inv-charts */}
    <InvestmentsChart 
      cryptoData={cryptoData} 
      stocksData={stocksData} 
    />
    
    {/* Grid das colunas */}
    <div className="inv-charts">
      <div className="inv-chart">
        <CryptoList data={cryptoData} />
      </div>
      <div className="inv-chart">
        <FixedIncomeList data={fixedIncomeData} />
      </div>
      <div className="inv-chart">
        <StocksList data={stocksData} />
      </div>
      <div className="inv-chart">
        <CurrencyList data={currencyData} />
      </div>
    </div>
  </div>
);
};

export default InvestmentsDashboard;