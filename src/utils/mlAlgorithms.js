/**
 * mlAlgorithms.js
 * Pure JavaScript implementation of ML algorithms for financial analysis.
 * No external ML library needed — runs entirely in the browser.
 *
 * Algorithms:
 *  1. Linear Regression          — predict next month expenses/savings
 *  2. Multiple Linear Regression — multiple features → expense estimate
 *  3. Polynomial Regression      — spending trends (curved fit)
 *  4. Logistic Regression        — savings target achievability classification
 *  5. K-Nearest Neighbors (KNN)  — find similar spending profiles
 *  6. Decision Tree              — factors driving high spending
 */

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Mean of array */
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Standard deviation */
function std(arr) {
  if (arr.length < 2) return 1;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1;
}

/** Dot product */
function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

/** Euclidean distance */
function euclidean(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

/** Sigmoid function */
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// ─────────────────────────────────────────────────────────
// 1. SIMPLE LINEAR REGRESSION
//    Fits y = m*x + b on (x[], y[]) data
//    Returns: { slope, intercept, r2, predict(x) }
// ─────────────────────────────────────────────────────────
export function simpleLinearRegression(xs, ys) {
  if (!xs || xs.length < 2 || xs.length !== ys.length) {
    return { slope: 0, intercept: mean(ys || [0]), r2: 0, predict: (x) => mean(ys || [0]) };
  }

  const n = xs.length;
  const xMean = mean(xs);
  const yMean = mean(ys);

  let ssXY = 0, ssXX = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - xMean) * (ys[i] - yMean);
    ssXX += (xs[i] - xMean) ** 2;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;

  // R² (coefficient of determination)
  const yHats = xs.map(x => slope * x + intercept);
  const ssRes = ys.reduce((s, y, i) => s + (y - yHats[i]) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return {
    slope,
    intercept,
    r2,
    predict: (x) => slope * x + intercept,
  };
}

// ─────────────────────────────────────────────────────────
// 2. POLYNOMIAL REGRESSION (degree 2 — quadratic)
//    Fits y = a*x² + b*x + c using least squares via matrix normal equation
//    Returns: { coeffs [a,b,c], r2, predict(x) }
// ─────────────────────────────────────────────────────────
export function polynomialRegression(xs, ys, degree = 2) {
  if (!xs || xs.length < degree + 1) {
    const m = mean(ys || [0]);
    const coeffs = new Array(degree + 1).fill(0);
    coeffs[0] = m;
    return { coeffs, r2: 0, predict: () => m };
  }

  const n = xs.length;
  const d = degree + 1;

  // Build Vandermonde matrix X (n x d) and X^T X, X^T y
  const X = xs.map(x => Array.from({ length: d }, (_, k) => x ** k));
  
  // X^T X (d x d)
  const XtX = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0)
    )
  );
  
  // X^T y (d x 1)
  const Xty = Array.from({ length: d }, (_, i) =>
    X.reduce((s, row, ri) => s + row[i] * ys[ri], 0)
  );

  // Solve XtX * coeffs = Xty using Gaussian elimination
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < d; col++) {
    let maxRow = col;
    for (let r = col + 1; r < d; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) continue;
    for (let r = 0; r < d; r++) {
      if (r !== col) {
        const factor = aug[r][col] / pivot;
        for (let c = col; c <= d; c++) {
          aug[r][c] -= factor * aug[col][c];
        }
      }
    }
    for (let c = col; c <= d; c++) aug[col][c] /= pivot;
  }
  const coeffs = aug.map(row => row[d]);

  const predict = (x) => coeffs.reduce((s, c, k) => s + c * x ** k, 0);

  // R²
  const yHats = xs.map(predict);
  const yMean = mean(ys);
  const ssRes = ys.reduce((s, y, i) => s + (y - yHats[i]) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { coeffs, r2, predict };
}

