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
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
  monthlySummary: MonthlySummary[];
  topCategories: { category: string; amount: number }[];
}

export interface AdviceRequest {
  currentSavings: number;
  targetSavings: number;
  topExpenses: { category: string; amount: number }[];
  totalIncome: number;
  totalExpense: number;
}

export interface AdviceResponse {
  advice: string;
  suggestedCuts: { category: string; suggestedReduction: number; reason: string }[];
}