import { useState, useEffect } from "react";
import { TransactionService, Transaction, TransactionFilters } from "../api";

export interface UseTransactionsOptions extends TransactionFilters {
  autoFetch?: boolean;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { autoFetch, ...filters } = options;
      const result = await TransactionService.getTransactions(filters);
      setTransactions(result);
    } catch (err: any) {
      console.error("Transactions fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchTransactions();
  };

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchTransactions();
    }
  }, [
    options.cardId,
    options.pdfId,
    options.startDate,
    options.endDate,
    options.category,
    options.merchant,
    options.minAmount,
    options.maxAmount,
    options.transactionType,
    options.limit,
    options.offset,
    options.autoFetch,
  ]);

  return {
    transactions,
    loading,
    error,
    refresh,
    fetchTransactions,
  };
};

export const useRecentTransactions = (limit: number = 10) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await TransactionService.getRecentTransactions(limit);
      setTransactions(result);
    } catch (err: any) {
      console.error("Recent transactions fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch recent transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTransactions();
  }, [limit]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchRecentTransactions,
  };
};
