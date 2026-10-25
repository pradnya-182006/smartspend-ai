import React, { useState, useRef } from 'react';
import {
  Coins,
  Calendar,
  Wallet,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Target,
  Brain,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES, DATE_FORMATS } from '../../utils/constants';
import { exportTransactionsToCSV, parseTransactionsCSV } from '../../utils/csvHelper';
import ConfirmModal from '../common/ConfirmModal';

export default function SettingsView() {
  const {
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
    initialBalance,
    setInitialBalance,
    savingsGoal,
    setSavingsGoal,
    transactions,
    clearAllData,
    loadDemoData,
    importTransactionsList,
    showToast,
  } = useFinance();

  const [openingBalanceInput, setOpeningBalanceInput] = useState(initialBalance);
  const [savingsGoalInput, setSavingsGoalInput] = useState(savingsGoal);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleSaveBalance = (e) => {
    e.preventDefault();
    setInitialBalance(openingBalanceInput);
  };

  const handleExportCSV = () => {
    try {
      exportTransactionsToCSV(transactions, 'finvibe_transactions_backup.csv');
      showToast('All transactions exported to CSV!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsedTxs = parseTransactionsCSV(text);
        importTransactionsList(parsedTxs);
      } catch (err) {
        showToast(err.message || 'Failed to parse CSV file', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. General Preferences Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Regional & Display Preferences</h2>
            <p className="text-xs text-slate-400">
              Customize currency symbol and localized date formats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 cursor-pointer"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">
              Default is INR (₹). Updates all cards, charts, and metrics immediately.
            </p>
          </div>

          {/* Date Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Date Formatting
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 cursor-pointer"
            >
              {DATE_FORMATS.map((fmt) => (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">
              Recommended: DD/MM/YYYY for Indian financial standards.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Opening Balance Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Opening Balance</h2>
            <p className="text-xs text-slate-400">
              Set the documented baseline balance stored separately from daily transactions
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBalance} className="space-y-4">
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Initial Baseline Balance
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="100"
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all shrink-0"
              >
                Update
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Formula: Net Balance = Opening Balance + Total Income − Total Expenses.
            </p>
          </div>
        </form>
      </div>

      {/* 2b. Monthly Savings Goal (AI) */}
      <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-indigo-100">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Savings Goal</h2>
            <p className="text-xs text-slate-400">
              Set your monthly savings target for Logistic Regression prediction in AI Predictions tab
            </p>
          </div>
          <span className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">ML Feature</span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSavingsGoal(savingsGoalInput); }} className="space-y-4">
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Monthly Savings Target (₹)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="500"
                value={savingsGoalInput}
                onChange={(e) => setSavingsGoalInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all shrink-0"
              >
                Set Goal
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Current goal: <span className="font-bold text-indigo-600">₹{savingsGoal.toLocaleString('en-IN')}/month</span>. 
              The AI Logistic Regression model uses this to classify savings achievability.
            </p>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Data Backup & Migration</h2>
            <p className="text-xs text-slate-400">
              Export and import your complete transaction ledger as CSV
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Export All Transactions</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                Download a clean, structured spreadsheet (.csv) containing all current records for Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Import Transactions CSV</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                Upload a CSV file with Title, Amount, Type, Category, Date, and Notes columns to bulk import.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
              >
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Choose CSV File</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone & Demo Data Controls */}
      <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-rose-100">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-950">Data Reset & Demo Management</h2>
            <p className="text-xs text-rose-500">
              Restore default showcase demo data or permanently wipe records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Restore Demo Data */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Load Showcase Demo Data</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Populates 20+ realistic transactions spanning multiple months, complete with income, bills, and investments.
              </p>
            </div>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Restore Demo Data</span>
            </button>
          </div>

          {/* Wipe All Data */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-rose-900">Clear All Transactions</h4>
              <p className="text-xs text-rose-600 mt-1 mb-4">
                Removes all transactions from browser LocalStorage. This action cannot be reversed.
              </p>
            </div>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Transactions?"
        message="Are you sure you want to delete all transactions from your browser? Your records will be wiped from LocalStorage."
        confirmText="Yes, Wipe All Data"
        confirmVariant="danger"
      />

      <ConfirmModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onConfirm={loadDemoData}
        title="Load Demo Transactions?"
        message="This will reset your transaction list to the curated multi-month demo dataset."
        confirmText="Load Demo Data"
        confirmVariant="primary"
      />
    </div>
  );
}
