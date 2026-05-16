export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'gpo' | 'reference';

export interface WalletBalance {
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  status: TransactionStatus;
  reference: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  completedAt?: string;
}

export interface TopUpRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  phone?: string;
}

export interface TopUpResponse {
  transactionId: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  // For GPO
  redirectUrl?: string;
  // For Reference (ATM/Multicaixa)
  entity?: string;
  reference?: string;
  amount?: number;
  expiresAt?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
