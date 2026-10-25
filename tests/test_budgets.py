def test_budget_creation_and_progress(client, auth_headers):
    # Set budget
    payload = {
        "month": "2026-10",
        "total_budget": 40000.0,
        "category_budgets": {"Food": 10000, "Bills": 15000},
        "savings_goal": 20000.0
    }
    set_res = client.post("/api/budgets", json=payload, headers=auth_headers)
    assert set_res.status_code == 200

    # Add transaction
    client.post("/api/transactions", json={"amount": 8000, "type": "expense", "category": "Food", "description": "Groceries", "date": "2026-10-05"}, headers=auth_headers)

    # Fetch budget progress
    get_res = client.get("/api/budgets/2026-10", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.get_json()
    assert data["total_budget"] == 40000.0
    assert data["total_expenses"] == 8000.0
    assert data["budget_utilization"] == 20.0

def test_what_if_simulation(client, auth_headers):
    client.post("/api/transactions", json={"amount": 5000, "type": "expense", "category": "Shopping", "description": "Clothes", "date": "2026-10-10"}, headers=auth_headers)
    sim_res = client.post("/api/budgets/what-if", json={"category": "Shopping", "reduction": 1500, "month": "2026-10"}, headers=auth_headers)
    assert sim_res.status_code == 200
    data = sim_res.get_json()
    assert data["projected_spent"] == 3500.0
    assert data["projected_annual_savings"] == 18000.0

def test_alert_threshold_and_duplicate_prevention(client, auth_headers):
    # Set 40k budget
    client.post("/api/budgets", json={"month": "2026-10", "total_budget": 40000, "category_budgets": {}, "savings_goal": 10000}, headers=auth_headers)
    # Spend 35k (87.5% > 80% threshold)
    client.post("/api/transactions", json={"amount": 35000, "type": "expense", "category": "Bills", "description": "Emergency bill", "date": "2026-10-12"}, headers=auth_headers)

    # First check triggers alert
    check1 = client.post("/api/notifications/check-alerts", json={"month": "2026-10"}, headers=auth_headers)
    assert check1.status_code == 200
    assert "threshold" in check1.get_json()["new_alerts_triggered"]

    # Second check must NOT duplicate alert
    check2 = client.post("/api/notifications/check-alerts", json={"month": "2026-10"}, headers=auth_headers)
    assert check2.status_code == 200
    assert len(check2.get_json()["new_alerts_triggered"]) == 0
