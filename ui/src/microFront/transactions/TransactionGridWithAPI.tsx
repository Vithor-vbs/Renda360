import React, { useState, useEffect, useMemo } from "react";
import "./transactionGrid.css";
import { FaFilter } from "react-icons/fa";
import { Transaction } from "../../api/types";

interface Props {
  filter: string;
  transactions?: Transaction[];
  loading?: boolean;
  error?: string;
}

export const TransactionGridWithAPI: React.FC<Props> = ({
  filter,
  transactions = [],
  loading = false,
  error,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    setSelectedCategory(null);
    setShowFilter(false);
  }, [filter]);

  // Filter transactions based on selected filter and category
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by transaction type
    if (filter !== "All") {
      filtered = filtered.filter((transaction) => {
        const desc = transaction.description.toLowerCase();

        switch (filter) {
          case "Pix":
            return desc.includes("pix");
          case "TED":
            return desc.includes("ted");
          case "Boleto":
            return desc.includes("boleto") || desc.includes("fatura");
          case "Dinheiro":
            return desc.includes("saque") || desc.includes("dinheiro");
          case "Cartão de Crédito":
            // Most credit card transactions - exclude specific payment types
            return (
              !desc.includes("pix") &&
              !desc.includes("ted") &&
              !desc.includes("saque") &&
              !desc.includes("dinheiro") &&
              !desc.includes("boleto")
            );
          case "Cartão de Débito":
            return (
              desc.includes("débito") ||
              desc.includes("debito") ||
              desc.includes("debit")
            );
          default:
            return true;
        }
      });
    }

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(
        (transaction) => transaction.category === selectedCategory
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filter, selectedCategory]);

  // Category display mapping - matches PDF extractor categories
  const categoryDisplayNames: Record<string, string> = {
    food_delivery: "Delivery de Comida",
    restaurants: "Restaurantes",
    groceries: "Supermercado",
    transport: "Transporte",
    fuel: "Combustível",
    shopping_online: "Compras Online",
    shopping_physical: "Compras Físicas",
    entertainment: "Entretenimento",
    subscriptions: "Assinaturas",
    utilities: "Utilidades",
    health: "Saúde",
    education: "Educação",
    financial_services: "Serviços Financeiros",
    others: "Outros",
  };

  // Get unique categories from filtered transactions
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(transactions.map((t) => t.category).filter(Boolean)),
    ];
    return uniqueCategories.sort();
  }, [transactions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  };

  const getTransactionType = (transaction: Transaction) => {
    const desc = transaction.description.toLowerCase();

    // Check for specific payment methods first
    if (desc.includes("pix")) return "Pix";
    if (desc.includes("ted")) return "TED";
    if (desc.includes("boleto") || desc.includes("fatura")) return "Boleto";
    if (desc.includes("saque") || desc.includes("dinheiro")) return "Saque";

    // Check for debit card transactions
    if (
      desc.includes("débito") ||
      desc.includes("debito") ||
      desc.includes("debit")
    ) {
      return "Cartão de Débito";
    }

    // Most transactions from Nubank statements are credit card purchases
    // Since amounts are always positive in the normalized data
    return "Cartão de Crédito";
  };

  if (loading) {
    return (
      <div className="transaction-grid-container">
        <div className="loading-message">
          <p>Carregando transações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-grid-container">
        <div className="loading-message">
          <p>Erro ao carregar transações: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-grid-container">
      <div className="filter-header">
        <h3>
          {filter === "All" ? "Todas as Transações" : `Transações - ${filter}`}
          <span className="transaction-count">
            ({filteredTransactions.length})
          </span>
        </h3>

        {categories.length > 0 && (
          <button
            className="filter-button"
            onClick={() => setShowFilter(!showFilter)}
          >
            <FaFilter /> Filtros
          </button>
        )}
      </div>

      {showFilter && categories.length > 0 && (
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
              onClick={() => setSelectedCategory(category || null)}
            >
              {category
                ? categoryDisplayNames[category] || category
                : "Sem Categoria"}
            </button>
          ))}
        </div>
      )}

      <div className="transaction-grid">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <p>Nenhuma transação encontrada para os filtros selecionados.</p>
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <div className="transaction-description">
                      <span className="description">
                        {transaction.description}
                      </span>
                      {transaction.merchant && (
                        <span className="merchant">{transaction.merchant}</span>
                      )}
                      {transaction.is_installment &&
                        transaction.installment_info && (
                          <span className="installment">
                            Parcela {transaction.installment_info}
                          </span>
                        )}
                    </div>
                  </td>
                  <td
                    className={`amount ${
                      transaction.amount < 0 ? "negative" : "positive"
                    }`}
                  >
                    {formatAmount(transaction.amount)}
                  </td>
                  <td>
                    <span className="category">
                      {transaction.category
                        ? categoryDisplayNames[transaction.category] ||
                          transaction.category
                        : "Não categorizado"}
                    </span>
                  </td>
                  <td>
                    <span className="transaction-type">
                      {getTransactionType(transaction)}
                    </span>
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
