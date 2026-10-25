import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';

export default function BudgetModal({ isOpen, onClose, target, currentLimit }) {
  // target: 'overall' | categoryName (e.g. 'Food')
  const { setMonthlyBudget, setCategoryBudget, currency } = useFinance();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(currentLimit || '');
      setError('');
    }
  }, [isOpen, currentLimit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    if (target === 'overall') {
      setMonthlyBudget(num);
    } else {
      setCategoryBudget(target, num);
    }
    onClose();
  };

  const title =
    target === 'overall' ? 'Set Overall Monthly Budget' : `Set Budget for ${target}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Budget Cap ({currency})
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. 15000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
            autoFocus
          />
          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          <p className="text-xs text-slate-400 mt-1.5">
            Spending alerts will trigger when expenses reach 80% and 100% of this limit.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-500/20 transition-all"
          >
            Save Limit
          </button>
        </div>
      </form>
    </Modal>
  );
}
