import csv
import io
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from backend.database import get_db_connection, transaction_scope
from backend.auth import get_current_user_id

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

VALID_CATEGORIES = {
    "Food", "Transport", "Shopping", "Bills", "Entertainment",
    "Health", "Salary", "Investment", "Freelance", "Other"
}

def validate_date(date_str):
    """Validates YYYY-MM-DD format."""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False

@transactions_bp.route("", methods=["GET"])
def get_transactions():
    user_id = get_current_user_id()
    month = request.args.get("month")         # YYYY-MM or 'all'
    category = request.args.get("category")
    tx_type = request.args.get("type")        # income or expense
    search = request.args.get("search", "").strip()

    query = "SELECT * FROM transactions WHERE user_id = ?"
    params = [user_id]

    if month and month != "all":
        query += " AND date LIKE ?"
        params.append(f"{month}%")

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if tx_type and tx_type in ("income", "expense"):
        query += " AND type = ?"
        params.append(tx_type)

    if search:
        query += " AND (description LIKE ? OR notes LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY date DESC, id DESC"

    conn = get_db_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows]), 200

@transactions_bp.route("", methods=["POST"])
def add_transaction():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    amount = data.get("amount")
    tx_type = data.get("type")
    category = data.get("category")
    description = data.get("description", "").strip()
    date_str = data.get("date")
    notes = data.get("notes", "").strip()

    # Validations
    if amount is None or float(amount) <= 0:
        return jsonify({"error": "Amount must be a positive number greater than 0"}), 400
    if tx_type not in ("income", "expense"):
        return jsonify({"error": "Type must be 'income' or 'expense'"}), 400
    if not category:
        return jsonify({"error": "Category is required"}), 400
    if not description:
        return jsonify({"error": "Description is required"}), 400
    if not validate_date(date_str):
        return jsonify({"error": "Date must be a valid YYYY-MM-DD"}), 400

    with transaction_scope() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, amount, type, category, description, date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, float(amount), tx_type, category, description, date_str, notes))
        new_id = cursor.lastrowid

    return jsonify({
        "message": "Transaction added successfully",
        "transaction": {
            "id": new_id,
            "user_id": user_id,
            "amount": float(amount),
            "type": tx_type,
            "category": category,
            "description": description,
            "date": date_str,
            "notes": notes
        }
    }), 201

@transactions_bp.route("/<int:tx_id>", methods=["PUT"])
def update_transaction(tx_id):
    user_id = get_current_user_id()
    data = request.get_json() or {}

    amount = data.get("amount")
    tx_type = data.get("type")
    category = data.get("category")
    description = data.get("description", "").strip()
    date_str = data.get("date")
    notes = data.get("notes", "").strip()

    if amount is not None and float(amount) <= 0:
        return jsonify({"error": "Amount must be positive"}), 400
    if tx_type and tx_type not in ("income", "expense"):
        return jsonify({"error": "Invalid transaction type"}), 400
    if date_str and not validate_date(date_str):
        return jsonify({"error": "Invalid date format"}), 400

    conn = get_db_connection()
    existing = conn.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)).fetchone()
    conn.close()

    if not existing:
        return jsonify({"error": "Transaction not found or unauthorized"}), 404

    with transaction_scope() as conn:
        conn.execute("""
            UPDATE transactions
            SET amount = COALESCE(?, amount),
                type = COALESCE(?, type),
                category = COALESCE(?, category),
                description = COALESCE(?, description),
                date = COALESCE(?, date),
                notes = COALESCE(?, notes)
            WHERE id = ? AND user_id = ?
        """, (
            float(amount) if amount is not None else None,
            tx_type,
            category,
            description or None,
            date_str,
            notes or None,
            tx_id,
            user_id
        ))

    return jsonify({"message": "Transaction updated successfully"}), 200

@transactions_bp.route("/<int:tx_id>", methods=["DELETE"])
def delete_transaction(tx_id):
    user_id = get_current_user_id()
    with transaction_scope() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
        if cursor.rowcount == 0:
            return jsonify({"error": "Transaction not found or unauthorized"}), 404

    return jsonify({"message": "Transaction deleted successfully"}), 200

MAX_CSV_ROWS = 5000

@transactions_bp.route("/import-csv", methods=["POST"])
def import_csv():
    user_id = get_current_user_id()
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        raw = file.read()
        if len(raw) > 10 * 1024 * 1024:
            return jsonify({"error": "CSV file size exceeds 10MB limit."}), 400
        content = raw.decode("utf-8") if isinstance(raw, bytes) else str(raw)
        reader = list(csv.DictReader(io.StringIO(content.strip())))
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 400

    if len(reader) > MAX_CSV_ROWS:
        return jsonify({"error": f"CSV contains {len(reader)} rows, exceeding maximum limit of {MAX_CSV_ROWS} rows."}), 400

    imported = 0
    errors = []

    with transaction_scope() as conn:
        cursor = conn.cursor()
        for idx, row in enumerate(reader, start=1):
            try:
                date_val = row.get("date") or row.get("Date") or ""
                desc_val = row.get("description") or row.get("Description") or "CSV Import"
                cat_val = row.get("category") or row.get("Category") or "Other"
                amt_val = row.get("amount") or row.get("Amount") or "0"
                type_val = (row.get("type") or row.get("Type") or "expense").lower()

                amt_clean = float(re.sub(r"[^\d.]", "", str(amt_val)))
                if amt_clean <= 0:
                    continue

                if not validate_date(date_val):
                    date_val = datetime.now().strftime("%Y-%m-%d")

                # Insert row
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, category, description, date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (user_id, amt_clean, type_val, cat_val, desc_val, date_val, "Imported from CSV"))
                imported += 1
            except Exception as row_err:
                errors.append(f"Row {idx}: {str(row_err)}")

    return jsonify({
        "message": f"Successfully imported {imported} transactions",
        "imported_count": imported,
        "errors": errors[:5]
    }), 200

@transactions_bp.route("/export-csv", methods=["GET"])
def export_csv():
    user_id = get_current_user_id()
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT date, description, category, type, amount, notes FROM transactions WHERE user_id = ? ORDER BY date DESC",
        (user_id,)
    ).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Category", "Type", "Amount", "Notes"])

    for row in rows:
        writer.writerow([row["date"], row["description"], row["category"], row["type"], row["amount"], row["notes"] or ""])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=smartspend_transactions.csv"}
    )
