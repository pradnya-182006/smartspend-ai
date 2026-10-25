def test_user_registration_and_login(client):
    reg_payload = {
        "username": "alex_tester",
        "email": "alex@test.com",
        "password": "securepassword123",
        "display_name": "Alex Tester"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # Login with valid credentials
    login_res = client.post("/api/auth/login", json={"username": "alex_tester", "password": "securepassword123"})
    assert login_res.status_code == 200

    # Login with invalid password
    bad_login = client.post("/api/auth/login", json={"username": "alex_tester", "password": "wrongpassword"})
    assert bad_login.status_code == 401

def test_privacy_export_and_purge(client, auth_headers):
    # Add record
    client.post("/api/transactions", json={"amount": 999, "type": "expense", "category": "Food", "description": "Coffee", "date": "2026-10-20"}, headers=auth_headers)

    # Export
    export_res = client.get("/api/privacy/export-data", headers=auth_headers)
    assert export_res.status_code == 200
    export_data = export_res.get_json()
    assert "transactions" in export_data
    assert len(export_data["transactions"]) >= 1

    # Purge
    purge_res = client.post("/api/privacy/delete-all-data", headers=auth_headers)
    assert purge_res.status_code == 200

    # Verify transactions are cleared
    get_txs = client.get("/api/transactions", headers=auth_headers)
    assert len(get_txs.get_json()) == 0

def test_ml_input_validation_and_rate_limiting(client):
    # Test invalid string amount in predict
    bad_pred1 = client.post("/api/ml/predict", json={"Income": "invalid_string"})
    assert bad_pred1.status_code == 400
    assert "numeric" in bad_pred1.get_json()["error"]

    # Test negative amount in predict
    bad_pred2 = client.post("/api/ml/predict", json={"Income": -500})
    assert bad_pred2.status_code == 400
    assert "between 0 and 100,000,000" in bad_pred2.get_json()["error"]

    # Test valid prediction
    good_pred = client.post("/api/ml/predict", json={"Income": 50000, "Rent": 15000})
    assert good_pred.status_code == 200
    assert "predictions" in good_pred.get_json()

    # Test rate-limiting debounce on retrain
    # Trigger first retrain or check cooldown
    client.post("/api/ml/retrain")
    fast_retrain = client.post("/api/ml/retrain")
    assert fast_retrain.status_code == 429
    assert "rate-limited" in fast_retrain.get_json()["error"]

