import api from "./axios";
import {
  Transaction,
  PDFExtractable,
  TransactionSummary,
  SpendingByCategory,
  DateRange,
} from "./types";

export interface TransactionFilters {
  cardId?: number;
  pdfId?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  transactionType?: "credit" | "debit" | "pix" | "ted" | "boleto" | "cash";
  limit?: number;
  offset?: number;
}

export class TransactionService {
  /**
   * Get all transactions for a specific PDF statement
   */
  static async getTransactionsByPdf(pdfId: number): Promise<Transaction[]> {
    const response = await api.get(`/pdfs/${pdfId}/transactions`);
    return response.data;
  }

  /**
   * Get all transactions with optional filters
   */
  static async getTransactions(
    filters: TransactionFilters = {}
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  }

  /**
   * Get transaction summaries by type (Credit, Debit, PIX, etc.)
   */
  static async getTransactionSummaries(
    dateRange?: DateRange
  ): Promise<TransactionSummary[]> {
    const params = new URLSearchParams();

    if (dateRange) {
      params.append("start_date", dateRange.start.toISOString().split("T")[0]);
      params.append("end_date", dateRange.end.toISOString().split("T")[0]);
    }

    const response = await api.get(
      `/transactions/summary?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get spending breakdown by category
   */
  static async getSpendingByCategory(
    dateRange?: DateRange
  ): Promise<SpendingByCategory[]> {
    const params = new URLSearchParams();

    if (dateRange) {
      params.append("start_date", dateRange.start.toISOString().split("T")[0]);
      params.append("end_date", dateRange.end.toISOString().split("T")[0]);
    }

    const response = await api.get(
      `/transactions/categories?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get monthly spending trends
   */
  static async getMonthlySpending(
    months: number = 12
  ): Promise<{ month: string; amount: number; date: string }[]> {
    const response = await api.get(`/transactions/monthly?months=${months}`);
    return response.data;
  }

  /**
   * Get recent transactions (last N transactions)
   */
  static async getRecentTransactions(
    limit: number = 10
  ): Promise<Transaction[]> {
    const response = await api.get(`/transactions/recent?limit=${limit}`);
    return response.data;
  }

  /**
   * Search transactions by description or merchant
   */
  static async searchTransactions(
    query: string,
    filters: TransactionFilters = {}
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({ q: query });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions/search?${params.toString()}`);
    return response.data;
  }

  /**
   * Update transaction category or merchant manually
   */
  static async updateTransaction(
    transactionId: number,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const response = await api.put(`/transactions/${transactionId}`, updates);
    return response.data;
  }

  /**
   * Get PDF statement details
   */
  static async getPdfStatement(pdfId: number): Promise<PDFExtractable> {
    const response = await api.get(`/pdfs/${pdfId}`);
    return response.data;
  }
}
