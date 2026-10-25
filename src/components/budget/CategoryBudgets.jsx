import React, { useState } from 'react';
import {
  Edit3,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency, getCategoryMeta } from '../../utils/formatters';
import BudgetModal from './BudgetModal';

export default function CategoryBudgets() {
  const { metrics, categoryBudgets, currency } = useFinance();
  const [editingCategory, setEditingCategory] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Category Spending Limits</h2>
          <p className="text-xs text-slate-500">
            Set individual limits to prevent overspending in specific categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {EXPENSE_CATEGORIES.map((cat) => {
          const limit = categoryBudgets[cat.id] || 0;
          const spent = metrics.categorySpending[cat.id] || 0;
          const remaining = limit - spent;
          const percent = limit > 0 ? Math.round((spent / limit) * 100) : spent > 0 ? 100 : 0;
          const isExceeded = limit > 0 && remaining < 0;
          const isNearLimit = limit > 0 && !isExceeded && percent >= 80;

          return (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-soft hover:shadow-soft-lg flex flex-col justify-between ${
                isExceeded
                  ? 'border-rose-200 bg-rose-50/20'
                  : isNearLimit
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-100'
              }`}
            >
              {/* Category Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h4 className="text-sm font-bold text-slate-800">{cat.label}</h4>
                  </div>
                  <button
                    onClick={() => setEditingCategory({ name: cat.id, limit })}
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                    title={`Edit limit for ${cat.label}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Amounts */}
                <div className="space-y-1 my-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-medium">Spent:</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(spent, currency)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 font-medium">Cap:</span>
                    <span className="text-slate-600 font-semibold">
                      {limit > 0 ? formatCurrency(limit, currency) : 'No limit set'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {limit > 0 && (
                  <div className="my-3">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-rose-500'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                {limit === 0 ? (
                  <span className="text-slate-400 text-[11px]">Click edit to set cap</span>
                ) : isExceeded ? (
                  <span className="inline-flex items-center text-rose-600 font-bold text-[11px]">
                    <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                    Over by {formatCurrency(Math.abs(remaining), currency)}
                  </span>
                ) : isNearLimit ? (
                  <span className="inline-flex items-center text-amber-600 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    {percent}% used (Near limit)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {formatCurrency(remaining, currency)} left
                  </span>
                )}
                {limit > 0 && (
                  <span className="font-semibold text-slate-500 text-[11px]">
                    {percent}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingCategory && (
        <BudgetModal
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          target={editingCategory.name}
          currentLimit={editingCategory.limit}
        />
      )}
    </div>
  );
}
