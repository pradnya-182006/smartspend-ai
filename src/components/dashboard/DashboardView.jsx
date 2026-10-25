import React, { useMemo } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import SummaryCards from './SummaryCards';
import ChartsSection from './ChartsSection';
import RecentTransactions from './RecentTransactions';
import { useFinance } from '../../context/FinanceContext';
import { computeAIInsights } from '../../utils/mlAlgorithms';
import { formatCurrency } from '../../utils/formatters';

export default function DashboardView() {
  const { transactions, monthlyBudget, savingsGoal, currency, setActiveTab } = useFinance();

  // Compute AI insights dynamically from user's live data
  const aiInsights = useMemo(() => {
    try {
      return computeAIInsights(transactions, monthlyBudget, savingsGoal);
    } catch {
      return null;
    }
  }, [transactions, monthlyBudget, savingsGoal]);

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards (Income, Expenses, Net Savings, Budget Used) */}
      <SummaryCards />

      {/* 2. AI Insight Banner Panel (Highlighted in User Wireframe) */}
      {aiInsights && aiInsights.hasData && (
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#122444] rounded-2xl p-5 sm:p-6 text-white border border-[#1d355c] shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#635BDB] flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  SmartSpend AI Insight
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  Health: {aiInsights.healthScore}/100 ({aiInsights.healthGrade.grade})
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {aiInsights.linearRegression.trendDirection === 'increasing'
                  ? `Spending is trending upward by ~${formatCurrency(Math.abs(aiInsights.linearRegression.model.slope), currency)}/mo`
                  : aiInsights.linearRegression.trendDirection === 'decreasing'
                  ? `Great financial pacing! Expenses are trending down by ${formatCurrency(Math.abs(aiInsights.linearRegression.model.slope), currency)}/mo`
                  : 'Spending pace is stable and well within predictive bounds'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {aiInsights.logisticRegression.savingsAchieveProbability >= 0.6
                  ? `Logistic model predicts high probability (${(aiInsights.logisticRegression.savingsAchieveProbability * 100).toFixed(0)}%) of achieving your monthly savings goal of ${formatCurrency(savingsGoal, currency)}.`
                  : `Logistic model flags low savings goal probability (${(aiInsights.logisticRegression.savingsAchieveProbability * 100).toFixed(0)}%). Consider curbing top category spending to secure target.`}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setActiveTab('ai')}
                className="px-4 py-2.5 bg-gradient-to-r from-[#635BDB] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center space-x-1.5 hover:scale-[1.02]"
              >
                <span>View Full AI Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Decorative glowing gradient blur */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#635BDB]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/3 w-32 h-32 bg-[#10B981]/15 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* 3. Main Charts Section (Monthly Trends & Category Breakdown) */}
      <ChartsSection />

      {/* 4. Recent Transactions Table */}
      <RecentTransactions />
    </div>
  );
}
