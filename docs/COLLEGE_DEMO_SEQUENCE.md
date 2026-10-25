# SmartSpend AI — 7–10 Minute College Practical Demonstration Sequence

**Target Audience:** External Examiner, Head of Department, Project Review Committee  
**Presenter Role:** Lead Full-Stack & Machine Learning Developer  
**Demo Duration:** 7 to 10 Minutes  
**Demo Credentials:** Username: `demo_user` | Password: `smartspend123`  
**URLs:** Frontend: `http://localhost:5173/` | Backend API: `http://127.0.0.1:5000/`

---

## Preparation Checklist Before Starting

1. **Verify Backend is running:**
   - Double-click `start_backend.bat` or run `python -m backend.app`.
   - Open `http://127.0.0.1:5000/api/health` in browser: ensure it returns `"status": "healthy"`.
2. **Verify Frontend is running:**
   - Double-click `start_frontend.bat` or run `npm run dev`.
   - Open `http://localhost:5173/`.
3. **Reset Demo Data to Clean State:**
   - Run `reset_demo_data.bat` or `python backend/seed_demo_data.py --reset`.

---

## Step-by-Step Demonstration Script

### Step 1: Project Introduction & Problem Statement (Time: 0:00 – 1:00)
- **Page to Open:** `http://localhost:5173/` (Overview Dashboard)
- **What to Say to Examiner:**
  > *"Good morning respected examiners. Today I present SmartSpend AI — an Intelligent Expense Analysis and Financial Habit Prediction System. Most budgeting applications are passive calculators; they track what you spent in the past without predicting future risk or discovering behavioral patterns. SmartSpend AI bridges this gap by combining modern fintech UI with 11 distinct machine learning algorithms — from multiple regression and non-linear SVMs to unsupervised clustering and simulation-based Q-learning."*
- **Action:** Point out the dark navy sidebar (`#0B1F3A`), emerald savings badge (`#10B981`), and AI prediction accent (`#635BDB`).

---

### Step 2: Overview Dashboard & Financial KPI Cards (Time: 1:00 – 2:00)
- **Page:** Overview Dashboard (`/`)
- **Action:** Highlight the 4 KPI cards and monthly expense flow chart.
- **Expected Visible Output:**
  - Net Savings Card: Positive cash flow indicator with percentage savings rate.
  - Monthly Budget Card: Progress bar showing ₹45,000 monthly limit.
  - Financial Health Score: Dynamic composite score (out of 100) based on liquidity, budget adherence, and savings.
  - AI Predictive Insight Banner: Real-time alert advising on spending trajectory.
- **What to Say:**
  > *"The dashboard aggregates all transactional activity into core financial KPIs. Notice the Financial Health Score card — it evaluates cash flow stability, discretionary velocity, and savings progress. Our AI Predictive Insight card immediately alerts the user if their current month-to-date spending pace indicates an impending budget overrun."*
- **Fallback Action:** If KPIs appear empty, click the "Reset Demo Data" option or run `reset_demo_data.bat`.

---

### Step 3: Transaction Management & CSV Pipeline (Time: 2:00 – 3:15)
- **Page to Open:** Click **Transactions** in sidebar (`/transactions`).
- **Action 1 (Filter & Search):** Type "Diwali" in the search bar. Observe instant client-side filtering to the ₹7,800 festive transaction. Clear search. Filter by Category: "Food".
- **Action 2 (Add Transaction):** Click `+ Add Transaction`.
  - Amount: `1500`, Type: `Expense`, Category: `Food`, Title: `Examiner High Tea & Snacks`, Date: `2026-10-25`. Click Save.
  - Verify that toast notification appears and the new row is prepended.
- **Action 3 (CSV Export):** Click `Export CSV`. Download begins instantly with RFC-4180 format.
- **What to Say:**
  > *"The transaction management engine supports instantaneous search, multi-category filtering, and atomic CRUD operations. CSV export and import validate date formats, positive amounts, and prevent malformed data through database rollback transactions."*

---

### Step 4: Budget Planner & What-If Simulation (Time: 3:15 – 4:30)
- **Page to Open:** Click **Budget Planner** in sidebar (`/budgets`).
- **Action:**
  1. Show the overall budget progress bar and category allocation cards (Food, Rent, Bills, Shopping).
  2. Scroll to the **What-If Budget Simulator**.
  3. Drag the "Dining Out Reduction" slider to $20\%$ and observe projected monthly savings increasing by ₹2,400.