// ─────────────────────────────────────────────────────────
// 3. LOGISTIC REGRESSION
//    Binary classification: will savings target be achieved?
//    features: [savingsRate, expenseGrowthRate, incomeStability, budgetUsed%]
//    label: 1 if savingsTarget achieved, 0 otherwise
//    Returns: { weights, predict(features) → probability 0-1 }
// ─────────────────────────────────────────────────────────
export function logisticRegression(samples, labels, options = {}) {
  const { lr = 0.1, epochs = 1000 } = options;
  
  if (!samples || samples.length < 2) {
    return {
      weights: [],
      bias: 0,
      predict: (f) => 0.5,
      accuracy: 0,
    };
  }

  const n = samples.length;
  const featureCount = samples[0].length;
  let w = new Array(featureCount).fill(0);
  let b = 0;

  // Normalize features
  const featureMeans = Array.from({ length: featureCount }, (_, fi) =>
    mean(samples.map(s => s[fi]))
  );
  const featureStds = Array.from({ length: featureCount }, (_, fi) =>
    std(samples.map(s => s[fi]))
  );
  const normalized = samples.map(s =>
    s.map((v, fi) => (v - featureMeans[fi]) / featureStds[fi])
  );

  // Gradient descent
  for (let e = 0; e < epochs; e++) {
    const gradW = new Array(featureCount).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      const z = dot(w, normalized[i]) + b;
      const pred = sigmoid(z);
      const err = pred - labels[i];
      for (let fi = 0; fi < featureCount; fi++) {
        gradW[fi] += err * normalized[i][fi];
      }
      gradB += err;
    }
    for (let fi = 0; fi < featureCount; fi++) {
      w[fi] -= (lr / n) * gradW[fi];
    }
    b -= (lr / n) * gradB;
  }

  const predict = (features) => {
    const normF = features.map((v, fi) => (v - featureMeans[fi]) / featureStds[fi]);
    return sigmoid(dot(w, normF) + b);
  };

  // Accuracy
  const correct = normalized.filter((s, i) => {
    const z = dot(w, s) + b;
    return (sigmoid(z) >= 0.5 ? 1 : 0) === labels[i];
  }).length;

  return {
    weights: w,
    bias: b,
    featureMeans,
    featureStds,
    predict,
    accuracy: correct / n,
  };
}

// ─────────────────────────────────────────────────────────
// 4. K-NEAREST NEIGHBORS (KNN)
//    Find users/months with similar spending patterns
//    Returns top-k nearest profiles with distances
// ─────────────────────────────────────────────────────────
export function knn(queryPoint, dataset, k = 3, labelKey = 'label') {
  if (!dataset || dataset.length === 0) return [];

  // Normalize each feature dimension
  const featureCount = queryPoint.length;
  const featureMeans = Array.from({ length: featureCount }, (_, fi) =>
    mean(dataset.map(d => d.features[fi] || 0))
  );
  const featureStds = Array.from({ length: featureCount }, (_, fi) =>
    std(dataset.map(d => d.features[fi] || 0))
  );

  const normalize = (v, fi) => (v - featureMeans[fi]) / (featureStds[fi] || 1);

  const normQuery = queryPoint.map((v, fi) => normalize(v, fi));

  const distances = dataset.map(item => {
    const normItem = item.features.map((v, fi) => normalize(v, fi));
    return {
      ...item,
      distance: euclidean(normQuery, normItem),
    };
  });

  return distances.sort((a, b) => a.distance - b.distance).slice(0, k);
}

// ─────────────────────────────────────────────────────────
// 5. DECISION TREE (simplified CART — depth 3)
//    Identifies which expense categories drive overspending
//    Returns a human-readable tree of rules + predictions
// ─────────────────────────────────────────────────────────

function gini(labels) {
  const n = labels.length;
  if (!n) return 0;
  const counts = {};
  labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
  return 1 - Object.values(counts).reduce((s, c) => s + (c / n) ** 2, 0);
}

