import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, BarChart2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear, getCategoryMeta } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

// Custom Recharts Tooltip
function CustomTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200/80 rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-semibold text-slate-700">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ChartsSection() {
  const { transactions, metrics, currency, selectedMonth, availableMonths } = useFinance();

  // 1. Data for Income vs Expenses across available months
  const monthlyComparisonData = useMemo(() => {
    // Sort months chronologically
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

      return {
        month: formatMonthYear(ym).split(' ')[0], // e.g. "Oct"
        fullMonth: formatMonthYear(ym),
        Income: income,
        Expenses: expenses,
      };
    });
  }, [transactions, availableMonths]);

  // 2. Spending Trend (Daily accumulation or transaction points for the selected month)
  const spendingTrendData = useMemo(() => {
    const txsInPeriod = metrics.filteredTransactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => a.date.localeCompare(b.date));

    if (txsInPeriod.length === 0) {
      return [
        { date: 'Start', Spending: 0 },
        { date: 'End', Spending: 0 },
      ];
    }

    // Group expenses by date
    const dailyMap = {};
    txsInPeriod.forEach((t) => {
      const d = t.date.substring(5); // '10-04'
      dailyMap[d] = (dailyMap[d] || 0) + Number(t.amount);
    });

    let runningTotal = 0;
    return Object.entries(dailyMap).map(([day, amount]) => {
      runningTotal += amount;
      return {
        date: day,
        DayExpense: amount,
        Spending: runningTotal,
      };
    });
  }, [metrics.filteredTransactions]);

  // 3. Category Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const spending = metrics.categorySpending;
    const entries = Object.entries(spending);

    if (entries.length === 0) {
      return [];
    }

    const totalExpense = metrics.periodExpenses || 1;

    return entries
      .map(([name, value]) => {
        const meta = getCategoryMeta(name, 'expense');
        const percentage = ((value / totalExpense) * 100).toFixed(1);
        return {
          name,
          value,
          percentage,
          color: meta.color,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [metrics.categorySpending, metrics.periodExpenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Chart 1: Income vs Expenses (Bar Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Income vs Expenses</h2>
              <p className="text-[11px] text-slate-400">Monthly cash flow comparison</p>
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          {monthlyComparisonData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No cash flow data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyComparisonData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Income"
                  name="Income"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Cumulative Spending Trend (Area Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Monthly Spending Trend</h2>
              <p className="text-[11px] text-slate-400">Cumulative expenses trajectory</p>
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          {spendingTrendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No expenses recorded in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={spendingTrendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="Spending"
                  name="Cumulative Spent"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 3: Expense Breakdown by Category (Donut Chart) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Category Breakdown</h2>
              <p className="text-[11px] text-slate-400">Distribution of expenses</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {categoryData.length} {categoryData.length === 1 ? 'Category' : 'Categories'}
          </span>
        </div>

        <div className="h-[260px] w-full flex flex-col sm:flex-row items-center justify-center">
          {categoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No expense categories for this period
            </div>
          ) : (
            <>
              <div className="w-full sm:w-1/2 h-[180px] sm:h-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${formatCurrency(val, currency)} (${item.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {formatCurrency(metrics.periodExpenses, currency)}
                  </span>
                </div>
              </div>

              {/* Mini Legend list */}
              <div className="w-full sm:w-1/2 pl-2 max-h-[220px] overflow-y-auto space-y-1.5 text-xs pr-1">
                {categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate text-slate-700 font-medium text-[11px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 text-[11px] shrink-0 ml-1">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
                {categoryData.length > 5 && (
                  <p className="text-[10px] text-slate-400 pt-1 text-center">
                    + {categoryData.length - 5} more categories
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
