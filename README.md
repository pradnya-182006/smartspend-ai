# SmartSpend AI — Intelligent Expense Analysis & Financial Habit Prediction System

![SmartSpend AI](https://img.shields.io/badge/SmartSpend_AI-v2.0.0-635BDB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?style=for-the-badge&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.8.0-F7931E?style=for-the-badge&logo=scikitlearn)
![Pytest](https://img.shields.io/badge/pytest-29%2F29%20Passed-10B981?style=for-the-badge)
![License](https://img.shields.io/badge/Academic-Open%20Source-blue?style=for-the-badge)

A full-stack, machine-learning-powered personal finance web application featuring atomic transaction management, dynamic category budget allocation, real-time what-if spending simulation, and an interactive **Machine Learning Model Laboratory (Experiments 1 to 11)** designed for academic demonstrations, project reviews, and viva voce examinations.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [The 7 Core Application Views](#-the-7-core-application-views)
6. [Machine Learning Experiments Matrix (Exp 1–11)](#-machine-learning-experiments-matrix-exp-111)
7. [Installation & Windows Quickstart](#-installation--windows-quickstart)
8. [API Endpoints & Example Payloads](#-api-endpoints--example-payloads)
9. [Automated Testing & Production Build](#-automated-testing--production-build)
10. [Model Training & Serialization](#-model-training--serialization)
11. [Screenshots](#-screenshots)
12. [Dataset & Demo Limitations](#-dataset--demo-limitations)
13. [Security, Privacy & Responsible Use](#-security-privacy--responsible-use)
14. [Documentation Library](#-documentation-library)

---

## 💡 Project Overview

Traditional personal finance trackers provide static summaries of past transactions without explaining underlying habits or forecasting future risk. **SmartSpend AI** bridges financial logging and applied machine learning by evaluating user income, category expenses, and savings goals against 11 classical and modern machine learning algorithms.

The application serves two practical goals:
1. **For Users:** A high-speed, fintech-styled personal dashboard to track income, log expenses, manage category limits, export data, and forecast over-budget probabilities.
2. **For Academic Evaluators:** A live laboratory verifying algorithm implementations—ranging from Linear and Polynomial Regression to Support Vector Machines, K-Means, DBSCAN, Random Forest, Gradient Boosting, and Reinforcement Learning (Q-Learning)—with zero synthetic target leakage, leak-free holdout evaluation, and transparent metric reporting.

---

## ✨ Key Features

- **Fintech Dashboard:** Real-time calculation of Total Income, Total Expenses, Net Savings, and dynamic Budget Utilization with composite **Financial Health Score** (0–100).
- **Atomic Transactions:** Searchable, filterable transaction table with category pills, date filters, and atomic CSV import/export.
- **Interactive Budget Planner:** Category progress bars with multi-tiered alert thresholds (Emerald <80%, Amber 80–99%, Red ≥100%) and interactive **What-If Spending Simulator**.
- **Dual-View 2×2 Confusion Matrix:** Real-time matrix displaying verified holdout test metrics ($TP=45, FP=3, FN=3, TN=21$ on $N=72$ stratified test split) with an instant toggle between **Diagnostic (Positive-First)** and **scikit-learn Index (0 / 1)** order.
- **Dimensionality Reduction:** 2D interactive projections using **Principal Component Analysis (PCA)** ($52.4\%$ explained variance) and **Linear Discriminant Analysis (LDA)** ($93.1\%$ holdout classification accuracy).
- **Cluster & Anomaly Detection:** 3 spending archetypes discovered by **K-Means** ($k=3$, inertia 1212.9) and 5 irregular spending anomalies flagged by **DBSCAN** density clustering.
- **Reinforcement Learning Agent:** Discrete 27-state **Q-Learning** Markov Decision Process simulator evaluated on 50 independent test episodes (+172.7 mean reward vs balanced baseline -89.1; 100% budget adherence).
- **Privacy Controls:** One-click JSON data export and secure cascading database purge.

---

## 🛠 Technology Stack

### Frontend Client
- **Framework:** React 19 + Vite 8
- **Styling:** Vanilla Tailwind CSS (Custom Dark Navy `#0B1F3A`, Emerald `#10B981`, AI Indigo `#635BDB` palette)
- **Data Visualization:** Recharts, Chart.js, Lucide React icons
- **State Management:** React Context API (`FinanceContext`) with persistent localStorage fallback

### Backend REST API
- **Framework:** Python Flask 3.1.3 (Application Factory pattern with Blueprints)
- **Security & Crypto:** Werkzeug 3.1.9 (PBKDF2-HMAC password hashing with unique salt)
- **Database:** SQLite 3 with atomic transaction scopes and foreign key constraints enabled
- **CORS:** Controlled origin header management for development and production

### Machine Learning & Data Science
- **Libraries:** scikit-learn 1.8.0, pandas 2.3.3, NumPy 2.4.1, joblib 1.5.3
- **Model Serialization:** 18 pre-trained model and transformation artifacts plus 1 metadata file in `data/models/` (~590 KB total)

### Testing & Tooling
- **Unit & Integration Tests:** pytest 9.1.1 (29 automated test cases)

---

## 🏛 System Architecture

```text
[ Browser / Client ] 
        │
        ▼ (HTTP / JSON on Port 5173)
┌─────────────────────────────────────────────────────────────┐
│                   React 19 + Vite Frontend                  │
│  Overview • Transactions • Budget Planner • ML Model Lab    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proxy: /api/* -> 127.0.0.1:5000
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Flask REST API Server                    │
│   auth_bp  •  transactions_bp  •  budgets_bp  •  ml_bp      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ (SQL Queries)                ▼ (Inference)
┌──────────────────────────────┐ ┌───────────────────────────────────┐
│      SQLite 3 Database       │ │       scikit-learn Pipelines      │
│  users, transactions,        │ │  18 Serialized Model/Feature Files│
│  budgets, alert_preferences  │ │  + 1 Metadata File in data/models │
└──────────────────────────────┘ └───────────────────────────────────┘
```

---

## 🧭 The 7 Core Application Views

1. **Dashboard (Overview):** Income, expense, net savings metrics, financial health score card, monthly cash flow charts, and category breakdown.
2. **Transactions:** Full CRUD management, live search, date filters, and atomic CSV import/export.
3. **Budget Planner:** Monthly limit settings, category progress indicators, what-if budget simulation sliders, and RL-guided recommendations.
4. **Analytics:** Spending velocity, category proportions, K-Means spending archetypes, and DBSCAN anomaly detection.
5. **AI Predictions:** Live multi-model expense estimation (Linear, Polynomial, Ridge) and over-budget risk classification (Logistic Regression, Linear SVM).
6. **ML Model Lab:** Granular laboratory for Experiments 1 through 11 with interactive hyperparameter sliders, 2D PCA/LDA plots, dual-orientation confusion matrix, and Q-table learning curves.
7. **Privacy & Security:** Full JSON data snapshot backup export and secure database wipe controls.

---

## 🧠 Machine Learning Experiments Matrix (Exp 1–11)

All 11 experiments have been audited directly in `backend/ml_pipeline.py`. Preprocessing (scalers, polynomial expansions, PCA) is fitted solely on the training partition ($N = 288$), and all reported metrics are evaluated strictly on an unseen 20% stratified test partition ($N = 72$) with zero target leakage:

| Exp # | Experiment Title | Model / Algorithm | Role in Application | Hold-out Metric ($N=72$) | Serialized Artifact File |
|:---:|:---|:---|:---|:---|:---|
| **1** | Feature Engineering | `StandardScaler`, 80/20 Stratified Split | Preprocessing Pipeline | Train $\mu=0.00, \sigma=1.00$, zero test leakage | `data/models/scaler_reg.joblib`<br>`data/models/scaler_clf.joblib`<br>`data/models/scaler_cats.joblib` |
| **2A** | Dimensionality Reduction | Principal Component Analysis (PCA) | Benchmark (Unsupervised) | PC1: 33.9%, PC2: 18.5% (Total: **52.4% EVR**) | `data/models/pca_model.joblib` |
| **2B** | Supervised Linear Separation | Linear Discriminant Analysis (LDA) | Benchmark (Supervised) | Hold-out Accuracy: **93.1%** | `data/models/lda_model.joblib` |
| **3** | Multiple Linear Regression | Ordinary Least Squares (OLS) | **Live Inference Model** | $R^2 = \mathbf{0.9889}$, $RMSE = \mathbf{₹877.49}$, $MAE = \mathbf{₹718.10}$ | `data/models/linear_regression.joblib` |
| **4** | Polynomial Regression | Degree-2 Polynomial Features | **Live Inference Model** | $R^2 = \mathbf{0.9881}$, $RMSE = \mathbf{₹907.34}$, $MAE = \mathbf{₹755.08}$ | `data/models/poly_regression.joblib`<br>`data/models/poly_features.joblib` |
| **5A** | Ridge Regression | $L_2$ Regularization ($\alpha=1.0$) | **Live Inference Model** | $R^2 = \mathbf{0.9888}$, $RMSE = \mathbf{₹880.98}$, $MAE = \mathbf{₹722.63}$ | `data/models/ridge_regression.joblib` |
| **5B** | Lasso Regression | $L_1$ Regularization ($\alpha=5.0$) | Benchmark (Sparsity) | $R^2 = \mathbf{0.9889}$, $RMSE = \mathbf{₹878.80}$, $MAE = \mathbf{₹719.30}$ | `data/models/lasso_regression.joblib` |
| **6** | Binary Classification | Logistic Regression | **Live Inference Model** | Accuracy: **91.7%**, Precision: **93.8%**, Recall: **93.8%**, F1: **93.8%**, ROC-AUC: **97.7%** | `data/models/logistic_regression.joblib` |
| **7A** | Support Vector Machine | Linear Kernel SVM ($C=1.0$) | **Live Inference Model** | Accuracy: **93.1%**, F1-Score: **94.8%** | `data/models/svm_linear.joblib` |
| **7B** | Non-Linear SVM | Gaussian RBF Kernel SVM | Benchmark (Nonlinear Boundary) | Accuracy: **88.9%**, F1-Score: **91.5%** | `data/models/svm_rbf.joblib` |
| **8** | Unsupervised Clustering | K-Means ($k=3$) | Benchmark (Spending Personas) | Silhouette Score: **0.155**, Inertia: **1212.9** (3 archetypes) | `data/models/kmeans.joblib` |
| **9** | Density Clustering | DBSCAN ($\text{eps}=1.8, \text{min}=3$) | Benchmark (Anomaly Detection) | **5 Outlier Records Detected** (Noise label $-1$) | `data/models/dbscan.joblib` |
| **10A**| Ensemble (Bagging) | Random Forest Classifier (100 Trees) | Benchmark (Feature Importance) | Accuracy: **84.7%**, Gini Top Features: Income (24.2%), Rent (24.1%), Food (22.5%) | `data/models/random_forest.joblib` |
| **10B**| Ensemble (Boosting) | Gradient Boosting Classifier | Benchmark (Boosting Comparison) | Accuracy: **84.7%**, Learning Rate: 0.1 | `data/models/gradient_boosting.joblib` |
| **11** | Reinforcement Learning | Q-Learning (MDP 27-State Simulator) | Benchmark (Policy Simulation) | Independent Test 50-Ep Avg: **+172.7** (std 25.2) vs Baseline Heuristic: **-89.1** (std 36.4), Adherence: **100%** | `data/models/q_table.npy` |

### Model Catalogue & Role Distinction
- **Live Online Inference Models (5 Models):** Directly wired to the production `/api/ml/predict` endpoint to compute real-time continuous expense estimates (Linear, Polynomial, Ridge) and over-budget risk classifications (Logistic Regression, Linear SVM).
- **Analytical Evaluation Benchmarks (9 Models):** Used for comparative analysis, feature importance auditing, persona segmentation, outlier anomaly detection, and discrete dynamic policy benchmarking in the interactive ML Model Laboratory.

*Verified Confusion Matrix Counts (Stratified Test Split, $N=72$):* $TP = 45$, $FP = 3$, $FN = 3$, $TN = 21$.


---

## ⚡ Installation & Windows Quickstart

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ and npm
- Git

### 2. Clone the Repository
```powershell
git clone <repository-url>
cd "Smart spend Ai/smart spend ai"
```

### 3. One-Click Windows Launchers
For convenience on Windows, pre-configured launcher scripts are provided:
- **`start_backend.bat`**: Verifies Python, checks port availability, and starts Flask on `http://127.0.0.1:5000`.
- **`start_frontend.bat`**: Verifies npm, installs `node_modules` if missing, and starts Vite on `http://localhost:5173`.
- **`run_tests.bat`**: Runs all 29 automated pytest tests.
- **`reset_demo_data.bat`**: Safely resets fictional demo records for User ID 1 (`demo_user`).

### 4. Manual Terminal Startup

**Terminal 1 — Backend REST API:**
```powershell
# Copy environment template
copy .env.example .env

# Install Python dependencies
pip install -r requirements.txt

# Start Flask API server
python -m backend.app
```
*API will run on `http://127.0.0.1:5000`.*

**Terminal 2 — React / Vite Frontend Client:**
```powershell
# Install Node dependencies
npm install

# Start development server
npm run dev
```
*Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 📡 API Endpoints & Example Payloads

### 1. Health & Status
- **`GET /api/health`**
  ```json
  {
    "app": "SmartSpend AI Backend",
    "database": "SQLite 3",
    "ml_engine": "scikit-learn 1.8.0",
    "status": "healthy",
    "version": "2.0.0"
  }
  ```

### 2. Live Machine Learning Predictions
- **`POST /api/ml/predict`**
  - **Request Body:**
    ```json
    {
      "Income": 55000,
      "Rent": 15000,
      "Food": 10000,
      "Utilities": 5000,
      "Shopping": 6000,
      "Travel": 4000,
      "Health": 3000
    }
    ```
  - **Response (HTTP 200):**
    ```json
    {
      "status": "success",
      "predictions": {
        "linear_regression_expense": 45433.31,
        "poly_regression_expense": 45337.19,
        "ridge_regression_expense": 45451.61,
        "over_budget_probability": 69.3,
        "is_over_budget_predicted": true,
        "svm_classification": "Over Budget"
      }
    }
    ```

### 3. Model Metadata & Evaluation Results
- **`GET /api/ml/metadata`**
  - Returns complete hold-out metrics for all 11 experiments, confusion matrix counts, PCA variance ratios, training timestamps, and the model catalogue.

### 4. Controlled Retraining
- **`POST /api/ml/retrain`**
  - Executes full retraining pipeline on `data/expenses_dataset.csv`, evaluates test partitions, and serializes fresh model artifacts (includes a 5-second rate-limiting debounce).

---

## 🧪 Automated Testing & Production Build

### Running the Test Suite
```powershell
python -m pytest tests -v
```
**Test Suite Coverage (29 Passed, 0 Failed):**
- Budget calculation and what-if simulation tests (`test_budgets.py`)
- Zero-income and missing-budget mathematical edge cases (`test_calculations.py`)
- Full ML pipeline serialization, holdout metrics, zero target leakage, and Q-learning convergence (`test_ml_models.py`)
- Model artifact completeness verification (`verify_model_artifacts`) and prediction input schema/bounds validation (`test_ml_models.py`)
- Q-learning isolated RNG reproducibility and convergence diagnostic checks (`test_ml_models.py`)
- Model catalogue transparency tests distinguishing live prediction models from benchmarks (`test_ml_models.py`)
- Authentication, session invalidation, privacy export, and ML input bounds validation (`test_security_privacy.py`)
- Transaction CRUD, filter matching, and CSV import/export integrity (`test_transactions.py`)

### Production Frontend Build
```powershell
npm run build
```
Generates minified static assets in `dist/` with 0 build errors.

---

## 📦 Model Training & Serialization

The project ships with 18 pre-trained, lightweight model and feature transformation artifacts plus 1 metadata file in `data/models/` (~590 KB total). To regenerate all artifacts from scratch at any time:

```powershell
python -m backend.ml_pipeline
```
This script:
1. Loads the synthetic benchmark dataset (`data/expenses_dataset.csv`).
2. Scales features using an 80/20 stratified train/test split on training data only (zero data leakage).
3. Fits and evaluates all 11 experiments on held-out test splits.
4. Serializes all fitted estimators and scalers to `data/models/` using `joblib` and NumPy `.npy`.

---

## 📸 Screenshots

*(Interface layout follows a modern fintech theme with Dark Navy `#0B1F3A` and Emerald `#10B981` accents)*

| Overview Dashboard | Machine Learning Model Lab |
|:---:|:---:|
| *(Financial summary cards, health score, category breakdown)* | *(Interactive 2×2 Confusion Matrix, PCA/LDA, Q-Learning curve)* |

| AI Predictions & What-If Simulator | Transaction Management |
|:---:|:---:|
| *(Multi-model forecast comparison & interactive budget sliders)* | *(Filterable ledger with atomic CSV import/export)* |

---

## ⚠️ Dataset & Demo Limitations

1. **Synthetic Dataset:** All models are trained on a synthetic dataset of 360 monthly financial profiles (`data/expenses_dataset.csv`). While statistically calibrated to reflect realistic urban household spending distributions, they are **not** real customer banking records.
2. **Target Definition & Limits of Cross-Sectional Estimation:** `TotalExpenses` is calculated directly as the sum of observed expense categories (`Rent + Food + Utilities + Shopping + Travel + Health`) plus an unobserved incidental cash expense (`Miscellaneous ~ N(2500, 800)`). Because the input features and target represent concurrent allocations within the same accounting month, the high $R^2 \approx 0.9889$ establishes **concurrent cross-sectional spending reconstruction and reconciliation**, **not** longitudinal multi-period future time-series forecasting. Future-period forecasting would require sequential longitudinal panel data across consecutive months.
3. **Simulated RL Environment:** Experiment 11 (Q-Learning) operates inside an educational discrete 27-state Markov Decision Process simulator (`SimulatedBudgetEnv`) with simulated price shocks to benchmark dynamic resource throttling actions (Conservative, Balanced, Aggressive). It does **not** establish evidence of actual customer savings or execute live banking transactions.
4. **Statistical Estimates:** Predictions generated by the models are algorithmic estimates for educational budgeting and scenario analysis, not financial guarantees.


---

## 🔒 Security, Privacy & Responsible Use

- **Password Hashing:** Passwords are encrypted with salted PBKDF2 (SHA-256) via `werkzeug.security`. Plaintext passwords are never logged or stored.
- **SQL Injection Prevention:** 100% of SQLite database operations utilize parameterized query bindings (`?`).
- **Session Security:** Session cookies are configured with `HttpOnly = True` and `SameSite = 'Lax'`.
- **Input Bounds Validation:** Prediction inputs are strictly bounds-checked (non-negative numeric amounts between ₹0 and ₹100,000,000; rejecting strings, `NaN`, or infinite values with HTTP 400).
- **Rate-Limiting Protection:** Heavy ML retraining endpoints enforce a 5-second debounce window to prevent CPU saturation (HTTP 429).
- **CSV Upload Protection:** CSV imports are capped at 10 MB and 5,000 maximum rows.
- **Demo Isolation:** The demo reset script strictly scopes deletions to User ID 1 (`demo_user`), protecting any real user accounts.

---

## 📚 Documentation Library

Detailed technical reports and guides are available in the [`docs/`](docs/) directory:

- [Phase 4 Final Acceptance & Security Report](docs/PHASE_4_ACCEPTANCE_REPORT.md) — Complete verification matrix, test totals, and audit results.
- [College Demo Day Presentation Checklist](docs/DEMO_DAY_CHECKLIST.md) — Step-by-step presentation script and viva prep.
- [Troubleshooting & Recovery Manual](docs/TROUBLESHOOTING.md) — Diagnosis and resolution for port conflicts, dependencies, and build errors.
- [ML Viva Voce Examiner Guide](docs/VIVA_PREPARATION.md) — Theoretical formulas, algorithm comparisons, and examiner questions.
- [College Demo Sequence Guide](docs/COLLEGE_DEMO_SEQUENCE.md) — Chronological 7-minute demonstration walkthrough.
- [Technical System Architecture](docs/PROJECT_ARCHITECTURE.md) — Detailed architecture diagrams and data flows.
- [Academic Project Explanation](docs/PROJECT_EXPLANATION.md) — Comprehensive academic report on problem statement and methodology.
- [Dataset Documentation & Data Dictionary](docs/DATASET_DOCUMENTATION.md) — Schema description and feature distributions.
- [Database Schema Specification](docs/DATABASE_SCHEMA.md) — SQLite table schemas and relational integrity constraints.

---

## 👤 Default Demo Credentials
- **Username:** `demo_user`
- **Email:** `demo@smartspend.ai`
- **Password:** `smartspend123`
