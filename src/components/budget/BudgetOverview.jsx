import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, AlertOctagon, Edit3 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';
import BudgetModal from './BudgetModal';

export default function BudgetOverview() {
  const { metrics, monthlyBudget, currency, selectedMonth } = useFinance();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const spent = metrics.periodExpenses;
  const remaining = metrics.remainingMonthlyBudget;
  const percentage = Math.min(Math.round(metrics.budgetUsedPercentage), 100);
  const actualPercentage = Math.round(metrics.budgetUsedPercentage);

  const isExceeded = remaining < 0;
  const isNearLimit = !isExceeded && actualPercentage >= 80;

  const monthName =
    selectedMonth === 'all' ? 'All Time' : formatMonthYear(selectedMonth);

  return (
    <div className="space-y-4">
      {/* Exceeded or Warning Alert Banners */}
      {isExceeded && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-800 animate-fade-in shadow-sm">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-rose-900">Overall Monthly Budget Exceeded!</h2>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              You have exceeded your monthly spending budget of {formatCurrency(monthlyBudget, currency)} by{' '}
              <strong>{formatCurrency(Math.abs(remaining), currency)}</strong> for {monthName}. Consider reviewing your non-essential expenses.
            </p>
          </div>
        </div>
      )}

      {isNearLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-800 animate-fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-amber-900">Budget Warning: 80% Limit Reached</h2>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              You have utilized <strong>{actualPercentage}%</strong> of your monthly budget. You have{' '}
              <strong>{formatCurrency(remaining, currency)}</strong> remaining for {monthName}.
            </p>
          </div>
        </div>
      )}

      {/* Main Budget Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">Overall Monthly Budget</h2>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                  title="Edit monthly budget"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Active for: <span className="font-semibold text-slate-700">{monthName}</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isExceeded ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                Over Limit ({actualPercentage}%)
              </span>
            ) : isNearLimit ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Near Limit ({actualPercentage}%)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                On Track ({actualPercentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Numbers Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Budget Limit
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {formatCurrency(monthlyBudget, currency)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Spent So Far
            </p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              {formatCurrency(spent, currency)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Remaining Allowance
            </p>
            <p
              className={`text-xl font-bold mt-1 ${
                isExceeded ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isExceeded ? '-' : ''}
              {formatCurrency(Math.abs(remaining), currency)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600">Budget Progress</span>
            <span
              className={
                isExceeded
                  ? 'text-rose-600'
                  : isNearLimit
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }
            >
              {actualPercentage}% used
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded
                  ? 'bg-rose-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(actualPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <BudgetModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        target="overall"
        currentLimit={monthlyBudget}
      />
    </div>
  );
}
