import React, { useState, useEffect } from "react";
import "./transactionGrid.css";
import { FaFilter } from "react-icons/fa";
import { useTransactions } from "../../hooks/useTransactions";

interface Props {
  filter: string;
}

type MockTransaction = {
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
};

type EnhancedTransaction = MockTransaction & {
  merchant?: string;
  isInstallment?: boolean;
  installmentInfo?: string;
};

// Mock data for non-credit card transactions - 💩
const MOCK_DATA: Record<string, MockTransaction[]> = {
  "Cartão de Débito": [
    {
      date: "11/05/2024",
      description: "Supermercado Extra",
      amount: "-R$ 150,00",
      category: "Alimentação",
      type: "Débito",
    },
    {
      date: "10/05/2024",
      description: "Farmácia Drogasil",
      amount: "-R$ 65,00",
      category: "Saúde",
      type: "Débito",
    },
    {
      date: "09/05/2024",
      description: "Posto de Gasolina",
      amount: "-R$ 120,00",
      category: "Transporte",
      type: "Débito",
    },
    {
      date: "08/05/2024",
      description: "Padaria Central",
      amount: "-R$ 25,50",
      category: "Alimentação",
      type: "Débito",
    },
  ],
  Pix: [
    {
      date: "12/05/2024",
      description: "Transferência para João Silva",
      amount: "-R$ 500,00",
      category: "Pessoal",
      type: "Pix",
    },
    {
      date: "10/05/2024",
      description: "Recebido de Maria Santos",
      amount: "+R$ 1.000,00",
      category: "Receita",
      type: "Pix",
    },
    {
      date: "09/05/2024",
      description: "Pagamento Freelance",
      amount: "+R$ 300,00",
      category: "Trabalho",
      type: "Pix",
    },
    {
      date: "08/05/2024",
      description: "Split da conta",
      amount: "-R$ 45,00",
      category: "Pessoal",
      type: "Pix",
    },
  ],
  TED: [
    {
      date: "08/05/2024",
      description: "Transferência Aluguel",
      amount: "-R$ 1.500,00",
      category: "Moradia",
      type: "TED",
    },
    {
      date: "01/05/2024",
      description: "Investimento CDB",
      amount: "-R$ 2.000,00",
      category: "Investimentos",
      type: "TED",
    },
  ],
  Boleto: [
    {
      date: "07/05/2024",
      description: "Conta de Luz - Enel",
      amount: "-R$ 220,00",
      category: "Utilidades",
      type: "Boleto",
    },
    {
      date: "06/05/2024",
      description: "Internet - Vivo Fibra",
      amount: "-R$ 89,90",
      category: "Utilidades",
      type: "Boleto",
    },
    {
      date: "05/05/2024",
      description: "Seguro do Carro",
      amount: "-R$ 156,00",
      category: "Seguros",
      type: "Boleto",
    },
  ],
  Dinheiro: [
    {
      date: "06/05/2024",
      description: "Saque ATM 24h",
      amount: "-R$ 300,00",
      category: "Saque",
      type: "Dinheiro",
    },
    {
      date: "03/05/2024",
      description: "Feira Livre",
      amount: "-R$ 85,00",
      category: "Alimentação",
      type: "Dinheiro",
    },
  ],
};

export const TransactionGridEnhanced: React.FC<Props> = ({ filter }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // Fetch real credit card data from API
  const { transactions: creditCardTransactions, loading } = useTransactions();

  useEffect(() => {
    setSelectedCategory(null);
    setShowFilter(false);
  }, [filter]);

  // Get data based on filter type
  const getTransactionData = (): EnhancedTransaction[] => {
    if (filter === "Cartão de Crédito") {
      // Use real API data for credit cards
      return creditCardTransactions.map((transaction) => ({
        date: new Date(transaction.date).toLocaleDateString("pt-BR"),
        description: transaction.description,
        amount: `${transaction.amount < 0 ? "-" : "+"}R$ ${Math.abs(
          transaction.amount
        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        category: transaction.category || "Não categorizado",
        type: "Crédito",
        merchant: transaction.merchant,
        isInstallment: transaction.is_installment,
        installmentInfo: transaction.installment_info,
      }));
    } else if (filter === "All") {
      // Combine real credit card data with mock data for others
      const creditData: EnhancedTransaction[] = creditCardTransactions.map(
        (transaction) => ({
          date: new Date(transaction.date).toLocaleDateString("pt-BR"),
          description: transaction.description,
          amount: `${transaction.amount < 0 ? "-" : "+"}R$ ${Math.abs(
            transaction.amount
          ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          category: transaction.category || "Não categorizado",
          type: "Crédito",
          merchant: transaction.merchant,
          isInstallment: transaction.is_installment,
          installmentInfo: transaction.installment_info,
        })
      );

      const mockData: EnhancedTransaction[] = Object.values(MOCK_DATA).flat();
      return [...creditData, ...mockData];
    } else {
      // Use mock data for other payment types
      return (MOCK_DATA[filter] || []) as EnhancedTransaction[];
    }
  };

  const fullData = getTransactionData();

  // Filter by category if selected
  const filteredData = selectedCategory
    ? fullData.filter(
        (transaction) => transaction.category === selectedCategory
      )
    : fullData;

  // Get unique categories
  const categories = [...new Set(fullData.map((t) => t.category))];

  if (loading && filter === "Cartão de Crédito") {
    return (
      <div className="transaction-grid-container">
        <div className="loading-state">
          <p>Carregando transações do cartão de crédito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-grid-container">
      <div className="filter-header">
        <h3>
          {filter === "All" ? "Todas as Transações" : `Transações - ${filter}`}
          <span className="transaction-count">({filteredData.length})</span>
          {filter === "Cartão de Crédito" && (
            <span className="real-data-badge">Dados Reais</span>
          )}
          {filter !== "Cartão de Crédito" && filter !== "All" && (
            <span className="mock-data-badge">Dados Simulados</span>
          )}
        </h3>

        {categories.length > 1 && (
          <button
            className="filter-button"
            onClick={() => setShowFilter(!showFilter)}
          >
            <FaFilter /> Filtros
          </button>
        )}
      </div>

      {showFilter && categories.length > 1 && (
        <div className="category-filters">
          <button
            className={selectedCategory === null ? "active" : ""}
            onClick={() => setSelectedCategory(null)}
          >
            Todas as Categorias
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? "active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="transaction-grid">
        {filteredData.length === 0 ? (
          <div className="no-transactions">
            <p>
              {filter === "Cartão de Crédito"
                ? "Nenhuma transação de cartão de crédito encontrada. Faça upload de um extrato para ver suas transações reais."
                : `Nenhuma transação encontrada para ${filter}.`}
            </p>
          </div>
        ) : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Categoria</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((transaction, index) => (
                <tr key={`${transaction.type}-${index}`}>
                  <td>{transaction.date}</td>
                  <td>
                    <div className="transaction-description">
                      <span className="description">
                        {transaction.description}
                      </span>
                      {transaction.merchant && (
                        <span className="merchant">
                          via {transaction.merchant}
                        </span>
                      )}
                      {transaction.isInstallment &&
                        transaction.installmentInfo && (
                          <span className="installment">
                            Parcela {transaction.installmentInfo}
                          </span>
                        )}
                    </div>
                  </td>
                  <td
                    className={`amount ${
                      transaction.amount.startsWith("-")
                        ? "negative"
                        : "positive"
                    }`}
                  >
                    {transaction.amount}
                  </td>
                  <td>
                    <span className="category">{transaction.category}</span>
                  </td>
                  <td>
                    <span className="transaction-type">{transaction.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
