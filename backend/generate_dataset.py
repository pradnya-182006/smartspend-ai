import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)
data_dir = Path(__file__).resolve().parent.parent / "data"
data_dir.mkdir(exist_ok=True)
csv_path = data_dir / "expenses_dataset.csv"

# Generate 360 monthly financial observations (e.g. 30 households over 12 months)
n_samples = 360

income = np.random.normal(55000, 12000, n_samples).clip(25000, 120000).round()
rent = (income * np.random.uniform(0.22, 0.32, n_samples)).round()
food = (income * np.random.uniform(0.15, 0.25, n_samples) + np.random.normal(0, 800, n_samples)).clip(3000).round()
utilities = (np.random.uniform(2500, 7000, n_samples)).round()
shopping = (income * np.random.uniform(0.05, 0.20, n_samples) + np.random.normal(0, 1500, n_samples)).clip(1000).round()
travel = (np.random.uniform(2000, 8000, n_samples)).round()
health = (np.random.uniform(1000, 6000, n_samples)).round()
# Unbudgeted incidental cash & miscellaneous variance (prevents identity target leakage)
misc = (np.random.normal(2500, 800, n_samples)).clip(800, 6000).round()

total_expenses = rent + food + utilities + shopping + travel + health + misc
savings = income - total_expenses
savings_rate = ((savings / income) * 100).round(1)

# Target: Over Budget threshold defined at 45,000 monthly spending limit
over_budget = (total_expenses > 45000).astype(int)

# Create DataFrame
df = pd.DataFrame({
    "MonthIndex": np.tile(np.arange(1, 13), n_samples // 12),
    "Income": income,
    "Rent": rent,
    "Food": food,
    "Utilities": utilities,
    "Shopping": shopping,
    "Travel": travel,
    "Health": health,
    "Miscellaneous": misc,
    "TotalExpenses": total_expenses,
    "Savings": savings,
    "SavingsRate": savings_rate,
    "OverBudget": over_budget
})

df.to_csv(csv_path, index=False)
print(f"Dataset generated at {csv_path} with {len(df)} rows.")
