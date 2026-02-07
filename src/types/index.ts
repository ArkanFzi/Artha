export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  type: TransactionType;
  description?: string;
  note?: string;
  date: string;
  createdAt: string;
  image?: string;
  photoUri?: string;
  currency?: string;
  exchangeRate?: number;
  isRecurring?: boolean;
  recurringId?: string;
}

export interface Budget {
  totalIncome: number;
  categoryBudgets: Record<string, number>;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string;
  createdAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  lastGenerated: string | null;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export type NotificationType = 'budget_warning' | 'bill_reminder' | 'goal_achieved' | 'recurring_transaction' | 'general';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  icon: string;
  priority: NotificationPriority;
}

export interface InvestmentRecommendation {
  percentage: number;
  remainingBudget: number;
  recommended: number;
  minInvestment: number;
  idealInvestment: number;
}

export interface InvestmentSuggestion {
  level: 'minimal' | 'conservative' | 'moderate' | 'aggressive';
  title: string;
  description: string;
  suggestions: string[];
  investmentTypes: {
    name: string;
    icon: string;
    risk: string;
    return: string;
  }[];
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceVariant: string;
  surfaceElevated?: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  textDisabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderStrong?: string;
  divider: string;
  shadow: string;
  overlay: string;
  chartIncome: string;
  chartExpense: string;
  chartBalance: string;
  cardBackground?: string;
  cardBackgroundElevated?: string;
  income: string;
  expense: string;
}

export interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  isLoading: boolean;
}

export interface PINContextType {
  isPINEnabled: boolean;
  isPINVerified: boolean;
  isLoading: boolean;
  updatePINStatus: () => Promise<void>;
  verifySuccess: () => void;
  requirePIN: () => void;
}
