# SmartSpend AI — Intelligent Expense Analysis and Financial Habit Prediction System

**Academic Year:** 2026–2027  
**Degree / Course:** Bachelor of Engineering / Computer Science & Engineering  
**Project Category:** Machine Learning & Full-Stack Web Application  

---

## 1. Title & Abstract

### Title
**SmartSpend AI: Intelligent Expense Analysis and Financial Habit Prediction System**

### Abstract
Personal financial mismanagement, discretionary overspending, and unexpected expenditure shocks frequently prevent households and students from achieving financial stability. Conventional personal finance software serves predominantly as a passive bookkeeping tool, recording past transactions without predicting future financial risks or discovering underlying spending archetypes. 

**SmartSpend AI** addresses this challenge by introducing an intelligent, full-stack personal finance and educational machine learning system. The platform integrates a modern React-based fintech interface with a robust Python Flask backend and an embedded SQLite database. It implements, trains, evaluates, and integrates **11 distinct machine learning experiments** covering 15 syllabus algorithms, including Multiple Linear, Polynomial, Ridge, and Lasso Regression for continuous expense estimation; Logistic Regression and Support Vector Machines (Linear and RBF) for over-budget classification; K-Means and DBSCAN for unsupervised spending archetype clustering; Random Forest and Gradient Boosting for feature importance analysis; and Q-Learning in a simulated Markov Decision Process (MDP) for dynamic monthly budget pacing. All models are serialized via Joblib and loaded for live inference. The system includes atomic transaction management, interactive what-if budget simulation, automated in-app threshold alerts, and GDPR-compliant privacy export and purge capabilities.

---

## 2. Problem Statement
Most individuals lack automated foresight into their financial trajectory. Existing commercial applications suffer from:
1. **Passive Nature:** They report what was spent *after* the month ends, failing to predict budget breach probabilities *during* the month.
2. **Target Leakage & Naive Modeling:** Academic implementations often fall prey to target leakage (e.g. predicting total expenses by arithmetically summing the entered category inputs).
3. **Black-Box Metrics:** Existing tools lack educational transparency, rarely demonstrating how machine learning algorithms (PCA, LDA, SVM, Reinforcement Learning) evaluate and regularize financial features.
4. **Privacy & Data Security Vulnerabilities:** Many online budget apps transmit unencrypted financial records to cloud marketing providers.

---

## 3. Project Objectives
1. Implement, train, evaluate, and serialize **all 11 machine learning experiments** required by the curriculum using a structured research dataset.
2. Develop a modern, responsive fintech web application with 7 core navigation views following a dark navy, light workspace, emerald, and AI-indigo color palette.
3. Build an atomic transaction management pipeline supporting instant search, category filtering, and RFC-4180 compliant CSV import and export.
4. Create an interactive What-If Budget Simulator that projects annual savings adjustments based on discretionary expense reductions.
5. Provide a functional **ML Model Lab** that displays genuine, live evaluation metrics ($R^2$, RMSE, MAE, Confusion Matrix, ROC-AUC, EVR, Silhouette, and Q-learning convergence curves) fetched directly from the backend.
6. Guarantee mathematical integrity and zero test-data leakage by strictly fitting preprocessing transformations on training splits only.
7. Maintain strict privacy and user isolation via PBKDF2 password hashing, SQLite transactional scope, and GDPR-compliant data export and purge endpoints.

---

## 4. Scope
- **Included:** Monthly household budgeting, transaction recording, category allocations, continuous and discrete machine learning forecasts, unsupervised spending archetypes, simulated reinforcement learning budget planning, local database storage, and automated testing.
- **Excluded:** Direct integration with live commercial banking APIs (e.g. Plaid, UPI live gateways), automated legal tax calculation, and real-money execution. All demo transactions are clearly labeled as fictional.

---

## 5. Existing System vs. Proposed SmartSpend AI

| Feature | Existing Budgeting Apps | Proposed SmartSpend AI System |
|:---|:---|:---|
| **Approach** | Descriptive & Reactive (Past Logs Only) | Predictive & Prescriptive (Machine Learning Guided) |
| **Prediction Models** | None or Basic Moving Averages | Multiple Reg, Polynomial, Ridge, Lasso, Logistic, SVM |
| **Pattern Discovery** | Fixed Hardcoded Rules | Unsupervised K-Means & DBSCAN Anomaly Clustering |
| **Budget Planning** | Static Percentages (50/30/20) | Dynamic Reinforcement Learning (Q-Learning MDP) |
| **Model Transparency** | Opaque Proprietary Black-Box | Dedicated ML Model Lab with live mathematical metrics |
| **Data Privacy** | Cloud Third-Party Tracking | Local SQLite 3 Relational Database with Full Purge |
| **Validation Rigor** | Unverified Marketing Claims | 22 Passing Automated Pytest Suite with Zero Leakage |

---

## 6. Functional & Non-Functional Requirements

