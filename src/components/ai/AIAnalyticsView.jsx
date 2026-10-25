import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine, Legend,
} from 'recharts';
import {
  Brain, TrendingUp, TrendingDown, Target, Zap,
  Award, AlertTriangle, CheckCircle, XCircle, Info,
  Activity, GitBranch, Users, Cpu, Shield,
  ChevronRight, Lightbulb, RefreshCw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';
import { computeAIInsights } from '../../utils/mlAlgorithms';

// ── Custom Tooltip ──────────────────────────────────────────
function MLTooltip({ active, payload, label, currency = 'INR' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-700">{label}</p>
        {payload.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color || e.fill || '#10b981' }} />
            <span className="text-slate-500">{e.name}:</span>
            <span className="font-bold text-slate-800">{formatCurrency(e.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Health Score Ring ─────────────────────────────────────────
function HealthScoreRing({ score, grade, currency }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
        <circle
          cx="90" cy="90" r={radius} fill="none"
          stroke={grade.color} strokeWidth="16"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black" style={{ color: grade.color }}>{score}</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">/100</span>
        <span className="text-sm font-bold mt-1" style={{ color: grade.color }}>{grade.grade}</span>
        <span className="text-[11px] text-slate-400">{grade.label}</span>
      </div>
    </div>
  );
}

// ── Alert Badge ──────────────────────────────────────────────
function AlertBadge({ alert }) {
  const styles = {
    danger: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${styles[alert.type] || styles.info}`}>
      <span className="text-lg leading-none">{alert.icon}</span>
      <span>{alert.message}</span>
    </div>
  );
}

// ── Probability Bar ─────────────────────────────────────────
function ProbabilityBar({ value, label, color }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600', badge }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Decision Tree Node Visualizer ────────────────────────────
function TreeRuleCard({ rule, index }) {
  const labelColors = {
    'Over Budget': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: '#ef4444' },
    'Near Budget': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: '#f59e0b' },
    'Under Budget': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#10b981' },
  };
  const style = labelColors[rule.prediction] || labelColors['Near Budget'];

  return (
    <div className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
          {rule.prediction}
        </span>
        <span className="text-[10px] text-slate-400">({rule.count} months)</span>
      </div>
      {rule.conditions.length > 0 && (
        <div className="space-y-0.5">
          {rule.conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AI Analytics View ───────────────────────────────────
export default function AIAnalyticsView() {
  const { transactions, metrics, currency, monthlyBudget, savingsGoal = 20000 } = useFinance();
  const [activeAlgo, setActiveAlgo] = useState('overview');

  const aiInsights = useMemo(() => {
    return computeAIInsights(transactions, savingsGoal, monthlyBudget);
  }, [transactions, savingsGoal, monthlyBudget]);

  if (!aiInsights.hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Brain className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">No Data for AI Analysis</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Add at least 2 months of transactions to unlock ML-powered predictions and financial habit analysis.
        </p>
      </div>
    );
  }

  const {
    monthly, linearRegression, polynomialRegression: polyReg,
    logisticRegression: logReg, knn: knnResult,
    decisionTree: dt, healthScore, healthGrade,
    budgetAlerts, stats,
  } = aiInsights;

  // Chart data for monthly bar
  const monthlyChartData = monthly.map((m, i) => ({
    month: formatMonthYear(m.yearMonth).split(' ')[0],
    Income: m.income,
    Expenses: m.expenses,
    Savings: Math.max(0, m.savings),
  }));

  // Polynomial trend chart data
  const trendChartData = polyReg.trendPoints.map(p => ({
    index: `M${p.index}`,
    Actual: p.actual != null ? Math.round(p.actual) : null,
    Trend: Math.round(p.trend),
  }));

  // Radar chart data for spending profile
  const radarData = dt.topFactors.slice(0, 6).map(f => ({
    subject: f.name.replace('%', ''),
    value: Math.round(f.percentage),
  }));

  const ALGO_TABS = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'linear', label: 'Linear Reg', icon: TrendingUp },
    { id: 'polynomial', label: 'Poly Trend', icon: Activity },
    { id: 'logistic', label: 'Logistic', icon: Target },
    { id: 'knn', label: 'KNN', icon: Users },
    { id: 'tree', label: 'Decision Tree', icon: GitBranch },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="relative bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-soft-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full border-2 border-white/30" />
          <div className="absolute -bottom-8 -left-4 w-56 h-56 rounded-full border-2 border-white/20" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/10" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5" />
              ML-Powered Financial Intelligence
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Smart Expense Analyzer
            </h2>
            <p className="text-indigo-200 text-sm mt-1.5 max-w-lg">
              Advanced ML algorithms — Linear, Polynomial & Logistic Regression, KNN, Decision Tree —
              analyzing your financial habits and predicting future trends.
            </p>
          </div>

          {/* Health Score Preview */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shrink-0">
            <div className="text-center">
              <div className="text-4xl font-black" style={{ color: healthGrade.color === '#10b981' ? '#34d399' : '#fbbf24' }}>
                {healthScore}
              </div>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Health Score</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">{healthGrade.grade}</div>
              <div className="text-xs text-white/70">{healthGrade.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Budget Alerts
          </h3>
          {budgetAlerts.map((alert, i) => <AlertBadge key={i} alert={alert} />)}
        </div>
      )}

      {/* Algorithm Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {ALGO_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeAlgo === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAlgo(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'overview' && (
        <div className="space-y-5">
          {/* Financial Health Score Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={Shield}
              title="Monthly Financial Health Score"
              subtitle="Composite score based on savings rate, budget control, goal probability & expense trend"
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              badge={`${monthly.length} months analyzed`}
            />
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <HealthScoreRing score={healthScore} grade={healthGrade} />
              <div className="flex-1 w-full space-y-4">
                <ProbabilityBar
                  label="Savings Rate Score"
                  value={Math.min(1, stats.currentSavingsRate / 40)}
                  color="#10b981"
                />
                <ProbabilityBar
                  label="Budget Control Score"
                  value={Math.max(0, 1 - stats.currentBudgetUsed / 100)}
                  color="#6366f1"
                />
                <ProbabilityBar
                  label="Savings Goal Probability"
                  value={logReg.savingsAchieveProbability}
                  color="#f59e0b"
                />
                <ProbabilityBar
                  label="Expense Trend Score"
                  value={linearRegression.model.slope <= 0 ? 1 : Math.max(0, 1 - linearRegression.model.slope / (stats.avgMonthlyExpense || 1))}
                  color="#0ea5e9"
                />
              </div>
            </div>
          </div>

          {/* 4 Key AI Predictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Month Expense</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-rose-600">{formatCurrency(linearRegression.nextMonthExpense, currency)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Linear Regression prediction</p>
              <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                linearRegression.trendDirection === 'increasing'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}>
                {linearRegression.trendDirection === 'increasing' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {linearRegression.trendDirection}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savings Goal</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: logReg.willAchieveSavings ? '#10b981' : '#ef4444' }}>
                {(logReg.savingsAchieveProbability * 100).toFixed(0)}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Probability of achieving goal</p>
              <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                logReg.willAchieveSavings ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {logReg.willAchieveSavings ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {logReg.willAchieveSavings ? 'Achievable' : 'At Risk'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spending Profile</span>
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-extrabold text-slate-900 leading-tight">
                {knnResult.closestProfile?.label || '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">KNN nearest neighbor match</p>
              <div className="mt-2 text-xl">{knnResult.closestProfile?.emoji || '🔍'}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget Status</span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <GitBranch className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{dt.spendingCategory}</p>
              <p className="text-[11px] text-slate-400 mt-1">Decision Tree classification</p>
              <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                dt.spendingCategory === 'Over Budget'
                  ? 'bg-red-50 text-red-700'
                  : dt.spendingCategory === 'Near Budget'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {dt.spendingCategory === 'Over Budget' ? '🚨' : dt.spendingCategory === 'Near Budget' ? '⚠️' : '✅'}
                {dt.spendingCategory}
              </div>
            </div>
          </div>

          {/* Monthly Overview Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={BarChart}
              title="Monthly Income vs Expenses vs Savings"
              subtitle="Historical performance across all recorded months"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<MLTooltip currency={currency} />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: LINEAR REGRESSION                              */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'linear' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={TrendingUp}
              title="Linear Regression — Expense & Savings Prediction"
              subtitle="Simple linear model: y = m·x + b, predicts next month's expenses from historical trend"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              badge={`R² = ${(linearRegression.model.r2 * 100).toFixed(1)}%`}
            />

            {/* Model Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Slope (m)', value: `₹${linearRegression.model.slope.toFixed(0)}/mo`, color: 'text-blue-600' },
                { label: 'Intercept (b)', value: `₹${linearRegression.model.intercept.toFixed(0)}`, color: 'text-purple-600' },
                { label: 'R² Score', value: `${(linearRegression.model.r2 * 100).toFixed(1)}%`, color: 'text-indigo-600' },
                { label: 'Trend', value: linearRegression.trendDirection, color: linearRegression.trendDirection === 'increasing' ? 'text-red-600' : 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Actual vs Predicted Chart */}
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthly.map((m, i) => ({
                    month: formatMonthYear(m.yearMonth).split(' ')[0],
                    Actual: m.expenses,
                    Predicted: Math.max(0, Math.round(linearRegression.model.predict(i + 1))),
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<MLTooltip currency={currency} />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                  <Line type="monotone" dataKey="Actual" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Actual Expenses" />
                  <Line type="monotone" dataKey="Predicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Linear Prediction" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Next Month Prediction Box */}
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-indigo-900">Next Month Prediction</p>
                <p className="text-xs text-indigo-600 mt-0.5">Based on linear trend (y = {linearRegression.model.slope.toFixed(0)}·x + {linearRegression.model.intercept.toFixed(0)})</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-indigo-700">{formatCurrency(linearRegression.nextMonthExpense, currency)}</p>
                <p className="text-xs text-indigo-500">Predicted Expense</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(linearRegression.nextMonthSavings, currency)}</p>
                <p className="text-xs text-emerald-500">Expected Savings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: POLYNOMIAL REGRESSION                          */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'polynomial' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={Activity}
              title="Polynomial Regression — Spending Trend Curve"
              subtitle="Degree-2 polynomial model: y = a·x² + b·x + c — captures curved spending trends better than linear"
              iconBg="bg-fuchsia-50"
              iconColor="text-fuchsia-600"
              badge={`R² = ${(polyReg.model.r2 * 100).toFixed(1)}%`}
            />

            {/* Coefficients */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['a (quadratic)', 'b (linear)', 'c (constant)']).map((name, i) => (
                <div key={name} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-lg font-extrabold text-fuchsia-600">{polyReg.model.coeffs[i + (i === 0 ? 2 : i === 1 ? 0 : -2)] !== undefined
                    ? polyReg.model.coeffs[2 - i]?.toFixed(1) || '0' : '0'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{name}</p>
                </div>
              ))}
            </div>

            {/* Polynomial Trend Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="polyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<MLTooltip currency={currency} />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                  <Area type="monotone" dataKey="Actual" stroke="#ef4444" strokeWidth={2.5}
                    fillOpacity={1} fill="url(#actualGrad)" dot={{ r: 4 }} name="Actual Expense"
                    connectNulls={false} />
                  <Area type="monotone" dataKey="Trend" stroke="#a855f7" strokeWidth={2.5}
                    strokeDasharray="6 2" fillOpacity={1} fill="url(#polyGrad)"
                    dot={{ r: 3 }} name="Polynomial Trend (forecast)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-fuchsia-50 border border-fuchsia-100">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-fuchsia-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-fuchsia-900">Polynomial Insight</p>
                  <p className="text-xs text-fuchsia-700 mt-0.5">
                    {polyReg.model.coeffs[2] > 0
                      ? 'Spending is accelerating (upward curve). Expenses are growing faster each month — take action now!'
                      : polyReg.model.coeffs[2] < 0
                      ? 'Spending is decelerating (downward curve). You\'re gaining control over your expenses!'
                      : 'Spending follows an approximately linear pattern with no acceleration or deceleration.'}
                    {' '}R² = {(polyReg.model.r2 * 100).toFixed(1)}% (model fit quality).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: LOGISTIC REGRESSION                            */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'logistic' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={Target}
              title="Logistic Regression — Savings Target Classification"
              subtitle="Binary classifier: Will you achieve your savings goal this month? P(achieve) using sigmoid function"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              badge={`Accuracy: ${(logReg.model.accuracy * 100).toFixed(0)}%`}
            />

            {/* Big probability display */}
            <div className="flex flex-col items-center py-6">
              <div
                className="relative w-44 h-44 rounded-full flex items-center justify-center border-8 mb-4"
                style={{
                  borderColor: logReg.willAchieveSavings ? '#10b981' : '#ef4444',
                  background: `conic-gradient(${logReg.willAchieveSavings ? '#10b981' : '#ef4444'} ${logReg.savingsAchieveProbability * 360}deg, #f1f5f9 0deg)`
                }}
              >
                <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-4xl font-black" style={{ color: logReg.willAchieveSavings ? '#10b981' : '#ef4444' }}>
                    {(logReg.savingsAchieveProbability * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-bold text-slate-500 mt-1">Probability</span>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm ${
                logReg.willAchieveSavings
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {logReg.willAchieveSavings
                  ? <><CheckCircle className="w-4 h-4" /> Savings Goal Likely Achievable!</>
                  : <><XCircle className="w-4 h-4" /> Savings Goal At Risk</>
                }
              </div>
            </div>

            {/* Feature Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Savings Rate', value: `${logReg.currentFeatures.savingsRate.toFixed(1)}%`, color: 'text-emerald-600', threshold: '≥20% ideal' },
                { label: 'Expense Growth', value: `${logReg.currentFeatures.expenseGrowth.toFixed(1)}%`, color: 'text-rose-600', threshold: '<10% ideal' },
                { label: 'Income Stability', value: `${logReg.currentFeatures.incomeStability.toFixed(0)}%`, color: 'text-blue-600', threshold: '≥90% ideal' },
                { label: 'Budget Used', value: `${logReg.currentFeatures.budgetUsed.toFixed(1)}%`, color: 'text-amber-600', threshold: '<80% ideal' },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-xl p-4">
                  <p className={`text-xl font-extrabold ${f.color}`}>{f.value}</p>
                  <p className="text-[11px] text-slate-700 font-semibold mt-1">{f.label}</p>
                  <p className="text-[10px] text-slate-400">{f.threshold}</p>
                </div>
              ))}
            </div>

            {/* Logistic explanation */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">How Logistic Regression Works</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    The model learns from your historical monthly data: savings rate, expense growth, income stability,
                    and budget utilization. Using the sigmoid function σ(z) = 1/(1+e⁻ᶻ), it outputs a probability
                    between 0 and 1 of achieving your savings goal of {formatCurrency(savingsGoal, currency)}/month.
                    Model accuracy: {(logReg.model.accuracy * 100).toFixed(0)}%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: KNN                                            */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'knn' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={Users}
              title="K-Nearest Neighbors — Similar Spending Profiles"
              subtitle="KNN finds the 3 closest spending archetypes using Euclidean distance in feature space"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              badge="k = 3"
            />

            {/* Your feature vector */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Current Spending Vector</p>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {['Total', 'Food', 'Shopping', 'Bills', 'Entertain', 'Health', 'Transport'].map((label, i) => (
                  <div key={label} className="text-center">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(knnResult.query[i] || 0, currency)}</p>
                    <p className="text-[10px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar chart */}
            <div className="h-[250px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar name="Your Profile" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 3 KNN Matches */}
            <div className="space-y-4">
              {knnResult.results.map((profile, index) => (
                <div
                  key={profile.label}
                  className={`p-5 rounded-2xl border transition-all ${
                    index === 0
                      ? 'border-orange-200 bg-orange-50/60'
                      : 'border-slate-100 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0">{profile.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900">{profile.label}</p>
                        {index === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            Closest Match
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-auto">
                          Distance: {profile.distance.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{profile.description}</p>
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-slate-700">{profile.tip}</p>
                      </div>
                    </div>
                  </div>
                  {/* Similarity bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Similarity</span>
                      <span>{Math.max(0, 100 - profile.distance * 30).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, 100 - profile.distance * 30).toFixed(0)}%`,
                          backgroundColor: profile.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: DECISION TREE                                  */}
      {/* ════════════════════════════════════════════════════ */}
      {activeAlgo === 'tree' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
            <SectionHeader
              icon={GitBranch}
              title="Decision Tree — Spending Factor Analysis"
              subtitle="CART algorithm with Gini impurity identifies which expense categories drive over-budget months"
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              badge="Max Depth 3"
            />

            {/* Current Prediction */}
            <div className={`mb-6 p-5 rounded-2xl flex items-center gap-4 ${
              dt.spendingCategory === 'Over Budget'
                ? 'bg-red-50 border border-red-200'
                : dt.spendingCategory === 'Near Budget'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-emerald-50 border border-emerald-200'
            }`}>
              <span className="text-4xl">
                {dt.spendingCategory === 'Over Budget' ? '🚨' : dt.spendingCategory === 'Near Budget' ? '⚠️' : '✅'}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-700">Current Month Classification</p>
                <p className={`text-xl font-black mt-0.5 ${
                  dt.spendingCategory === 'Over Budget'
                    ? 'text-red-700'
                    : dt.spendingCategory === 'Near Budget'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}>{dt.spendingCategory}</p>
              </div>
            </div>

            {/* Category feature breakdown */}
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-700 mb-3">Expense Category Distribution (% of total)</p>
              <div className="space-y-3">
                {dt.topFactors.map(f => (
                  <div key={f.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>{f.name.replace('%', '')}</span>
                      <span className="text-slate-900">{f.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, f.percentage)}%`,
                          backgroundColor: f.percentage > 35 ? '#ef4444' : f.percentage > 25 ? '#f59e0b' : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Rules */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                Decision Rules Extracted from Tree
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dt.rules.slice(0, 6).map((rule, i) => (
                  <TreeRuleCard key={i} rule={rule} index={i} />
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-teal-900">How the Decision Tree Works</p>
                  <p className="text-xs text-teal-700 mt-0.5">
                    The tree is built using CART algorithm with Gini impurity as the splitting criterion.
                    At each node, it finds the category percentage threshold that best separates
                    "Over Budget", "Near Budget", and "Under Budget" months.
                    The tree has a max depth of 3 to avoid overfitting on limited data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category-wise Analysis (always visible at bottom) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
        <SectionHeader
          icon={Award}
          title="Category-wise Spending Analysis"
          subtitle="Detailed breakdown of expense categories for the current period"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(monthly[monthly.length - 1]?.categories || {})
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => {
              const pct = ((amount / (monthly[monthly.length - 1]?.expenses || 1)) * 100).toFixed(1);
              const colors = {
                Food: { bg: '#fff7ed', text: '#c2410c', bar: '#f97316' },
                Transport: { bg: '#f0f9ff', text: '#0369a1', bar: '#0ea5e9' },
                Shopping: { bg: '#fdf2f8', text: '#9d174d', bar: '#ec4899' },
                Bills: { bg: '#fffbeb', text: '#92400e', bar: '#f59e0b' },
                Entertainment: { bg: '#f5f3ff', text: '#5b21b6', bar: '#8b5cf6' },
                Health: { bg: '#fff1f2', text: '#9f1239', bar: '#ef4444' },
                Education: { bg: '#f0fdfa', text: '#065f46', bar: '#06b6d4' },
              };
              const c = colors[cat] || { bg: '#f8fafc', text: '#475569', bar: '#64748b' };
              return (
                <div key={cat} className="p-4 rounded-xl border" style={{ backgroundColor: c.bg, borderColor: c.bar + '40' }}>
                  <p className="text-sm font-bold" style={{ color: c.text }}>{cat}</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(amount, currency)}</p>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.bar }} />
                  </div>
                  <p className="text-[11px] mt-1 font-semibold" style={{ color: c.text }}>{pct}% of total</p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
