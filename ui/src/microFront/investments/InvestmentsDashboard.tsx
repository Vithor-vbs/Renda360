import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./InvestmentsDashboard.css";
import { TrendingUp, TrendingDown, DollarSign, Target, Bitcoin, LineChart, Briefcase, RefreshCcw } from "lucide-react";
import ButtonDate from "../buttonDate/buttonDate";


type CryptoRow = { name: string; symbol: string; price: number; change: number; invested: number };
type StockRow = { symbol: string; name: string; price: number; change: number; invested: number };
type FixedIncomeRow = { name: string; type: string; rate: number; maturity: string; invested: number; accrued: number };

const InvestmentHeader: React.FC<{
  onDateRangeChange: (s: Date, e: Date) => void;
  onReload: () => void;
  reloading: boolean;
}> = ({ onDateRangeChange, onReload, reloading }) => {
  return (
    <div className="inv-panel inv-header">
      <div className="inv-header-top">
        <h1>Dashboard de Investimentos</h1>
        <div className="inv-actions">
          <ButtonDate onRangeChange={onDateRangeChange} />
          <button className="inv-reload-btn" onClick={onReload} disabled={reloading} title="Atualizar dados">
            <RefreshCcw size={16} className={reloading ? "spin" : ""} />
            <span>{reloading ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ValueCards: React.FC<{ totalInvested: number; expectedValue: number; percentageChange: number }> = ({
  totalInvested,
  expectedValue,
  percentageChange,
}) => {
  const isPositive = percentageChange >= 0;
  return (
    <div className="inv-cards">
      <div className="inv-card">
        <div className="inv-card-head">
          <div>
            <p className="inv-card-subtitle">Valor Investido Total</p>
            <p className="inv-card-value">R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <span className="inv-card-icon"><DollarSign size={28} /></span>
        </div>
      </div>
      <div className="inv-card">
        <div className="inv-card-head">
          <div>
            <p className="inv-card-subtitle">Valor Esperado</p>
            <p className="inv-card-value">R$ {expectedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <div className={`inv-delta ${isPositive ? "up" : "down"}`}>
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <span>{isPositive ? "+" : ""}{percentageChange.toFixed(2)}%</span>
            </div>
          </div>
          <span className="inv-card-icon"><Target size={28} /></span>
        </div>
      </div>
    </div>
  );
};

const CryptoList: React.FC<{ data: CryptoRow[] }> = ({ data }) => (
  <div className="inv-panel">
    <div className="inv-panel-title"><Bitcoin size={20} /><h3>Criptomoedas</h3></div>
    <div className="inv-list">
      {data.map((c, i) => {
        const pnlPct = ((c.price * (c.invested / Math.max(c.price, 1))) - c.invested) / Math.max(c.invested, 1) * 100;
        return (
          <div className="inv-list-row" key={i}>
            <div>
              <p className="inv-list-title">{c.name}</p>
              <p className="inv-list-subtitle">{c.symbol}</p>
              <p className="inv-list-subtle">Investido: ${c.invested.toFixed(2)}</p>
            </div>
            <div className="inv-list-right">
              <p className="inv-list-price">${c.price.toFixed(2)}</p>
              <p className={`inv-list-change ${c.change >= 0 ? "up" : "down"}`}>{c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}% 24h</p>
              <p className={`inv-list-change ${pnlPct >= 0 ? "up" : "down"}`}>P/L: {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const FixedIncomeList: React.FC<{ data: FixedIncomeRow[] }> = ({ data }) => (
  <div className="inv-panel">
    <div className="inv-panel-title"><Briefcase size={20} /><h3>Renda Fixa</h3></div>
    <div className="inv-list">
      {data.map((b, i) => (
        <div className="inv-list-row" key={i}>
          <div>
            <p className="inv-list-title">{b.name}</p>
            <p className="inv-list-subtitle">{b.type} • Venc: {b.maturity}</p>
            <p className="inv-list-subtle">Investido: R$ {b.invested.toFixed(2)}</p>
          </div>
          <div className="inv-list-right">
            <p className="inv-list-price">{b.rate.toFixed(2)}% a.a.</p>
            <p className="inv-list-subtle">Rendido: R$ {b.accrued.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StocksList: React.FC<{ data: StockRow[] }> = ({ data }) => (
  <div className="inv-panel">
    <div className="inv-panel-title"><LineChart size={20} /><h3>Ações</h3></div>
    <div className="inv-list">
      {data.map((s, i) => {
        const units = Math.max(s.invested / Math.max(s.price, 1), 1); // aproximação
        const pnlPct = ((s.price * units) - s.invested) / Math.max(s.invested, 1) * 100;
        return (
          <div className="inv-list-row" key={i}>
            <div>
              <p className="inv-list-title">{s.symbol}</p>
              <p className="inv-list-subtitle">{s.name}</p>
              <p className="inv-list-subtle">Investido: R$ {s.invested.toFixed(2)}</p>
            </div>
            <div className="inv-list-right">
              <p className="inv-list-price">R$ {s.price.toFixed(2)}</p>
              <p className={`inv-list-change ${s.change >= 0 ? "up" : "down"}`}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}% dia</p>
              <p className={`inv-list-change ${pnlPct >= 0 ? "up" : "down"}`}>P/L: {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</p>
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
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalInvested = useMemo(() => {
    const c = cryptoData.reduce((sum, x) => sum + x.invested, 0);
    const s = stocksData.reduce((sum, x) => sum + x.invested, 0);
    const f = fixedIncomeData.reduce((sum, x) => sum + x.invested, 0);
    return c + s + f;
  }, [cryptoData, stocksData, fixedIncomeData]);

  const expectedValue = useMemo(() => {
    const c = cryptoData.reduce((sum, x) => sum + x.price * Math.max(x.invested / Math.max(x.price, 1), 1), 0);
    const s = stocksData.reduce((sum, x) => sum + x.price * Math.max(x.invested / Math.max(x.price, 1), 1), 0);
    const f = fixedIncomeData.reduce((sum, x) => sum + x.invested + x.accrued, 0);
    return c + s + f;
  }, [cryptoData, stocksData, fixedIncomeData]);

  const percentageChange = totalInvested > 0 ? ((expectedValue - totalInvested) / totalInvested) * 100 : 0;

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

  const loadData = useCallback(async (isReload = false) => {
    const controller = new AbortController();
    try {
      isReload ? setReloading(true) : setLoading(true);
      setError(null);

      if (dateRange) {
        const [btc, eth, ada] = await Promise.all([
          fetchHistoricalInRange("bitcoin", dateRange.start, dateRange.end, controller.signal),
          fetchHistoricalInRange("ethereum", dateRange.start, dateRange.end, controller.signal),
          fetchHistoricalInRange("cardano", dateRange.start, dateRange.end, controller.signal),
        ]);
        setCryptoData([
          { name: "Bitcoin", symbol: "BTC", price: btc.last || 45000, change: btc.change, invested: 2500 },
          { name: "Ethereum", symbol: "ETH", price: eth.last || 3200, change: eth.change, invested: 1800 },
          { name: "Cardano", symbol: "ADA", price: ada.last || 0.45, change: ada.change, invested: 700 },
        ]);
      } else {
        const spot = await fetchSpotPrices(controller.signal);
        setCryptoData([
          { name: "Bitcoin", symbol: "BTC", price: spot.bitcoin?.usd ?? 45000, change: spot.bitcoin?.usd_24h_change ?? 2.5, invested: 2500 },
          { name: "Ethereum", symbol: "ETH", price: spot.ethereum?.usd ?? 3200, change: spot.ethereum?.usd_24h_change ?? -1.2, invested: 1800 },
          { name: "Cardano", symbol: "ADA", price: spot.cardano?.usd ?? 0.45, change: spot.cardano?.usd_24h_change ?? 3.8, invested: 700 },
        ]);
      }

      setFixedIncomeData([
        { name: "Tesouro Selic", type: "Pós-fixado", rate: 13.75, maturity: "2026", invested: 15000, accrued: 320.45 },
        { name: "Tesouro IPCA+", type: "Híbrido", rate: 6.52, maturity: "2029", invested: 12000, accrued: 210.30 },
        { name: "CDB Banco XYZ", type: "Pós-fixado", rate: 14.2, maturity: "2025", invested: 8000, accrued: 95.10 },
      ]);

      setStocksData([
        { symbol: "PETR4", name: "Petrobras", price: 38.45, change: 1.8, invested: 5200 },
        { symbol: "VALE3", name: "Vale", price: 65.2, change: -0.5, invested: 4300 },
        { symbol: "ITUB4", name: "Itaú Unibanco", price: 28.9, change: 2.1, invested: 3900 },
      ]);
    } catch (e: any) {
      setError("Erro ao carregar dados");
      if (!cryptoData.length) {
        setCryptoData([
          { name: "Bitcoin", symbol: "BTC", price: 45000, change: 2.5, invested: 2500 },
          { name: "Ethereum", symbol: "ETH", price: 3200, change: -1.2, invested: 1800 },
          { name: "Cardano", symbol: "ADA", price: 0.45, change: 3.8, invested: 700 },
        ]);
      }
      if (!fixedIncomeData.length) {
        setFixedIncomeData([
          { name: "Tesouro Selic", type: "Pós-fixado", rate: 13.75, maturity: "2026", invested: 15000, accrued: 320.45 },
          { name: "Tesouro IPCA+", type: "Híbrido", rate: 6.52, maturity: "2029", invested: 12000, accrued: 210.30 },
          { name: "CDB Banco XYZ", type: "Pós-fixado", rate: 14.2, maturity: "2025", invested: 8000, accrued: 95.10 },
        ]);
      }
      if (!stocksData.length) {
        setStocksData([
          { symbol: "PETR4", name: "Petrobras", price: 38.45, change: 1.8, invested: 5200 },
          { symbol: "VALE3", name: "Vale", price: 65.2, change: -0.5, invested: 4300 },
          { symbol: "ITUB4", name: "Itaú Unibanco", price: 28.9, change: 2.1, invested: 3900 },
        ]);
      }
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => { loadData(false); }, [loadData]);

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
      <ValueCards totalInvested={totalInvested} expectedValue={expectedValue} percentageChange={percentageChange} />
      <div className="inv-charts">
        <div className="inv-chart"><CryptoList data={cryptoData} /></div>
        <div className="inv-chart"><FixedIncomeList data={fixedIncomeData} /></div>
        <div className="inv-chart"><StocksList data={stocksData} /></div>
      </div>
    </div>
  );
};

export default InvestmentsDashboard;
