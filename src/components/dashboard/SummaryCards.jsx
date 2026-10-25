import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';

export default function SummaryCards() {
  const { metrics, currency, selectedMonth, monthlyBudget } = useFinance();

  const isBudgetExceeded = metrics.remainingMonthlyBudget < 0;
  const isBudgetWarning = !isBudgetExceeded && metrics.budgetUsedPercentage >= 80;

  const monthLabel =
    selectedMonth === 'all' ? 'All Time' : formatMonthYear(selectedMonth);

  const budgetUsedPct = Math.round(metrics.budgetUsedPercentage || 0);
  const netSavings = metrics.periodSavings;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Income Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Income
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            +{formatCurrency(metrics.periodIncome, currency)}
          </p>
          <div className="flex items-center text-xs text-slate-500">
            <span className="font-medium text-emerald-600">{monthLabel}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>Monthly cash inflow</span>
          </div>
        </div>
      </div>

      {/* 2. Expenses Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Expenses
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            -{formatCurrency(metrics.periodExpenses, currency)}
          </p>
          <div className="flex items-center text-xs text-slate-500">
            <span className="font-medium text-rose-600">{monthLabel}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>Total expenditures</span>
          </div>
        </div>
      </div>

      {/* 3. Net Savings Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Savings
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              netSavings >= 0 ? 'text-[#10B981]' : 'text-rose-600'
            }`}
          >
            {netSavings >= 0 ? '+' : ''}
            {formatCurrency(netSavings, currency)}
          </p>
          <div className="flex items-center text-xs text-slate-500">
            <span className="font-medium text-slate-700">Income − expenses</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>{metrics.savingsRate.toFixed(1)}% rate</span>
          </div>
        </div>
      </div>

      {/* 4. Budget Used Card */}
      <div
        className={`rounded-2xl p-5 border transition-all relative overflow-hidden group ${
          isBudgetExceeded
            ? 'bg-red-50/80 border-red-200'
            : isBudgetWarning
            ? 'bg-amber-50/80 border-amber-200'
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Budget Used
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isBudgetExceeded
                ? 'bg-red-100 text-[#EF4444]'
                : isBudgetWarning
                ? 'bg-amber-100 text-[#F59E0B]'
                : 'bg-indigo-50 text-[#635BDB]'
            }`}
          >
            {isBudgetExceeded ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <p
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isBudgetExceeded
                  ? 'text-[#EF4444]'
                  : isBudgetWarning
                  ? 'text-[#F59E0B]'
                  : 'text-slate-900'
              }`}
            >
              {budgetUsedPct}%
            </p>
            <span className="text-xs font-medium text-slate-500">
              of {formatCurrency(monthlyBudget, currency)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetExceeded
                  ? 'bg-[#EF4444]'
                  : isBudgetWarning
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#10B981]'
              }`}
              style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {isBudgetExceeded
              ? `Exceeded by ${formatCurrency(Math.abs(metrics.remainingMonthlyBudget), currency)}`
              : `${formatCurrency(metrics.remainingMonthlyBudget, currency)} remaining`}
          </p>
        </div>
      </div>
    </div>
  );
}
