from flask import Blueprint, request, jsonify
from backend.database import get_db_connection, transaction_scope
from backend.auth import get_current_user_id

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
def get_notifications():
    user_id = get_current_user_id()
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    """, (user_id,)).fetchall()
    conn.close()

    unread_count = sum(1 for r in rows if r["is_read"] == 0)
    return jsonify({
        "unread_count": unread_count,
        "notifications": [dict(r) for r in rows]
    }), 200

@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
def mark_as_read(notif_id):
    user_id = get_current_user_id()
    with transaction_scope() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notif_id, user_id))
    return jsonify({"message": "Marked as read"}), 200

@notifications_bp.route("/check-alerts", methods=["POST"])
def check_alerts():
    """Evaluates current month spending and generates in-app notifications without duplicates."""
    user_id = get_current_user_id()
    data = request.get_json() or {}
    month = data.get("month", "2026-10")

    conn = get_db_connection()

    # Get user budget
    budget_row = conn.execute("SELECT total_budget FROM budgets WHERE user_id = ? AND month = ?", (user_id, month)).fetchone()
    total_budget = budget_row["total_budget"] if budget_row else 45000.0

    # Get total expense
    spent_row = conn.execute("""
        SELECT SUM(amount) FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
    """, (user_id, f"{month}%")).fetchone()
    spent = float(spent_row[0] or 0.0)

    # Get preferences
    pref_row = conn.execute("SELECT threshold_pct FROM alert_preferences WHERE user_id = ?", (user_id,)).fetchone()
    threshold_pct = pref_row["threshold_pct"] if pref_row else 80.0

    conn.close()

    new_notifications = []
    utilization = (spent / total_budget * 100) if total_budget > 0 else 0.0

    with transaction_scope() as conn:
        cursor = conn.cursor()

        # Check 1: Over 100% budget
        if utilization >= 100:
            key = f"exceeded_{month}"
            existing = cursor.execute("SELECT id FROM notifications WHERE user_id = ? AND event_key = ?", (user_id, key)).fetchone()
            if not existing:
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, event_key)
                    VALUES (?, ?, ?, 'danger', ?)
                """, (user_id, "Budget Exceeded!", f"You have exceeded your {month} monthly limit by ₹{int(spent - total_budget):,}.", key))
                new_notifications.append("exceeded")

        # Check 2: Warning Threshold (e.g. 80%)
        elif utilization >= threshold_pct:
            key = f"threshold_{int(threshold_pct)}_{month}"
            existing = cursor.execute("SELECT id FROM notifications WHERE user_id = ? AND event_key = ?", (user_id, key)).fetchone()
            if not existing:
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, event_key)
                    VALUES (?, ?, ?, 'warning', ?)
                """, (user_id, f"Budget Alert: {int(threshold_pct)}% Reached", f"You have spent {round(utilization, 1)}% of your monthly budget for {month}.", key))
                new_notifications.append("threshold")

    return jsonify({
        "status": "checked",
        "utilization_pct": round(utilization, 1),
        "new_alerts_triggered": new_notifications
    }), 200
