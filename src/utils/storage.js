/**
 * Safe LocalStorage utility that gracefully handles exceptions,
 * SSR, and malformed JSON payloads.
 */

export const StorageKeys = {
  TRANSACTIONS: 'finvibe_transactions',
  INITIAL_BALANCE: 'finvibe_initial_balance',
  MONTHLY_BUDGET: 'finvibe_monthly_budget',
  CATEGORY_BUDGETS: 'finvibe_category_budgets',
  CURRENCY: 'finvibe_currency',
  DATE_FORMAT: 'finvibe_date_format',
  SAVINGS_GOAL: 'finvibe_savings_goal',
  IS_INITIALIZED: 'finvibe_initialized',
};

export const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return fallback;
      return JSON.parse(item);
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return fallback;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Error saving localStorage key "${key}":`, err);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Error removing localStorage key "${key}":`, err);
      return false;
    }
  },

  clearAllFinVibeData: () => {
    try {
      Object.values(StorageKeys).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (err) {
      console.error('Error clearing FinVibe storage:', err);
      return false;
    }
  },
};
