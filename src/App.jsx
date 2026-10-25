import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import DashboardView from './components/dashboard/DashboardView';
import TransactionTable from './components/transactions/TransactionTable';
import AnalyticsView from './components/analytics/AnalyticsView';
import AIAnalyticsView from './components/ai/AIAnalyticsView';
import BudgetsView from './components/budget/BudgetsView';
import MLModelLabView from './components/models/MLModelLabView';
import PrivacySecurityView from './components/settings/PrivacySecurityView';
import TransactionModal from './components/transactions/TransactionModal';
import ToastContainer from './components/common/Toast';

function AppContent() {
  const { activeTab } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white pb-16 lg:pb-0">
      {/* 1. Desktop Dark Navy Sidebar (#0B1F3A) */}
      <Sidebar />

      {/* 2. Mobile Drawer Navigation & Bottom Bar */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 7 Pages Routing */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'transactions' && <TransactionTable />}
          {(activeTab === 'analytics' || activeTab === 'reports') && <AnalyticsView />}
          {activeTab === 'ai' && <AIAnalyticsView />}
          {activeTab === 'budgets' && <BudgetsView />}
          {activeTab === 'models' && <MLModelLabView />}
          {(activeTab === 'security' || activeTab === 'settings') && <PrivacySecurityView />}
        </main>
      </div>

      {/* 4. Global Modals and Toasts */}
      <TransactionModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
