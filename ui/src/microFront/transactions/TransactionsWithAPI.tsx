import React, { useState, useMemo } from "react";
import "./transactions.css";
import { TransactionCard } from "./TransactionCard";
import { TransactionGridWithAPI } from "./TransactionGridWithAPI";
import { useTransactions } from "../../hooks/useTransactions";

const Transactions: React.FC = () => {
  const [selected, setSelected] = useState<string>("Cartão de Crédito");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(
    null
  );

  // Fetch credit card transactions from API (real data from PDF statements)
  const {
    transactions: creditCardTransactions,
    loading,
    error,
    refresh,
  } = useTransactions({
    startDate: dateRange?.start.toISOString().split("T")[0],
    endDate: dateRange?.end.toISOString().split("T")[0],
  });

  // Mock data for other payment types (since we only have credit card statements) - 💩
  const mockOtherTransactions = useMemo(
    () => ({
      "Cartão de Débito": {
        total: 12890,
        count: 45,
        subtitle: "Compras realizadas",
      },
      Pix: { total: 9650, count: 23, subtitle: "Transferências instantâneas" },
    }),
    []
  );

  // Calculate credit card summary from real data
  const creditCardSummary = useMemo(() => {
    if (!creditCardTransactions.length) {
      return { total: 0, count: 0, subtitle: "Total gasto no mês" };
    }

    const total = creditCardTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    return {
      total,
      count: creditCardTransactions.length,
      subtitle: "Total gasto no mês",
    };
  }, [creditCardTransactions]);

  // Combine real credit card data with mock data for other types
  const allCardsSummary = useMemo(() => {
    const cards = [
      {
        type: "Cartão de Crédito",
        value: `R$ ${creditCardSummary.total.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: creditCardSummary.subtitle,
        change: "3.4%",
        positive: true,
        count: creditCardSummary.count,
        hasRealData: true, // This indicates real data vs mock
      },
    ];

    // Add mock data for other payment types
    Object.entries(mockOtherTransactions).forEach(([type, data]) => {
      cards.push({
        type,
        value: `R$ ${data.total.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
        subtitle: data.subtitle,
        change: Math.random() > 0.5 ? "1.9%" : "2.1%",
        positive: Math.random() > 0.2,
        count: data.count,
        hasRealData: false, // Mock data
      });
    });

    return cards;
  }, [creditCardSummary, mockOtherTransactions]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  // Calculate total across all transaction types (real + mock)
  const totalAllTransactions = useMemo(() => {
    const creditTotal = creditCardSummary.total;
    const mockTotal = Object.values(mockOtherTransactions).reduce(
      (sum, data) => sum + data.total,
      0
    );
    return creditTotal + mockTotal;
  }, [creditCardSummary.total, mockOtherTransactions]);

  const totalTransactionCount = useMemo(() => {
    const creditCount = creditCardSummary.count;
    const mockCount = Object.values(mockOtherTransactions).reduce(
      (sum, data) => sum + data.count,
      0
    );
    return creditCount + mockCount;
  }, [creditCardSummary.count, mockOtherTransactions]);

  if (error) {
    return (
      <div className="transactions-content">
        <div className="error-message">
          <p>Erro ao carregar transações de cartão de crédito: {error}</p>
          <button onClick={refresh} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-content">
      <div className="transactions-header">
        <h2>Transações</h2>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Carregando transações de cartão de crédito...</p>
        </div>
      ) : (
        <>
          <div className="transactions-card-grid">
            {/* All transactions card - combines real credit card data + mock data */}
            <TransactionCard
              key="All"
              title="Todas"
              value={`R$ ${totalAllTransactions.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
              subtitle={`${totalTransactionCount} transações`}
              change="2.8%"
              positive={true}
              selected={selected === "All"}
              onClick={() => setSelected("All")}
            />

            {/* Cards with real credit card data + mock data for others */}
            {allCardsSummary.map((card) => (
              <TransactionCard
                key={card.type}
                title={card.type}
                value={card.value}
                subtitle={`${card.subtitle}${
                  !card.hasRealData ? " (simulado)" : ""
                }`}
                change={card.change}
                positive={card.positive}
                selected={selected === card.type}
                onClick={() => setSelected(card.type)}
              />
            ))}
          </div>

          <TransactionGridWithAPI
            filter={selected}
            transactions={creditCardTransactions}
            loading={loading}
            error={error || undefined}
          />
        </>
      )}
    </div>
  );
};

export default Transactions;
