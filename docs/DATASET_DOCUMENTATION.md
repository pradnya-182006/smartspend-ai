# SmartSpend AI — Dataset & Methodology Documentation

## 1. Dataset Overview
- **File Path**: `data/expenses_dataset.csv`
- **Total Records**: 360 monthly financial observations (representing 30 household spending cycles over 12 months).
- **Target Audience / Currency**: Indian Rupee (INR, ₹).
- **Format**: Comma-Separated Values (CSV).

---

## 2. Feature Dictionary

| Feature Name | Type | Description | Range / Unit |
|---|---|---|---|
| `MonthIndex` | Integer | Month of tracking cycle (1 to 12) | 1 – 12 |
| `Income` | Continuous | Total monthly household earnings | ₹25,000 – ₹120,000 |
| `Rent` | Continuous | Fixed monthly housing expenditure | ₹6,000 – ₹35,000 |
| `Food` | Continuous | Groceries, dining out, and daily essentials | ₹3,000 – ₹25,000 |
| `Utilities` | Continuous | Electricity, broadband, gas, and mobile bills | ₹2,500 – ₹7,000 |
| `Shopping` | Continuous | Discretionary apparel, gadgets, lifestyle | ₹1,000 – ₹20,000 |
| `Travel` | Continuous | Fuel, commute, cab rides, transit passes | ₹2,000 – ₹8,000 |
| `Health` | Continuous | Medical supplies, checkups, insurance | ₹1,000 – ₹6,000 |
| `TotalExpenses` | Continuous | Continuous prediction target: Sum of all category spends | Calculated ($Rent + Food + ...$) |
| `Savings` | Continuous | Income minus TotalExpenses | Continuous (₹) |
| `SavingsRate` | Continuous | Net Savings / Income $\times 100$ | Percentage ($0\% - 65\%$) |
| `OverBudget` | Binary (0 / 1) | Classification Target ($1$ if TotalExpenses $> ₹45,000$, else $0$) | Discrete $\{0, 1\}$ |

---

## 3. Data Preprocessing & Validation
- **Missing Values**: Clean dataset with $0$ null values (`X.isnull().sum() == 0`).
- **Feature Scaling**: `StandardScaler` standardizes numeric inputs to zero mean and unit variance ($\mu = 0, \sigma = 1$).
- **Data Leakage Prevention**: Scalers and transformations are fitted **only** on training splits (80%) and evaluated out-of-sample on hold-out test splits (20%).
- **Chronological Separation**: Time-dependent features validate historical sequences to avoid using future information to predict past states.
