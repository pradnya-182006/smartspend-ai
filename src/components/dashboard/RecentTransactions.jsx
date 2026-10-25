import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, getCategoryMeta } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

export default function RecentTransactions() {
  const {
    metrics,
    currency,
    dateFormat,
    openEditModal,
    deleteTransaction,
    setActiveTab,
    openAddModal,
  } = useFinance();

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Take the latest 6 transactions from the filtered or current list
  const recentList = [...metrics.filteredTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <p className="text-xs text-slate-500">Latest income and expense records</p>
        </div>
        <button
          onClick={() => setActiveTab('transactions')}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transactions list */}
      {recentList.length === 0 ? (
        <div className="text-center py-10 px-4">
          <p className="text-xs text-slate-400 mb-3">No transactions found for the selected period.</p>
          <button
            onClick={openAddModal}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
          >
            Add a new transaction now
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentList.map((tx) => {
            const isIncome = tx.type === 'income';
            const catMeta = getCategoryMeta(tx.category, tx.type);

            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
              >
                {/* Left: Type Icon + Title + Category + Date */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tx.title}</p>
                      {tx.isDemo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span
                        className="px-2 py-0.5 rounded-md font-medium text-[11px]"
                        style={{
                          backgroundColor: `${catMeta.color}15`,
                          color: catMeta.color,
                        }}
                      >
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.date, dateFormat)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center space-x-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p
                      className={`text-sm sm:text-base font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{tx.type}</p>
                  </div>

                  {/* Action buttons (hover or mobile visible) */}
                  <div className="flex items-center space-x-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                      title="Edit"
                      aria-label="Edit transaction"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(tx.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTransaction(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction? Financial balances will immediately update."
        confirmText="Yes, Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
