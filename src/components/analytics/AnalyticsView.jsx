import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart as PieIcon,
  AlertOctagon,
  Download,
  Filter,
  Sparkles,
  Zap,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear, getCategoryMeta } from '../../utils/formatters';
import { exportTransactionsToCSV } from '../../utils/csvHelper';
import { kMeansClustering, dbscanClustering } from '../../utils/advancedMlAlgorithms';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const PALETTE = ['#10B981', '#635BDB', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export default function AnalyticsView() {
  const {
    transactions,
    metrics,
    currency,
    selectedMonth,
    availableMonths,
    showToast,
  } = useFinance();

  const [activeClusterTab, setActiveClusterTab] = useState('kmeans'); // 'kmeans' | 'dbscan'

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const sorted = [...availableMonths].sort();
    return sorted.map((ym) => {
      let income = 0;
      let expenses = 0;
      transactions.forEach((tx) => {
        if (tx.date && tx.date.startsWith(ym)) {
          if (tx.type === 'income') income += Number(tx.amount) || 0;
          else expenses += Number(tx.amount) || 0;
        }
      });
      return {
        month: ym,
        label: formatMonthYear(ym),
        income,
        expenses,
        savings: income - expenses,
      };
    });
  }, [availableMonths, transactions]);

  // Category breakdown for selected filter
  const categoryData = useMemo(() => {
    const filtered = selectedMonth === 'all'
      ? transactions.filter((t) => t.type === 'expense')
      : transactions.filter((t) => t.type === 'expense' && t.date?.startsWith(selectedMonth));

    const totals = {};
    let grandTotal = 0;
    filtered.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + Number(tx.amount);
      grandTotal += Number(tx.amount);
    });

    return Object.entries(totals)
      .map(([name, amount], index) => {
        const meta = getCategoryMeta(name, 'expense');
        return {
          name,
          amount,
          percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
          color: meta.color || PALETTE[index % PALETTE.length],
          icon: meta.icon,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth]);

  // K-Means & DBSCAN preparation from transactions
  const { kmeansResult, dbscanResult } = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    if (!expenseTx.length) {
      return { kmeansResult: null, dbscanResult: null };
    }

    // Map each transaction into 2D features: [Amount, DayOfMonth]
    const dataPoints = expenseTx.map((tx, idx) => {
      const day = tx.date ? parseInt(tx.date.split('-')[2], 10) || 15 : 15;
      return {
        id: idx,
        title: tx.description,
        category: tx.category,
        amount: Number(tx.amount),
        features: [Number(tx.amount) / 500, day], // normalized features
        day,
      };
    });

    const km = kMeansClustering(dataPoints, 3);
    const db = dbscanClustering(dataPoints, 12, 2);

    return { kmeansResult: km, dbscanResult: db };
  }, [transactions]);

  // Scatter plot points for clustering visualization
  const clusterScatterPoints = useMemo(() => {
    if (!kmeansResult || !kmeansResult.clusters) return [];
    return kmeansResult.clusters.flatMap((c, cIdx) =>
      c.members.map((m) => ({
        x: m.day,
        y: m.amount,
        cluster: c.name,
        clusterId: cIdx,
        title: m.title,
        category: m.category,
        fill: PALETTE[cIdx % PALETTE.length],
      }))
    );
  }, [kmeansResult]);

  const handleExport = () => {
    try {
      exportTransactionsToCSV(transactions, `SmartSpend_Analytics_${selectedMonth}.csv`);
      showToast('Analytics transactions exported successfully!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Spending Trends & Cluster Profiling</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-month trend analysis, category velocity, and K-Means/DBSCAN spending segmentation
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Selected Period Inflow</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            +{formatCurrency(metrics.periodIncome, currency)}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            {metrics.savingsRate.toFixed(1)}% savings rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Selected Period Outflow</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            -{formatCurrency(metrics.periodExpenses, currency)}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            {metrics.budgetUsedPercentage.toFixed(0)}% of monthly budget
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Net Saved</span>
          <p className={`text-2xl font-bold mt-1 ${metrics.periodSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.periodSavings >= 0 ? '+' : ''}{formatCurrency(metrics.periodSavings, currency)}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Across {transactions.length} records
          </span>
        </div>
      </div>

      {/* 3. Multi-Month Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Income vs Expenses Historical Velocity</h3>
            <p className="text-xs text-slate-500">Chronological financial trajectory across tracking months</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            {monthlyData.length} Months
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                formatter={(val) => [formatCurrency(val, currency), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Spending Category Share</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatCurrency(val, currency), '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No expense records found for this period</p>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900">Top Expenditure Categories</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatCurrency(cat.amount, currency)}</span>
                  <span className="text-slate-400 ml-2">({cat.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. ML Clustering & Outlier Detection Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                Machine Learning
              </span>
              <h3 className="text-base font-bold text-slate-900">K-Means & DBSCAN Spending Segmentation</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Unsupervised clustering discovers spending archetypes, recurring patterns, and anomalous transactions
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveClusterTab('kmeans')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeClusterTab === 'kmeans'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              K-Means Profiles
            </button>
            <button
              onClick={() => setActiveClusterTab('dbscan')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeClusterTab === 'dbscan'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DBSCAN Anomalies
            </button>
          </div>
        </div>

        {activeClusterTab === 'kmeans' ? (
          <div className="space-y-4">
            {/* Cluster Archetype Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kmeansResult?.clusters?.map((c, i) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Cluster {i + 1}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    >
                      {c.percentage}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                  <p className="text-xs text-slate-500">
                    {c.count} transactions grouped around mean amount of{' '}
                    <strong>{formatCurrency(Math.round(c.centroid[0] * 500), currency)}</strong>.
                  </p>
                </div>
              ))}
            </div>

            {/* Scatter Visualization */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-700">2D Spending Cluster Scatter (Day of Month vs Amount)</span>
              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="x" name="Day of Month" unit="d" domain={[1, 31]} stroke="#94a3b8" />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Amount"
                      stroke="#94a3b8"
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(val, name) => [
                        name === 'Amount' ? formatCurrency(val, currency) : `Day ${val}`,
                        name,
                      ]}
                    />
                    <Scatter name="Transactions" data={clusterScatterPoints}>
                      {clusterScatterPoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>DBSCAN Density Analysis:</strong> Identified{' '}
                <strong>{dbscanResult?.anomaliesCount || 0} anomaly/outlier transactions</strong> that deviate significantly from your typical daily expense cluster density.
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Detected Outlier Transactions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dbscanResult?.anomalies?.slice(0, 6).map((anom, idx) => (
                  <div key={idx} className="p-3 bg-red-50/60 border border-red-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{anom.title || 'Unusual Expense'}</p>
                      <span className="text-[11px] text-slate-500">{anom.category} • Day {anom.day}</span>
                    </div>
                    <span className="font-extrabold text-red-600">
                      {formatCurrency(anom.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
