import React from 'react';
import { Plus, Calendar, Menu } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYear } from '../../utils/formatters';
import { CURRENCIES } from '../../utils/constants';

const TAB_TITLES = {
  dashboard: {
    title: 'Financial Overview',
    subtitle: 'Understand your money. Make better decisions.',
  },
  transactions: {
    title: 'Transactions Management',
    subtitle: 'Search, filter, categorize, and review all your financial records',
  },
  analytics: {
    title: 'Spending Analytics & Clusters',
    subtitle: 'Trends, category distributions, velocity, and K-Means/DBSCAN spending profiles',
  },
  ai: {
    title: 'AI Predictions & Forecasting',
    subtitle: 'Machine learning expense estimates, budget-risk classification, and trend analysis',
  },
  budgets: {
    title: 'Budget Planner & Optimizer',
    subtitle: 'Monthly limits, savings goals, and Q-Learning reinforcement agent simulator',
  },
  models: {
    title: 'ML Model Lab (Experiments 1–11)',
    subtitle: 'Interactive machine learning benchmark, metrics, PCA/LDA projections, and comparisons',
  },
  security: {
    title: 'Privacy & Security Controls',
    subtitle: 'Offline data protection, JSON/CSV backups, session simulation, and data deletion',
  },
};

export default function Navbar({ onOpenMobileMenu }) {
  const {
    activeTab,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    openAddModal,
    currency,
  } = useFinance();

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;
  const currentCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {currentTabInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Controls & CTAs */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Month Selector dropdown */}
        <div className="relative flex items-center">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-9 pr-8 py-2 text-xs sm:text-sm font-medium bg-[#F4F7FB] border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
            aria-label="Select Filter Month"
          >
            <option value="all">All Time</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthYear(ym)}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 text-slate-400 text-xs">▼</div>
        </div>

        {/* Currency Pill */}
        <div
          title={`Active currency: ${currentCurrency.name}`}
          className="hidden md:flex items-center space-x-1 px-3 py-2 bg-[#F4F7FB] border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <span className="text-emerald-600 font-bold">{currentCurrency.symbol}</span>
          <span>{currentCurrency.code}</span>
        </div>

        {/* Quick Add CTA */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}
