import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Brain,
  Target,
  Cpu,
  Shield,
  X,
  Wallet,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai', label: 'AI Predictions', icon: Brain },
  { id: 'budgets', label: 'Budget Planner', icon: Target },
  { id: 'models', label: 'ML Model Lab', icon: Cpu },
  { id: 'security', label: 'Privacy & Security', icon: Shield },
];

export default function MobileNav({ isOpen, onClose }) {
  const { activeTab, setActiveTab, openAddModal, metrics, currency } = useFinance();

  return (
    <>
      {/* Mobile Drawer (Slide in) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#0B1F3A] text-slate-200 shadow-2xl p-6 flex flex-col z-10 animate-fade-in border-r border-[#163152]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#163152]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-base text-white">SmartSpend</span>
                    <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/30">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Intelligent Dashboard</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#163152]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="space-y-1.5 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-[#163152] hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick add */}
            <div className="pt-4 border-t border-[#163152] space-y-3">
              <button
                onClick={() => {
                  onClose();
                  openAddModal();
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>

              <div className="bg-[#122444] rounded-xl p-3 border border-[#1d355c] text-xs">
                <span className="text-slate-400">Net Balance:</span>{' '}
                <strong className="text-white font-bold ml-1">
                  {formatCurrency(metrics.netBalance, currency)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0B1F3A]/95 backdrop-blur-md border-t border-[#163152] z-40 px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs transition-colors ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
