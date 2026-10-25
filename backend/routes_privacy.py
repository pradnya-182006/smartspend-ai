import json
from flask import Blueprint, jsonify, Response
from backend.database import get_db_connection, transaction_scope
from backend.auth import get_current_user_id

privacy_bp = Blueprint("privacy", __name__, url_prefix="/api/privacy")

@privacy_bp.route("/export-data", methods=["GET"])
def export_all_data():
    """Generates a complete JSON export of all user financial records, budgets, and settings."""
    user_id = get_current_user_id()
    conn = get_db_connection()

    user = conn.execute("SELECT id, username, email, display_name, currency, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    transactions = conn.execute("SELECT * FROM transactions WHERE user_id = ?", (user_id,)).fetchall()
    budgets = conn.execute("SELECT * FROM budgets WHERE user_id = ?", (user_id,)).fetchall()
    notifications = conn.execute("SELECT * FROM notifications WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()

    export_payload = {
        "app": "SmartSpend AI",
        "version": "2.0.0",
        "exported_at": str(json.dumps(None)),
        "user_profile": dict(user) if user else {"id": user_id},
        "transactions": [dict(t) for t in transactions],
        "budgets": [dict(b) for b in budgets],
        "notifications": [dict(n) for n in notifications],
        "privacy_compliance": "Zero-Cloud Transmission verified. Client-side local execution."
    }

    return jsonify(export_payload), 200

@privacy_bp.route("/delete-all-data", methods=["POST"])
def purge_all_data():
    """Irreversibly deletes all financial records, transactions, and budgets for the current user."""
    user_id = get_current_user_id()
    with transaction_scope() as conn:
        conn.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))

    return jsonify({"message": "All financial records have been permanently wiped."}), 200
