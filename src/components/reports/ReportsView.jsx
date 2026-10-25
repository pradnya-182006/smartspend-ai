import React, { useMemo } from 'react';
import {
  Download,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Percent,
  Award,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear, getCategoryMeta } from '../../utils/formatters';
import { exportTransactionsToCSV } from '../../utils/csvHelper';

export default function ReportsView() {
  const {
    transactions,
    metrics,
    currency,
    selectedMonth,
    availableMonths,
    showToast,
  } = useFinance();

  const handleExportCSV = () => {
    try {
      exportTransactionsToCSV(transactions, `finvibe_report_${selectedMonth}.csv`);
      showToast('Transaction report exported to CSV successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const periodIncome = metrics.periodIncome;
  const periodExpenses = metrics.periodExpenses;
  const periodSavings = metrics.periodSavings;
  const savingsRate = metrics.savingsRate;

  // Monthly Comparison Data (Chronological)
  const monthlyData = useMemo(() => {
    const sortedMonths = [...availableMonths].sort();
    return sortedMonths.map((ym) => {
      let income = 0;
      let expenses = 0;

      transactions.forEach((tx) => {
        if (tx.date && tx.date.startsWith(ym)) {
          if (tx.type === 'income') {
            income += Number(tx.amount) || 0;
          } else {
            expenses += Number(tx.amount) || 0;
          }
        }
      });

      const savings = income - expenses;

      return {
        month: formatMonthYear(ym).split(' ')[0],
        fullMonth: formatMonthYear(ym),
        Income: income,
        Expenses: expenses,
        Savings: savings,
      };
    });
  }, [transactions, availableMonths]);

  // Highest Spending Categories Leaderboard
  const sortedCategories = useMemo(() => {
    const spending = metrics.categorySpending;
    const total = metrics.periodExpenses || 1;

    return Object.entries(spending)
      .map(([name, amount]) => {
        const meta = getCategoryMeta(name, 'expense');
        const pct = ((amount / total) * 100).toFixed(1);
        return {
          name,
          amount,
          percentage: parseFloat(pct),
          meta,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [metrics.categorySpending, metrics.periodExpenses]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Export CSV CTA */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-soft-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3 text-emerald-100">
            Analytics & Reports
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Financial Health & Spending Intelligence
          </h2>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
            Detailed insights into your cash flow, category velocity, and monthly net savings rate.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-white text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-all shadow-lg shadow-black/10 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Transactions (CSV)</span>
        </button>
      </div>

      {/* 4 Financial Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Period Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Income ({selectedMonth === 'all' ? 'All' : formatMonthYear(selectedMonth)})
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">
            {formatCurrency(periodIncome, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total incoming credits</p>
        </div>

        {/* 2. Period Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Expenses ({selectedMonth === 'all' ? 'All' : formatMonthYear(selectedMonth)})
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            {formatCurrency(periodExpenses, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total outgoing debits</p>
        </div>

        {/* 3. Net Savings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Net Savings
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold ${
              periodSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'
            }`}
          >
            {periodSavings < 0 ? '-' : '+'}
            {formatCurrency(Math.abs(periodSavings), currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Income minus Expenses</p>
        </div>

        {/* 4. Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {savingsRate.toFixed(1)}%
          </p>
          <div className="mt-1">
            {savingsRate >= 30 ? (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ★ Super Saver
              </span>
            ) : savingsRate > 0 ? (
              <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                ✓ Positive Savings
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                ⚠ Deficit Period
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Multi-metric Comparison Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Historical Monthly Performance
            </h3>
            <p className="text-xs text-slate-400">
              Comparing Income, Expenses, and Net Savings across recorded months
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val, name) => [formatCurrency(val, currency), name]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Highest Spending Categories Leaderboard & Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Highest Spending Categories
              </h3>
              <p className="text-xs text-slate-400">
                Ranked breakdown for {selectedMonth === 'all' ? 'All Time' : formatMonthYear(selectedMonth)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Spent: {formatCurrency(periodExpenses, currency)}
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No expenses recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((cat, index) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                      #{index + 1}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.meta.color }}
                    />
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 min-w-[45px] text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.meta.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
