import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Brain,
  Target,
  Cpu,
  Shield,
  Plus,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai', label: 'AI Predictions', icon: Brain, badge: 'ML' },
  { id: 'budgets', label: 'Budget Planner', icon: Target, badge: 'RL' },
  { id: 'models', label: 'ML Model Lab', icon: Cpu, badge: '11 Exps' },
  { id: 'security', label: 'Privacy & Security', icon: Shield },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, openAddModal, metrics, currency } = useFinance();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0B1F3A] text-slate-300 border-r border-[#163152] min-h-screen p-5 shrink-0 select-none shadow-2xl z-20">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-2 py-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#635BDB] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-lg text-white tracking-tight">SmartSpend</span>
            <span className="text-[10px] font-bold bg-[#635BDB]/30 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/30 uppercase">
              AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Intelligent Finance Dashboard</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="space-y-1.5 flex-1" aria-label="Main Navigation">
        <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider px-3 mb-2">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#163152]/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    item.badge.includes('ML') || item.badge.includes('Exps')
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Button */}
      <div className="my-5">
        <button
          onClick={openAddModal}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Mini Wallet Snapshot Card */}
      <div className="bg-[#122444]/90 rounded-2xl p-4 border border-[#1d355c]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Net Balance</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-lg font-bold text-white tracking-tight">
          {formatCurrency(metrics.netBalance, currency)}
        </p>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
          <span>Income − Expenses</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
}