function bestSplit(data, features) {
  let bestGain = -Infinity;
  let bestFeature = null;
  let bestThreshold = null;

  const labels = data.map(d => d.label);
  const parentGini = gini(labels);

  for (const f of features) {
    const values = [...new Set(data.map(d => d.features[f]))].sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;
      const left = data.filter(d => d.features[f] <= threshold);
      const right = data.filter(d => d.features[f] > threshold);
      if (!left.length || !right.length) continue;

      const leftGini = gini(left.map(d => d.label));
      const rightGini = gini(right.map(d => d.label));
      const weightedGini =
        (left.length / data.length) * leftGini +
        (right.length / data.length) * rightGini;
      const gain = parentGini - weightedGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = f;
        bestThreshold = threshold;
      }
    }
  }
  return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
}

function buildTree(data, features, depth = 0, maxDepth = 3) {
  const labels = data.map(d => d.label);
  const counts = {};
  labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
  const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (depth >= maxDepth || labels.every(l => l === labels[0]) || data.length < 3) {
    return { type: 'leaf', prediction: majority, count: data.length };
  }

  const { feature, threshold, gain } = bestSplit(data, features);
  if (feature === null || gain <= 0) {
    return { type: 'leaf', prediction: majority, count: data.length };
  }

  const left = data.filter(d => d.features[feature] <= threshold);
  const right = data.filter(d => d.features[feature] > threshold);

  return {
    type: 'node',
    feature,
    threshold,
    gain,
    left: buildTree(left, features, depth + 1, maxDepth),
    right: buildTree(right, features, depth + 1, maxDepth),
    count: data.length,
  };
}

function predictTree(node, features) {
  if (node.type === 'leaf') return node.prediction;
  if (features[node.feature] <= node.threshold) {
    return predictTree(node.left, features);
  }
  return predictTree(node.right, features);
}

export function decisionTree(trainingData, featureNames, maxDepth = 3) {
  if (!trainingData || trainingData.length < 4) {
    return {
      tree: { type: 'leaf', prediction: 'Moderate', count: 0 },
      predict: () => 'Moderate',
      featureNames,
    };
  }

  const features = Array.from({ length: featureNames.length }, (_, i) => i);
  const tree = buildTree(trainingData, features, 0, maxDepth);

  return {
    tree,
    featureNames,
    predict: (featureValues) => predictTree(tree, featureValues),
    extractRules: () => extractRules(tree, featureNames, []),
  };
}

function extractRules(node, featureNames, conditions) {
  if (node.type === 'leaf') {
    return [{ conditions: [...conditions], prediction: node.prediction, count: node.count }];
  }
  const fname = featureNames[node.feature] || `Feature${node.feature}`;
  return [
    ...extractRules(node.left, featureNames, [...conditions, `${fname} ≤ ${node.threshold.toFixed(0)}`]),
    ...extractRules(node.right, featureNames, [...conditions, `${fname} > ${node.threshold.toFixed(0)}`]),
  ];
}

// ─────────────────────────────────────────────────────────
// HIGH-LEVEL: Prepare monthly data from transactions
// ─────────────────────────────────────────────────────────

/**
 * Aggregates raw transactions into per-month summaries.
 * Returns array of { yearMonth, income, expenses, savings, categories }
 */