### Functional Requirements
- **FR1 (Authentication):** Users can register, log in with PBKDF2-hashed passwords, and maintain authenticated sessions.
- **FR2 (Transactions):** Atomic CRUD operations for income and expenses with amount, category, date, and notes.
- **FR3 (CSV Pipeline):** Import and export transactions via CSV with rollback on validation failure.
- **FR4 (Budget & Goals):** Set overall monthly limit and per-category allocations with real-time percentage utilization.
- **FR5 (Predictive Inference):** Live continuous total expense estimates and over-budget risk probabilities.
- **FR6 (ML Model Lab):** Interactive inspection of all 11 experiments with genuine metrics and hyperparameter sliders.
- **FR7 (Privacy Control):** JSON backup export and permanent one-click database record purge.

### Non-Functional Requirements
- **NFR1 (Performance):** Page transitions and prediction responses under 200ms locally.
- **NFR2 (Security):** Zero plain-text password storage; parameterized SQL queries preventing SQL injection.
- **NFR3 (Reliability):** 100% automated test pass rate with atomic database commit/rollback integrity.
- **NFR4 (Reproducibility):** Fixed seeds (`random_state=42`) ensuring identical evaluation metrics across environments.

---

## 7. Technology Stack

- **Client Tier:** React 19, Vite 8, TailwindCSS, Recharts, Lucide Icons.
- **Server Tier:** Python 3.13, Flask 3.1.3, Werkzeug 3.1.9 (PBKDF2 security, CORS).
- **Machine Learning Engine:** scikit-learn 1.8.0, pandas 2.3.3, numpy 2.4.1, joblib 1.5.3.
- **Database:** Local SQLite 3 with foreign key enforcement and transactional scope.
- **Automated Testing:** Pytest 9.1.1.

---

## 8. Dataset Description & Zero-Leakage Protocol

- **Dataset File:** `data/expenses_dataset.csv`
- **Volume:** 360 monthly observation vectors across 30 household demographics over 12 billing cycles.
- **Features (13):** `MonthIndex, Income, Rent, Food, Utilities, Shopping, Travel, Health, Miscellaneous, TotalExpenses, Savings, SavingsRate, OverBudget`.
- **Target Specification:**
  - *Regression Target:* `TotalExpenses = Rent + Food + Utilities + Shopping + Travel + Health + Miscellaneous` (incorporates unobserved miscellaneous variance to prevent identity sum target leakage).
  - *Classification Target:* `OverBudget = 1 if TotalExpenses > 45000 else 0`.
- **Validation Protocol:**
  - 80% Train ($n=288$), 20% Test ($n=72$).
  - `StandardScaler` fitted strictly on $X_{train}$.

---

## 9. System Modules Description

1. **Authentication Module (`backend/auth.py`):** PBKDF2 password generation and session authentication.
2. **Transaction Engine (`backend/routes_transactions.py`):** Transactional CRUD with parameterized SQL queries and CSV streaming.
3. **Budget Engine (`backend/routes_budgets.py`):** Monthly limit tracking, category breakdowns, and what-if simulation.
4. **Machine Learning Pipeline (`backend/ml_pipeline.py`):** Trains and serializes all 11 experiments, manages MDP environment.
5. **Model Lab Service (`backend/routes_ml.py`):** Serves verified metadata and handles on-demand inference.
6. **Privacy Engine (`backend/routes_privacy.py`):** JSON export and cascading account deletion.

---

## 10. Verification & Test Results

The project undergoes automated verification via `pytest`:
- **Total Test Cases:** 22
- **Pass Rate:** 100% (22 passed in 5.26 seconds)
- **Coverage Areas:** Budget calculations, zero-income safety, what-if projections, transaction validation, CSV import rollback, password hashing, privacy purge, regression consistency ($RMSE \ge MAE$), confusion matrix mathematical integrity ($TP+FP+FN+TN=72$), PCA/LDA variance, and Q-learning baseline outperformance.

---

## 11. Security, Privacy & Ethical Considerations
- **Data Isolation:** User transactions, public research training data, and simulated reinforcement learning data are strictly isolated.
- **No Third-Party Transmission:** All machine learning inference and database queries run 100% locally on the user's host machine.
- **Defensive Labeling:** Fictional demonstration records are explicitly labeled with `[DEMO]` tags to prevent user confusion with real financial accounts.

---

## 12. Limitations & Future Scope

### Limitations
1. Does not link directly to commercial bank open-banking APIs (Plaid/Yodlee).
2. The primary research dataset captures 360 monthly snapshots; multi-year macroeconomic inflation trends require larger longitudinal datasets.

### Future Scope
1. **OCR Receipt Parsing:** Integrate computer vision (Tesseract / EasyOCR) to scan paper receipts directly into transactions.
2. **Time-Series Forecasting:** Implement ARIMA/LSTM recurrent neural networks for multi-month horizon cash flow forecasting.
3. **Cross-Platform Mobile App:** Package using React Native or Capacitor for Android and iOS devices.

---

## 13. Conclusion
SmartSpend AI demonstrates that personal finance applications can move beyond simple historical ledgers into proactive, predictive financial intelligence platforms. By implementing, evaluating, regularizing, and explaining all 11 syllabus machine learning experiments in an integrated web environment, the project delivers a mathematically sound, secure, and presentation-ready full-stack engineering achievement.
