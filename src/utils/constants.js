export const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', color: '#f97316', bg: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'Transport', label: 'Transportation', color: '#0ea5e9', bg: 'bg-sky-50 text-sky-600 border-sky-200' },
  { id: 'Shopping', label: 'Shopping', color: '#ec4899', bg: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'Bills', label: 'Bills & Utilities', color: '#eab308', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'Entertainment', label: 'Entertainment', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'Health', label: 'Health & Medical', color: '#ef4444', bg: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'Education', label: 'Education', color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { id: 'Other', label: 'Other Expenses', color: '#64748b', bg: 'bg-slate-50 text-slate-600 border-slate-200' },
];

export const INCOME_CATEGORIES = [
  { id: 'Salary', label: 'Salary', color: '#10b981', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'Freelance', label: 'Freelance', color: '#3b82f6', bg: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'Business', label: 'Business', color: '#6366f1', bg: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'Investment', label: 'Investment & Dividends', color: '#14b8a6', bg: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'Gift', label: 'Gift & Grants', color: '#d946ef', bg: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
  { id: 'Other', label: 'Other Income', color: '#64748b', bg: 'bg-slate-50 text-slate-600 border-slate-200' },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)', locale: 'en-AU' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'ar-AE' },
];

export const DATE_FORMATS = [
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Indian Standard - e.g. 19/10/2026)' },
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format - e.g. 10/19/2026)' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format - e.g. 2026-10-19)' },
];

export const DEFAULT_INITIAL_BALANCE = 50000;
export const DEFAULT_MONTHLY_BUDGET = 45000;
export const DEFAULT_SAVINGS_GOAL = 20000;

export const DEFAULT_CATEGORY_BUDGETS = {
  Food: 12000,
  Transport: 5000,
  Shopping: 8000,
  Bills: 9000,
  Entertainment: 4000,
  Health: 3000,
  Education: 3000,
  Other: 1000,
};
