import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';

export default function TransactionModal() {
  const {
    isAddModalOpen,
    editingTransaction,
    closeModal,
    addTransaction,
    updateTransaction,
    currency,
  } = useFinance();

  const isEditing = Boolean(editingTransaction);

  const getTodayISO = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: getTodayISO(),
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Reset or fill form when modal opens
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        title: editingTransaction.title || '',
        amount: editingTransaction.amount || '',
        type: editingTransaction.type || 'expense',
        category: editingTransaction.category || 'Food',
        date: editingTransaction.date || getTodayISO(),
        notes: editingTransaction.notes || '',
      });
      setErrors({});
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: getTodayISO(),
        notes: '',
      });
      setErrors({});
    }
  }, [editingTransaction, isAddModalOpen]);

  // When type changes, switch default category if current category isn't valid in that type
  const handleTypeChange = (newType) => {
    const currentCats = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const isCurrentValid = currentCats.some((c) => c.id === formData.category);

    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: isCurrentValid ? prev.category : currentCats[0].id,
    }));
  };

  const validate = () => {
    const errs = {};

    if (!formData.title.trim()) {
      errs.title = 'Transaction title is required.';
    } else if (formData.title.trim().length < 2) {
      errs.title = 'Title must be at least 2 characters.';
    }

    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount)) {
      errs.amount = 'Please enter a valid amount.';
    } else if (numAmount <= 0) {
      errs.amount = 'Amount must be greater than zero.';
    }

    if (!formData.date) {
      errs.date = 'Date is required.';
    } else {
      const parsed = Date.parse(formData.date);
      if (isNaN(parsed)) {
        errs.date = 'Please select a valid date.';
      }
    }

    if (!formData.category) {
      errs.category = 'Please select a category.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      notes: formData.notes.trim(),
    };

    if (isEditing) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
  };

  const categoryList = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isAddModalOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit Transaction' : 'Record New Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle: Income vs Expense */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                formData.type === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                formData.type === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Transaction Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Title / Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Grocery store, Salary bonus, Taxi fare"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: null });
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.title
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {errors.title && (
            <p className="flex items-center text-xs text-rose-500 mt-1">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Amount & Date (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: null });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="flex items-center text-xs text-rose-500 mt-1">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors({ ...errors, date: null });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.date
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
              }`}
            />
            {errors.date && (
              <p className="flex items-center text-xs text-rose-500 mt-1">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.date}
              </p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => {
              setFormData({ ...formData, category: e.target.value });
              if (errors.category) setErrors({ ...errors, category: null });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 cursor-pointer"
          >
            {categoryList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Notes <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows="2"
            placeholder="Add relevant notes, invoice ref, or context..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
              formData.type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20'
            }`}
          >
            {isEditing ? 'Save Changes' : formData.type === 'income' ? 'Record Income' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
