import React from 'react';
import { FileQuestion, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No transactions found',
  description = 'You have not added any transactions for the selected criteria yet.',
  actionText = 'Add Transaction',
  onAction,
  icon: Icon = FileQuestion,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionText}
        </button>
      )}
    </div>
  );
}
