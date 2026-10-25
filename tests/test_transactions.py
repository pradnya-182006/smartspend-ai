import io

def test_add_transaction_success(client, auth_headers):
    payload = {
        "amount": 2500.0,
        "type": "expense",
        "category": "Food",
        "description": "Weekly Groceries",
        "date": "2026-10-15",
        "notes": "Supermarket purchase"
    }
    response = client.post("/api/transactions", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data["transaction"]["amount"] == 2500.0
    assert data["transaction"]["category"] == "Food"

def test_add_transaction_validation_errors(client, auth_headers):
    # Negative amount
    bad_amount = client.post("/api/transactions", json={"amount": -50, "type": "expense", "category": "Food", "description": "Test", "date": "2026-10-15"}, headers=auth_headers)
    assert bad_amount.status_code == 400

    # Invalid date format
    bad_date = client.post("/api/transactions", json={"amount": 100, "type": "expense", "category": "Food", "description": "Test", "date": "15-10-2026"}, headers=auth_headers)
    assert bad_date.status_code == 400

def test_get_transactions_filter(client, auth_headers):
    # Insert income and expense
    client.post("/api/transactions", json={"amount": 50000, "type": "income", "category": "Salary", "description": "Salary", "date": "2026-10-01"}, headers=auth_headers)
    client.post("/api/transactions", json={"amount": 2000, "type": "expense", "category": "Transport", "description": "Cab ride", "date": "2026-10-05"}, headers=auth_headers)

    # Filter by type=expense
    res = client.get("/api/transactions?type=expense", headers=auth_headers)
    assert res.status_code == 200
    txs = res.get_json()
    assert all(t["type"] == "expense" for t in txs)

def test_delete_transaction(client, auth_headers):
    create_res = client.post("/api/transactions", json={"amount": 1200, "type": "expense", "category": "Shopping", "description": "Shirt", "date": "2026-10-10"}, headers=auth_headers)
    tx_id = create_res.get_json()["transaction"]["id"]

    del_res = client.delete(f"/api/transactions/{tx_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Deleting again should return 404
    del_res2 = client.delete(f"/api/transactions/{tx_id}", headers=auth_headers)
    assert del_res2.status_code == 404

def test_csv_import_and_export(client, auth_headers):
    csv_data = "Date,Description,Category,Type,Amount\n2026-10-01,Bonus,Salary,income,15000\n2026-10-02,Dinner,Food,expense,1200\n"
    data = {"file": (io.BytesIO(csv_data.encode("utf-8")), "test.csv")}

    import_res = client.post("/api/transactions/import-csv", data=data, content_type="multipart/form-data", headers=auth_headers)
    assert import_res.status_code == 200
    assert import_res.get_json()["imported_count"] == 2

    # Export CSV check
    export_res = client.get("/api/transactions/export-csv", headers=auth_headers)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.content_type
    assert b"Bonus" in export_res.data
