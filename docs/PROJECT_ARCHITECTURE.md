# SmartSpend AI — Technical System Architecture

## 1. Architectural Overview & Technology Stack

SmartSpend AI is built with a decoupled client-server architecture:
- **Frontend Presentation Tier:** React 19, Vite 8, TailwindCSS, Recharts, Lucide Icons.
- **Backend Application Tier:** Python 3.13, Flask 3.1.3, Werkzeug 3.1.9 (PBKDF2 password security, Blueprint routing, CORS middleware).
- **Machine Learning & Simulation Engine:** scikit-learn 1.8.0, pandas 2.3.3, numpy 2.4.1, joblib 1.5.3.
- **Persistence Tier:** Local SQLite 3 embedded relational database with strict foreign keys and transactional context management.

---

## 2. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client["Frontend Client (React + Vite)"]
        UI["Tailwind UI Dashboard"]
        NAV["7 Core Navigation Views"]
        STORE["Finance Context & Local Storage"]
        UI --> STORE
        STORE --> NAV
    end

    subgraph API["Backend API (Flask 3.1.3)"]
        ROUTER["Flask Blueprint Router"]
        AUTH["Auth Blueprint (/api/auth)"]
        TX["Transactions (/api/transactions)"]
        BUDGET["Budgets & Simulation (/api/budgets)"]
        NOTIF["Notifications & Alerts (/api/notifications)"]
        PRIVACY["Privacy & GDPR Purge (/api/privacy)"]
        ML_API["ML Service (/api/ml)"]

        ROUTER --> AUTH
        ROUTER --> TX
        ROUTER --> BUDGET
        ROUTER --> NOTIF
        ROUTER --> PRIVACY
        ROUTER --> ML_API
    end

    subgraph Data["Persistence & Models Tier"]
        DB[("SQLite 3 Database<br/>smartspend.db")]
        MODELS[("Serialized Artifacts (.joblib/.npy)<br/>data/models/")]
        TRAIN_DATA[("Public Research Dataset<br/>expenses_dataset.csv (n=360)")]
        MDP_SIM[("Q-Learning MDP Simulator<br/>SimulatedBudgetEnv")]
    end

    STORE <-->|"REST JSON / HTTP"| ROUTER
    AUTH <--> DB
    TX <--> DB
    BUDGET <--> DB
    NOTIF <--> DB
    PRIVACY <--> DB

    ML_API <-->|"Load on-demand"| MODELS
    ML_API <-->|"Train / Evaluate"| TRAIN_DATA
    ML_API <-->|"Simulate Episodes"| MDP_SIM
```

---

## 3. Strict Data Separation Protocol

To ensure privacy, mathematical validity, and zero data leakage, the system maintains strict physical separation between three distinct data domains:

1. **User Transaction Data (`data/smartspend.db`):**
   - Personal user finances, private banking transactions, user-defined budgets, and in-app alerts.
   - Encrypted at rest via SQLite, user-isolated by `user_id`. Never leaked into machine-learning training sets.
2. **Public Research Training Dataset (`data/expenses_dataset.csv`):**
   - 360 anonymized historical monthly household expense records.
   - Used exclusively by `backend/ml_pipeline.py` to fit scalers, regression models, classification models, and clusterers.
   - Preprocessing is fitted strictly on the $80\%$ training split ($n=288$); the $20\%$ hold-out split ($n=72$) is never seen during transformation fitting.
3. **Reinforcement Learning Simulation (`SimulatedBudgetEnv`):**
   - Fully synthetic Markov Decision Process (MDP) environment with stochastic shocks and daily action decisions.
   - Used exclusively for offline Q-table policy generation.

---

## 4. Relational Database Schema (`data/smartspend.db`)

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : owns
    USERS ||--o{ BUDGETS : defines
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ALERT_PREFERENCES : configures

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        string display_name
        string currency
        datetime created_at
    }

    TRANSACTIONS {
        int id PK
        int user_id FK
        float amount
        string type
        string category
        string description
        string date
        string notes
        datetime created_at
    }

    BUDGETS {
        int id PK
        int user_id FK
        string month
        float total_budget
        json category_budgets
        float savings_goal
        datetime updated_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string type
        string event_key UK
        int is_read
        datetime created_at
    }

    ALERT_PREFERENCES {
        int id PK
        int user_id FK
        int email_alerts
        int in_app_alerts
        int threshold_warning
        int threshold_exceeded
        datetime updated_at
    }
```

### Schema Integrity & Safeguards:
- `PRAGMA foreign_keys = ON`: Cascades deletions and rejects orphaned foreign keys.
- `PRAGMA busy_timeout = 5000`: Prevents database locking conflicts during concurrent reads.
- `transaction_scope()` Context Manager: Guarantees atomic `COMMIT` or rollbacks on unhandled exceptions.

---

## 5. Machine Learning Pipeline & Artifact Serialization

The offline and live training pipeline (`backend/ml_pipeline.py`) executes 11 experiments:

```mermaid
flowchart TD
    DS["Dataset: data/expenses_dataset.csv (N=360)"]
    SPLIT["Hold-Out Split: 80% Train (n=288) / 20% Test (n=72)"]
    DS --> SPLIT

    subgraph Training["Train-Only Fitting"]
        SCALER["Fit StandardScaler on X_train"]
        LR["Fit Linear, Poly, Ridge, Lasso"]
        CLF["Fit Logistic Regression & SVM"]
        KM["Fit K-Means & DBSCAN"]
        ENS["Fit Random Forest & Gradient Boosting"]
        QL["Execute 250 Episodes in SimulatedBudgetEnv"]
    end

    SPLIT --> Training

    subgraph Evaluation["Test-Set Evaluation (n=72)"]
        METRICS["Compute R2, RMSE, MAE, Confusion Matrix, Precision, Recall, F1"]
    end

    Training --> Evaluation

    subgraph Serialization["Artifacts: data/models/"]
        SAVED["16 Joblib & NPY Models + ml_metadata.joblib"]
    end

    Evaluation --> Serialization
```

---

## 6. Budget Progress, Alert & Security Flow

1. **Threshold Checks:** Whenever a transaction is created or modified, the backend calculates:
   $$\text{Utilization} = \frac{\sum \text{Expenses for Month}}{\text{Monthly Budget}} \times 100$$
2. **Duplicate Prevention:** In-app alerts use unique idempotency keys (`event_key = budget_warning_YYYY-MM` or `budget_exceeded_YYYY-MM`). Duplicate notifications are safely ignored by the database.
3. **Password Security:** Passwords hashed using PBKDF2-HMAC-SHA256 with 600,000 rounds and random salt.
4. **Data Privacy & GDPR Export:** `/api/privacy/export` dumps an authenticated user's records as structured JSON. `/api/privacy/purge` securely deletes all personal data across all tables.
