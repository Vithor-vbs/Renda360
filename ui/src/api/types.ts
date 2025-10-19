// API Response Types

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

// Card Types
export interface Card {
  id: number;
  user_id: number;
  number: string;
  expiration_date: string;
  card_type: "credito" | "debito";
  available_limit?: number;
  used_limit?: number;
  brand?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// PDF/Statement Types
export interface PDFExtractable {
  id: number;
  card_id: number;
  file_name: string;
  uploaded_at: string;
  statement_date?: string;
  statement_period_start?: string;
  statement_period_end?: string;
  previous_invoice?: number;
  payment_received?: number;
  total_purchases?: number;
  other_charges?: number;
  total_to_pay?: number;
  next_closing_date?: string;
  next_invoice_balance?: number;
  total_open_balance?: number;
  summary_json?: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  date: string; // ISO format: "2025-08-21"
  description: string;
  description_original?: string;
  amount: number;
  pdf_id: number;
  category?: string;
  merchant?: string;
  is_installment: boolean;
  installment_info?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Data Types
export interface TransactionSummary {
  type: string;
  total: number;
  count: number;
  change_percentage?: number;
  period: string;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlySpending {
  month: string;
  expenses: number;
  income: number;
  label?: string;
}

export interface DashboardData {
  total_balance: number;
  total_spent_this_month: number;
  transaction_summaries: TransactionSummary[];
  spending_by_category: SpendingByCategory[];
  monthly_spending: MonthlySpending[];
  recent_transactions: Transaction[];
  cards_summary: {
    total_cards: number;
    total_available_limit: number;
    total_used_limit: number;
  };
}

// Date Range Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface SubscriptionTransaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string | null;
}

export interface Subscription {
  merchant: string;
  average_amount: number;
  frequency: number;
  total_months: number;
  average_day_of_month: number;
  category: string | null;
  first_charge: string;
  last_charge: string;
  total_spent: number;
  transactions: SubscriptionTransaction[];
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total_subscriptions: number;
  total_monthly_cost: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

// Julius AI Types (already defined in JuliusContext, but included for completeness)
export interface JuliusMessage {
  id: number;
  message_type: "user" | "assistant";
  content: string;
  created_at: string;
  query_type?: string;
  optimization_level?: string;
  response_time_ms?: number;
  cost_estimate?: number;
}

export interface ConversationStatus {
  session_id: string;
  total_messages: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}