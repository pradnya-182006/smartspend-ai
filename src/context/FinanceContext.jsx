import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { safeStorage, StorageKeys } from '../utils/storage';
import { INITIAL_SAMPLE_TRANSACTIONS } from '../utils/sampleData';
import {
  DEFAULT_INITIAL_BALANCE,
  DEFAULT_MONTHLY_BUDGET,
  DEFAULT_CATEGORY_BUDGETS,
  DEFAULT_SAVINGS_GOAL,
} from '../utils/constants';
import { generateId } from '../utils/formatters';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  // 1. Transactions State
  const [transactions, setTransactions] = useState(() => {
    const saved = safeStorage.get(StorageKeys.TRANSACTIONS, null);
    if (saved && Array.isArray(saved)) {
      return saved;
    }
    // First time load: provide realistic demo data
    safeStorage.set(StorageKeys.TRANSACTIONS, INITIAL_SAMPLE_TRANSACTIONS);
    safeStorage.set(StorageKeys.IS_INITIALIZED, true);
    return INITIAL_SAMPLE_TRANSACTIONS;
  });

  // 2. Settings & Balance State
  const [initialBalance, setInitialBalanceState] = useState(() => {
    return safeStorage.get(StorageKeys.INITIAL_BALANCE, DEFAULT_INITIAL_BALANCE);
  });

  const [monthlyBudget, setMonthlyBudgetState] = useState(() => {
    return safeStorage.get(StorageKeys.MONTHLY_BUDGET, DEFAULT_MONTHLY_BUDGET);
  });

  const [categoryBudgets, setCategoryBudgetsState] = useState(() => {
    return safeStorage.get(StorageKeys.CATEGORY_BUDGETS, DEFAULT_CATEGORY_BUDGETS);
  });

  const [currency, setCurrencyState] = useState(() => {
    return safeStorage.get(StorageKeys.CURRENCY, 'INR');
  });

  const [dateFormat, setDateFormatState] = useState(() => {
    return safeStorage.get(StorageKeys.DATE_FORMAT, 'DD/MM/YYYY');
  });

  const [savingsGoal, setSavingsGoalState] = useState(() => {
    return safeStorage.get(StorageKeys.SAVINGS_GOAL, DEFAULT_SAVINGS_GOAL);
  });

  // 3. Navigation & Modal States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'settings'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // 4. Toast Notification State
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync to local storage
  useEffect(() => {
    safeStorage.set(StorageKeys.TRANSACTIONS, transactions);
  }, [transactions]);

  const setInitialBalance = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setInitialBalanceState(num);
    safeStorage.set(StorageKeys.INITIAL_BALANCE, num);
    showToast('Initial balance updated successfully', 'success');
  };

  const setMonthlyBudget = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setMonthlyBudgetState(num);
    safeStorage.set(StorageKeys.MONTHLY_BUDGET, num);
    showToast('Monthly budget updated', 'success');
  };

  const setCategoryBudget = (category, val) => {
    const num = Math.max(0, Number(val) || 0);
    setCategoryBudgetsState((prev) => {
      const updated = { ...prev, [category]: num };
      safeStorage.set(StorageKeys.CATEGORY_BUDGETS, updated);
      return updated;
    });
    showToast(`Budget for ${category} updated`, 'success');
  };

  const setCurrency = (code) => {
    setCurrencyState(code);
    safeStorage.set(StorageKeys.CURRENCY, code);
    showToast(`Currency changed to ${code}`, 'info');
  };

  const setDateFormat = (format) => {
    setDateFormatState(format);
    safeStorage.set(StorageKeys.DATE_FORMAT, format);
    showToast('Date format updated', 'info');
  };

  const setSavingsGoal = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setSavingsGoalState(num);
    safeStorage.set(StorageKeys.SAVINGS_GOAL, num);
    showToast(`Monthly savings goal set to ${num}`, 'success');
  };

  // Derive unique available months sorted newest first
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    // Default current month (e.g. '2026-10')
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthStr);

    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.substring(0, 7));
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Selected month filter for dashboard & monthly budget
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Pick the most recent month available or '2026-10'
    return '2026-10';
  });

  // Keep selectedMonth valid if availableMonths change
  useEffect(() => {
    if (selectedMonth !== 'all' && !availableMonths.includes(selectedMonth)) {
      if (availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [availableMonths, selectedMonth]);

  // Transaction CRUD
  const addTransaction = (txData) => {
    const newTx = {
      ...txData,
      id: generateId(),
      amount: Math.abs(Number(txData.amount)),
      isDemo: false,
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (newTx.type === 'income') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7'],
        });
      } catch (e) {
        // Safe fallback
      }
      showToast(`Income "${newTx.title}" recorded!`, 'success');
    } else {
      showToast(`Expense "${newTx.title}" recorded!`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const updateTransaction = (id, updatedFields) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...updatedFields,
            amount: Math.abs(Number(updatedFields.amount ?? t.amount)),
          };
        }
        return t;
      })
    );
    setEditingTransaction(null);
    showToast('Transaction updated successfully', 'success');
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted', 'info');
  };

  const clearAllData = () => {
    setTransactions([]);
    safeStorage.set(StorageKeys.TRANSACTIONS, []);
    showToast('All transaction data cleared', 'warning');
  };

  const loadDemoData = () => {
    setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
    safeStorage.set(StorageKeys.TRANSACTIONS, INITIAL_SAMPLE_TRANSACTIONS);
    setSelectedMonth('2026-10');
    showToast('Realistic demo data restored!', 'success');
  };

  const importTransactionsList = (newTxs) => {
    setTransactions((prev) => [...newTxs, ...prev]);
    showToast(`Successfully imported ${newTxs.length} transactions!`, 'success');
  };

  // Open & Close Modals
  const openAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  // -------------------------------------------------------------
  // Derived Financial Calculations (Core Logic)
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    // 1. All-time calculations for Net Balance:
    // Net balance = opening balance + all income - all expenses
    let allTimeIncome = 0;
    let allTimeExpenses = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        allTimeIncome += amt;
      } else {
        allTimeExpenses += amt;
      }
    });

    const netBalance = initialBalance + allTimeIncome - allTimeExpenses;

    // 2. Selected Period calculations:
    const filteredTxs = transactions.filter((tx) => {
      if (selectedMonth === 'all') return true;
      return tx.date && tx.date.startsWith(selectedMonth);
    });

    let periodIncome = 0;
    let periodExpenses = 0;
    const categorySpending = {};

    filteredTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        periodIncome += amt;
      } else {
        periodExpenses += amt;
        const cat = tx.category || 'Other';
        categorySpending[cat] = (categorySpending[cat] || 0) + amt;
      }
    });

    // Monthly savings = monthly income - monthly expenses
    const periodSavings = periodIncome - periodExpenses;
    const savingsRate = periodIncome > 0 ? (periodSavings / periodIncome) * 100 : 0;

    // Remaining Monthly Budget
    const remainingMonthlyBudget = monthlyBudget - periodExpenses;
    const budgetUsedPercentage = monthlyBudget > 0 ? (periodExpenses / monthlyBudget) * 100 : 0;

    return {
      allTimeIncome,
      allTimeExpenses,
      netBalance,
      periodIncome,
      periodExpenses,
      periodSavings,
      savingsRate,
      remainingMonthlyBudget,
      budgetUsedPercentage,
      filteredTransactions: filteredTxs,
      categorySpending,
    };
  }, [transactions, initialBalance, monthlyBudget, selectedMonth]);

  const value = {
    transactions,
    initialBalance,
    monthlyBudget,
    categoryBudgets,
    currency,
    dateFormat,
    savingsGoal,
    selectedMonth,
    availableMonths,
    activeTab,
    isAddModalOpen,
    editingTransaction,
    toasts,
    metrics,
    // Actions
    setActiveTab,
    setSelectedMonth,
    setInitialBalance,
    setMonthlyBudget,
    setCategoryBudget,
    setCurrency,
    setDateFormat,
    setSavingsGoal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllData,
    loadDemoData,
    importTransactionsList,
    openAddModal,
    openEditModal,
    closeModal,
    showToast,
    dismissToast,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
