import React from 'react';

export function Card({ children, className = '', hoverEffect = false, padding = 'p-6' }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-soft transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-soft-lg hover:border-slate-200' : ''
      } ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export function CategoryBadge({ category, type = 'expense' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
        type === 'income'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          : 'bg-slate-100 text-slate-700 border border-slate-200/70'
      }`}
    >
      {category}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isIncome = type === 'income';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isIncome
          ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
          : 'bg-rose-100/70 text-rose-800 border border-rose-200'
      }`}
    >
      {isIncome ? '+ Income' : '- Expense'}
    </span>
  );
}
