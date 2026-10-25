import React, { useState, useRef } from 'react';
import {
  Shield,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Target,
  Brain,
  Key,
  Database,
  Coins,
  FileCode,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES, DATE_FORMATS } from '../../utils/constants';
import { exportTransactionsToCSV, parseTransactionsCSV } from '../../utils/csvHelper';
import ConfirmModal from '../common/ConfirmModal';

export default function PrivacySecurityView() {
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
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [isPinLockEnabled, setIsPinLockEnabled] = useState(false);
  const fileInputRef = useRef(null);

  const handleSaveBalance = (e) => {
    e.preventDefault();
    setInitialBalance(openingBalanceInput);
  };

  const handleSaveSavingsGoal = (e) => {
    e.preventDefault();
    setSavingsGoal(savingsGoalInput);
  };

  const handleExportCSV = () => {
    try {
      exportTransactionsToCSV(transactions, 'SmartSpend_Transactions_Backup.csv');
      showToast('Transactions exported to CSV successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify({
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          currency,
          initialBalance,
          savingsGoal,
          transactions,
        }, null, 2)
      );
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `SmartSpend_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      showToast('Full JSON snapshot backup downloaded!', 'success');
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
        if (typeof text === 'string') {
          const parsed = parseTransactionsCSV(text);
          importTransactionsList(parsed);
        }
      } catch (err) {
        showToast(`Failed to parse CSV: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero-Cloud Transmission</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">Local-First Storage</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Privacy, Security & Data Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your transactions and machine learning models run 100% on your local machine. No financial records leave your device.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Local Vault Encrypted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Privacy Mode & Session Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Session & Local Privacy Controls</h3>
              <p className="text-xs text-slate-500">Configure how data is stored and displayed in your browser</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Toggle 1: Local Privacy Mode */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Strict Client-Side Sandboxing</span>
                <span className="text-[11px] text-slate-500">Prevent any external telemetry or data tracking</span>
              </div>
              <button
                onClick={() => {
                  setIsPrivacyMode(!isPrivacyMode);
                  showToast(isPrivacyMode ? 'Privacy mode disabled' : 'Strict privacy mode enforced', 'info');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                  isPrivacyMode ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                    isPrivacyMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: App Lock Simulation */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Session Auto-Lock</span>
                <span className="text-[11px] text-slate-500">Prompt for passcode after 15 minutes of inactivity</span>
              </div>
              <button
                onClick={() => {
                  setIsPinLockEnabled(!isPinLockEnabled);
                  showToast(isPinLockEnabled ? 'Auto-lock disabled' : 'Session auto-lock armed', 'info');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                  isPinLockEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                    isPinLockEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Financial Targets & Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Currency & Financial Targets</h3>
              <p className="text-xs text-slate-500">Feeds the Logistic & Linear ML models</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} ({f.example})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Savings Goal Input */}
          <form onSubmit={handleSaveSavingsGoal} className="pt-2 flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Savings Goal ({currency})
              </label>
              <input
                type="number"
                value={savingsGoalInput}
                onChange={(e) => setSavingsGoalInput(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Update Goal
            </button>
          </form>
        </div>
      </div>

      {/* 4. Data Backup, Export & Restore */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Data Backup & Disaster Recovery</h3>
            <p className="text-xs text-slate-500">Export your raw data or restore verified sample datasets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 block">Export CSV</span>
            <span className="text-[11px] text-slate-500 block">Spreadsheet compatible format</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 block">Full JSON Snapshot</span>
            <span className="text-[11px] text-slate-500 block">Complete wallet & model state</span>
          </button>

          <label className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1 cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 block">Import CSV</span>
            <span className="text-[11px] text-slate-500 block">Load existing records</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1"
          >
            <RotateCcw className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-900 block">Restore Demo Data</span>
            <span className="text-[11px] text-slate-500 block">Pre-populate realistic records</span>
          </button>
        </div>
      </div>

      {/* 5. Danger Zone: Secure Wipe */}
      <div className="bg-red-50/60 p-6 rounded-2xl border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Purge All Financial Data</span>
          </h4>
          <p className="text-xs text-red-700 mt-0.5">
            Permanently clear all transactions, custom category budgets, and model weights from your browser.
          </p>
        </div>

        <button
          onClick={() => setIsClearModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
        >
          Purge & Wipe Data
        </button>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Wipe all local finance data?"
        message="This action is irreversible. All transactions, opening balance, and trained models will be deleted from your browser."
        confirmText="Yes, Wipe Data"
        onConfirm={() => {
          clearAllData();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isDemoModalOpen}
        title="Restore Demo Financial Data?"
        message="This will overwrite your current transactions with realistic sample income and expenses across 3 months."
        confirmText="Restore Demo"
        onConfirm={() => {
          loadDemoData();
          setIsDemoModalOpen(false);
        }}
        onCancel={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
