export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Category {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  SALARY = 'Salary',
  TRANSFER = 'Transfer',
  OTHER = 'Other'
}

export interface Transaction {
  id?: string; // Added ID for keying
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  isCash?: boolean; // Flag for manual cash entries
  isSuspicious?: boolean; // Flag for analysis
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
}

export enum SavingsFrequency {
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly'
}

export interface SavingsTarget {
  amount: number;
  frequency: SavingsFrequency;
}

export interface AdviceRequest {
  currentSavings: number;
  targetSavings: number; // Monthly equivalent
  topExpenses: { category: string; amount: number }[];
  totalIncome: number;
  totalExpense: number;
}

export interface AdviceResponse {
  advice: string;
  suggestedCuts: { category: string; suggestedReduction: number; reason: string }[];
}

export type DateRange = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';