- **What to Say:**
  > *"In the Budget Planner, users configure monthly limits and savings goals. Rather than telling users after they overspend, our What-If Simulator lets users test hypothetical spending adjustments to quantify how small lifestyle reductions compound into annual savings."*

---

### Step 5: Advanced Analytics & Unsupervised Clustering (Time: 4:30 – 5:30)
- **Page to Open:** Click **Analytics** in sidebar (`/analytics`).
- **Action:** Scroll to **Exp 8 & 9: Spending Archetypes & Anomaly Detection**.
- **Expected Visible Output:**
  - K-Means Scatter Plot displaying 3 distinct spending clusters: Frugal Savers, Lifestyle Spenders, Fixed Essentials.
  - DBSCAN Outlier Detection showing 6 anomalous expenditure months (noise label $-1$).
- **What to Say:**
  > *"Here we apply unsupervised learning. K-Means clustering segments user spending patterns into three behavioral archetypes without requiring pre-labeled training classes. DBSCAN density-based clustering identifies non-spherical outliers — such as emergency medical costs or festive spikes — flagging them for review."*

---

### Step 6: AI Predictions (Continuous & Discrete Inference) (Time: 5:30 – 6:45)
- **Page to Open:** Click **AI Predictions** in sidebar (`/predictions`).
- **Action:**
  - Inspect the loaded model inference cards:
    1. Continuous Monthly Expense Estimate: Multiple Linear Regression (₹51,981) vs Polynomial Regression (₹51,844).
    2. Over-Budget Risk Probability: Logistic Regression (99.8% risk probability) and Linear SVM decision ("Over Budget").
- **What to Say:**
  > *"In this view, the frontend makes live POST requests to `/api/ml/predict`. The Flask backend loads the saved scikit-learn `.joblib` models from disk, passes the current income and category features through the exact `StandardScaler` fitted on training data, and computes real inferences. Notice that both linear and polynomial regression estimates are displayed alongside a calibrated over-budget probability."*

---

### Step 7: The ML Model Laboratory (Experiments 1–11) (Time: 6:45 – 8:30)
- **Page to Open:** Click **ML Model Lab** in sidebar (`/ml-lab`).
- **Actions Across Tabs:**
  1. **Exp 1 & 2 Tab:** Show PCA 2D variance maximization (PC1: 33.4% + PC2: 18.3% = 51.7% total explained variance) and LDA supervised separation (95.6% accuracy).
  2. **Exp 3–5 Tab:** Show the Regression Benchmark table:
     - Linear Regression ($R^2=0.9916, RMSE=₹814.09, MAE=₹664.01$)
     - Polynomial Degree 2 ($R^2=0.9908, RMSE=₹853.80, MAE=₹701.36$)
     - Ridge & Lasso Regularization ($R^2=0.9916$). Adjust alpha slider to show interactive control.
  3. **Exp 6 & 7 Tab:** Show the $2 \times 2$ Confusion Matrix ($TP=50, FP=2, FN=0, TN=20$), Accuracy (97.2%), Precision (96.2%), Recall (100%), and SVM Linear (97.2%) vs RBF (93.1%).
  4. **Exp 10 Tab:** Show Random Forest (84.7%) and Gradient Boosting (87.5%) accuracies with Gini Impurity feature rankings (Rent 30.4%, Income 22.1%, Food 20.2%).
  5. **Exp 11 Tab:** Show Q-Learning 250-episode convergence curve.
- **What to Say:**
  > *"The ML Model Lab is our educational evaluation cockpit. Every number displayed here is retrieved live from `/api/ml/metadata` based on the project dataset (`data/expenses_dataset.csv`). Models were evaluated on an unseen 20% holdout split (n=72) with strict zero-leakage preprocessor fitting. In Exp 11, our reinforcement learning agent optimizes monthly budget allocations across a 27-state Markov Decision Process, outperforming a fixed-spending baseline by +168.6 to -104.7."*

---

### Step 8: Privacy, Automated Tests & Conclusion (Time: 8:30 – 10:00)
- **Page to Open:** Click **Privacy & Security** in sidebar (`/privacy`).
- **Action:** Show the GDPR Data Export button and Account Purge safeguard.
- **Terminal Demonstration:** Open terminal and run:
  ```powershell
  python -m pytest tests -v
  ```
  Show all **22 passing automated tests** in ~5.2 seconds.
- **Concluding Remarks:**
  > *"In summary, SmartSpend AI provides a secure, privacy-first personal finance platform backed by verified machine learning models and automated regression tests. I am now pleased to answer your questions during the viva voce."*
