def test_net_savings_calculation():
    income = 100000.0
    expenses = 65000.0
    net_savings = income - expenses
    savings_rate = (net_savings / income) * 100
    assert net_savings == 35000.0
    assert savings_rate == 35.0

def test_zero_income_safe_handling():
    income = 0.0
    expenses = 25000.0
    net_savings = income - expenses
    savings_rate = (net_savings / income * 100) if income > 0 else 0.0
    assert net_savings == -25000.0
    assert savings_rate == 0.0  # Must not raise ZeroDivisionError

def test_budget_utilization_calculation():
    expenses = 36000.0
    budget = 45000.0
    utilization = (expenses / budget) * 100
    assert utilization == 80.0

def test_missing_budget_safe_handling():
    expenses = 12000.0
    budget = 0.0
    utilization = (expenses / budget * 100) if budget > 0 else 0.0
    assert utilization == 0.0