export function getMonthlyAggregates(transactions) {
  const map = {};
  transactions.forEach(tx => {
    if (!tx.date) return;
    const ym = tx.date.substring(0, 7);
    if (!map[ym]) {
      map[ym] = { yearMonth: ym, income: 0, expenses: 0, savings: 0, categories: {} };
    }
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      map[ym].income += amt;
    } else {
      map[ym].expenses += amt;
      const cat = tx.category || 'Other';
      map[ym].categories[cat] = (map[ym].categories[cat] || 0) + amt;
    }
  });

  return Object.values(map)
    .map(m => ({ ...m, savings: m.income - m.expenses }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * Compute full AI analysis from monthly aggregates.
 * Returns all predictions and insights.
 */
export function computeAIInsights(transactions, savingsGoal = 20000, monthlyBudget = 45000) {
  const monthly = getMonthlyAggregates(transactions);
  const n = monthly.length;

  if (n === 0) {
    return { hasData: false };
  }

  const xs = monthly.map((_, i) => i + 1); // 1, 2, 3, ...
  const expenseYs = monthly.map(m => m.expenses);
  const savingsYs = monthly.map(m => m.savings);
  const incomeYs = monthly.map(m => m.income);

  // ── 1. Linear Regression: Expense Prediction ──────────────
  const expenseLR = simpleLinearRegression(xs, expenseYs);
  const nextMonthExpense = Math.max(0, expenseLR.predict(n + 1));
  const nextMonthSavingsLR = Math.max(0, (mean(incomeYs) || 0) - nextMonthExpense);

  // ── 2. Polynomial Regression: Spending Trend ──────────────
  const expensePolyReg = polynomialRegression(xs, expenseYs, 2);
  const polyTrendPoints = xs.map(x => ({
    index: x,
    actual: expenseYs[x - 1],
    trend: Math.max(0, expensePolyReg.predict(x)),
  }));
  // forecast 3 more months
  for (let f = 1; f <= 3; f++) {
    polyTrendPoints.push({
      index: n + f,
      actual: null,
      trend: Math.max(0, expensePolyReg.predict(n + f)),
    });
  }

  // ── 3. Logistic Regression: Will savings goal be achieved? ─
  // We synthesize training samples from monthly data + varied scenarios
  const avgIncome = mean(incomeYs);
  const logisticSamples = monthly.map((m, i) => {
    const savingsRate = m.income > 0 ? (m.savings / m.income) * 100 : 0;
    const budgetUsed = monthlyBudget > 0 ? (m.expenses / monthlyBudget) * 100 : 0;
    const expGrowth = i > 0 ? ((m.expenses - monthly[i - 1].expenses) / (monthly[i - 1].expenses || 1)) * 100 : 0;
    const incomeStability = avgIncome > 0 ? (m.income / avgIncome) * 100 : 100;
    return {
      features: [savingsRate, Math.abs(expGrowth), incomeStability, budgetUsed],
      label: m.savings >= savingsGoal ? 1 : 0,
    };
  });

  // Add some synthetic edge-case samples for better training
  if (n < 4) {
    logisticSamples.push({ features: [35, 5, 100, 60], label: 1 });
    logisticSamples.push({ features: [5, 20, 80, 120], label: 0 });
    logisticSamples.push({ features: [25, 10, 100, 75], label: 1 });
    logisticSamples.push({ features: [8, 30, 70, 110], label: 0 });
  }

  const logModel = logisticRegression(
    logisticSamples.map(s => s.features),
    logisticSamples.map(s => s.label),
    { lr: 0.05, epochs: 2000 }
  );

  // Current month features
  const last = monthly[n - 1];
  const currentSavingsRate = last.income > 0 ? (last.savings / last.income) * 100 : 0;
  const currentBudgetUsed = monthlyBudget > 0 ? (last.expenses / monthlyBudget) * 100 : 0;
  const currentExpGrowth = n > 1
    ? Math.abs(((last.expenses - monthly[n - 2].expenses) / (monthly[n - 2].expenses || 1)) * 100)
    : 0;
  const currentIncomeStability = avgIncome > 0 ? (last.income / avgIncome) * 100 : 100;

  const savingsAchieveProbability = logModel.predict([
    currentSavingsRate,
    currentExpGrowth,
    currentIncomeStability,
    currentBudgetUsed,
  ]);

  // ── 4. KNN: Similar Spending Profiles ──────────────────────
  const SPENDING_PROFILES = [
    {
      label: 'Conservative Saver',
      description: 'Minimal spending, high savings rate above 30%',
      features: [20000, 5000, 2000, 1000, 500, 500, 500],
      tip: 'You have a very disciplined spending pattern. Consider investing surplus.',
      emoji: '🏦',
      color: '#10b981',
    },
    {
      label: 'Balanced Spender',
      description: 'Moderate spending across categories, 15-25% savings',
      features: [35000, 10000, 6000, 4000, 2000, 2000, 1000],
      tip: 'Good balance! Try increasing savings by cutting one category by 10%.',
      emoji: '⚖️',
      color: '#6366f1',
    },
    {
      label: 'Lifestyle Spender',
      description: 'High discretionary spending on food, entertainment',
      features: [45000, 15000, 12000, 8000, 5000, 2000, 3000],
      tip: 'Your lifestyle spending is high. Set category caps to save more.',
      emoji: '🍕',
      color: '#f97316',
    },
    {
      label: 'High Earner Overspender',
      description: 'High income but also high expense ratio',
      features: [70000, 20000, 15000, 10000, 8000, 5000, 5000],
      tip: 'Despite high income, savings rate is low. Automate savings first.',
      emoji: '💸',
      color: '#ef4444',
    },
    {
      label: 'Frugal Professional',
      description: 'Low entertainment, high utility control',
      features: [25000, 7000, 3000, 8000, 1000, 1500, 500],
      tip: 'Very frugal! Consider allocating some savings to health & wellness.',
      emoji: '📋',
      color: '#0ea5e9',
    },
    {
      label: 'Shopaholic',
      description: 'Very high shopping & entertainment expenses',
      features: [55000, 12000, 20000, 5000, 10000, 3000, 5000],
      tip: 'Shopping is your biggest drain. Try the 24-hour rule before purchases.',
      emoji: '🛍️',
      color: '#ec4899',
    },
  ];

  // Current spending profile as feature vector
  const lastCats = last.categories || {};
  const queryFeatures = [
    last.expenses,
    lastCats['Food'] || 0,
    lastCats['Shopping'] || 0,
    lastCats['Bills'] || 0,
    lastCats['Entertainment'] || 0,
    lastCats['Health'] || 0,
    lastCats['Transport'] || 0,
  ];

  const knnResults = knn(queryFeatures, SPENDING_PROFILES, 3);

  // ── 5. Decision Tree: Spending Factor Analysis ─────────────
  const dtFeatureNames = ['Food%', 'Transport%', 'Shopping%', 'Bills%', 'Entertainment%', 'Health%'];
  const dtData = monthly.map(m => {
    const total = m.expenses || 1;
    const cats = m.categories || {};
    return {
      features: [
        ((cats['Food'] || 0) / total) * 100,
        ((cats['Transport'] || 0) / total) * 100,
        ((cats['Shopping'] || 0) / total) * 100,
        ((cats['Bills'] || 0) / total) * 100,
        ((cats['Entertainment'] || 0) / total) * 100,
        ((cats['Health'] || 0) / total) * 100,
      ],
      label: m.expenses > monthlyBudget ? 'Over Budget' : m.expenses > monthlyBudget * 0.85 ? 'Near Budget' : 'Under Budget',
    };
  });

  // Add synthetic rows for training
  dtData.push(
    { features: [40, 20, 30, 30, 15, 5], label: 'Over Budget' },
    { features: [25, 10, 10, 35, 5, 5], label: 'Under Budget' },
    { features: [30, 15, 25, 28, 12, 5], label: 'Near Budget' },
    { features: [20, 8, 8, 20, 4, 4], label: 'Under Budget' },
    { features: [45, 25, 35, 32, 20, 8], label: 'Over Budget' },
  );

  const dtModel = decisionTree(dtData, dtFeatureNames, 3);
  const lastTotal = last.expenses || 1;
  const lastCatsFeatures = [
    ((lastCats['Food'] || 0) / lastTotal) * 100,
    ((lastCats['Transport'] || 0) / lastTotal) * 100,
    ((lastCats['Shopping'] || 0) / lastTotal) * 100,
    ((lastCats['Bills'] || 0) / lastTotal) * 100,
    ((lastCats['Entertainment'] || 0) / lastTotal) * 100,
    ((lastCats['Health'] || 0) / lastTotal) * 100,
  ];
  const spendingCategory = dtModel.predict(lastCatsFeatures);
  const dtRules = dtModel.extractRules ? dtModel.extractRules() : [];

  // ── 6. Financial Health Score (0-100) ─────────────────────
  // Composite score from multiple indicators
  const savingsRateScore = Math.min(100, Math.max(0, currentSavingsRate * 2.5)); // 40% savings → 100
  const budgetScore = Math.max(0, 100 - currentBudgetUsed);
  const goalScore = savingsAchieveProbability * 100;
  const trendScore = expenseLR.slope <= 0 ? 100 : Math.max(0, 100 - expenseLR.slope / (mean(expenseYs) || 1) * 500);

  const healthScore = Math.round(
    savingsRateScore * 0.30 +
    budgetScore * 0.25 +
    goalScore * 0.25 +
    trendScore * 0.20
  );

  const healthGrade =
    healthScore >= 85 ? { grade: 'A+', label: 'Excellent', color: '#10b981' } :
    healthScore >= 70 ? { grade: 'A', label: 'Very Good', color: '#22c55e' } :
    healthScore >= 55 ? { grade: 'B', label: 'Good', color: '#84cc16' } :
    healthScore >= 40 ? { grade: 'C', label: 'Fair', color: '#eab308' } :
    healthScore >= 25 ? { grade: 'D', label: 'Poor', color: '#f97316' } :
                        { grade: 'F', label: 'Critical', color: '#ef4444' };

  // ── 7. Budget Alerts ───────────────────────────────────────
  const budgetAlerts = [];
  if (currentBudgetUsed >= 100) {
    budgetAlerts.push({ type: 'danger', message: `Total expenses exceeded monthly budget by ${(currentBudgetUsed - 100).toFixed(1)}%!`, icon: '🚨' });
  } else if (currentBudgetUsed >= 85) {
    budgetAlerts.push({ type: 'warning', message: `You've used ${currentBudgetUsed.toFixed(1)}% of your monthly budget. Be careful!`, icon: '⚠️' });
  }
  if (expenseLR.slope > 0 && n >= 2) {
    budgetAlerts.push({ type: 'info', message: `Expenses are growing by ~₹${Math.abs(expenseLR.slope).toFixed(0)}/month. Monitor closely.`, icon: '📈' });
  }
  if (savingsAchieveProbability < 0.4) {
    budgetAlerts.push({ type: 'warning', message: `Low probability (${(savingsAchieveProbability * 100).toFixed(0)}%) of reaching your savings goal this month.`, icon: '🎯' });
  }
  if (currentSavingsRate < 10 && last.income > 0) {
    budgetAlerts.push({ type: 'danger', message: `Savings rate is critically low at ${currentSavingsRate.toFixed(1)}%. Target at least 20%.`, icon: '💰' });
  }

  return {
    hasData: true,
    monthly,
    // Linear Regression results
    linearRegression: {
      model: expenseLR,
      nextMonthExpense,
      nextMonthSavings: nextMonthSavingsLR,
      trendDirection: expenseLR.slope > 0 ? 'increasing' : expenseLR.slope < 0 ? 'decreasing' : 'stable',
    },
    // Polynomial Regression results
    polynomialRegression: {
      model: expensePolyReg,
      trendPoints: polyTrendPoints,
    },
    // Logistic Regression results
    logisticRegression: {
      model: logModel,
      savingsAchieveProbability,
      willAchieveSavings: savingsAchieveProbability >= 0.5,
      currentFeatures: {
        savingsRate: currentSavingsRate,
        expenseGrowth: currentExpGrowth,
        incomeStability: currentIncomeStability,
        budgetUsed: currentBudgetUsed,
      },
    },
    // KNN results
    knn: {
      query: queryFeatures,
      results: knnResults,
      closestProfile: knnResults[0],
    },
    // Decision Tree results
    decisionTree: {
      spendingCategory,
      rules: dtRules,
      topFactors: lastCatsFeatures.map((v, i) => ({
        name: dtFeatureNames[i],
        percentage: v,
      })).sort((a, b) => b.percentage - a.percentage),
    },
    // Financial Health
    healthScore,
    healthGrade,
    // Budget Alerts
    budgetAlerts,
    // Summary stats
    stats: {
      avgMonthlyExpense: mean(expenseYs),
      avgMonthlyIncome: mean(incomeYs),
      avgMonthlySavings: mean(savingsYs),
      currentSavingsRate,
      currentBudgetUsed,
    },
  };
}
