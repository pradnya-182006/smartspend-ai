import React, { useMemo, useState } from 'react';
import BudgetOverview from './BudgetOverview';
import CategoryBudgets from './CategoryBudgets';
import { useFinance } from '../../context/FinanceContext';
import { simulateQLearningBudgetAgent } from '../../utils/advancedMlAlgorithms';
import { formatCurrency } from '../../utils/formatters';
import { Brain, Sparkles, TrendingUp, ShieldCheck, Zap, Target } from 'lucide-react';

export default function BudgetsView() {
  const { metrics, monthlyBudget, savingsGoal, currency } = useFinance();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const qResult = useMemo(() => {
    return simulateQLearningBudgetAgent(metrics.periodIncome || 50000, metrics.periodExpenses || 35000, {});
  }, [metrics.periodIncome, metrics.periodExpenses]);

  const savingsGoalProgress = Math.min(
    100,
    Math.round(((metrics.periodSavings || 0) / (savingsGoal || 1)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* 1. Overall Monthly Budget Card & Alert Banners */}
      <BudgetOverview />

      {/* 2. Monthly Savings Goal Tracker & Milestones */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Savings Goal Progress</h3>
              <p className="text-xs text-slate-500">
                Target: {formatCurrency(savingsGoal, currency)} • Current Net Saved: {formatCurrency(metrics.periodSavings, currency)}
              </p>
            </div>
          </div>

          <span className="text-sm font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            {savingsGoalProgress}% Achieved
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
            style={{ width: `${Math.max(0, savingsGoalProgress)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>₹0</span>
          <span>{formatCurrency(savingsGoal * 0.5, currency)} (50% Milestone)</span>
          <span>{formatCurrency(savingsGoal, currency)} (Target)</span>
        </div>
      </div>

      {/* 3. Reinforcement Learning Q-Agent Budget Optimizer */}
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#122444] rounded-2xl p-6 text-white border border-[#1d355c] shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Reinforcement Learning (Exp 11)
                </span>
                <span className="text-xs text-slate-400">Q-Learning Agent</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Simulated Adaptive Budget Optimization Policy
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsOptimizing(true);
                setTimeout(() => setIsOptimizing(false), 600);
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isOptimizing ? 'Simulating Episodes...' : 'Re-run RL Policy'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          An agent trained in a Markov Decision Process (MDP) spending environment allocates daily category budgets dynamically. By throttling non-essential discretionary velocity mid-month, it unlocks an estimated{' '}
          <strong className="text-emerald-400 font-bold">
            +{formatCurrency(qResult.simulatedMonthlyGain, currency)}
          </strong>{' '}
          in surplus monthly savings.
        </p>

        {/* Policy Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {qResult.recommendedPolicy.map((p, i) => (
            <div key={p.state} className="bg-[#071428]/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{p.state}</span>
              <span className="text-xs font-bold text-emerald-400 block">{p.bestAction.name}</span>
              <p className="text-[11px] text-slate-300">{p.bestAction.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Category-level Spending Limits Grid */}
      <CategoryBudgets />
    </div>
  );
}
