import json
from flask import Blueprint, request, jsonify
from backend.database import get_db_connection, transaction_scope
from backend.auth import get_current_user_id

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

@budgets_bp.route("/<month>", methods=["GET"])
def get_budget(month):
    """Retrieves budget and progress for a specific month (YYYY-MM)."""
    user_id = get_current_user_id()
    conn = get_db_connection()

    # Get budget record
    budget_row = conn.execute(
        "SELECT * FROM budgets WHERE user_id = ? AND month = ?",
        (user_id, month)
    ).fetchone()

    total_budget = budget_row["total_budget"] if budget_row else 45000.0
    category_budgets = json.loads(budget_row["category_budgets"]) if budget_row else {}
    savings_goal = budget_row["savings_goal"] if budget_row else 20000.0

    # Calculate actual expenses and income for this month
    stats = conn.execute("""
        SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
    """, (user_id, f"{month}%")).fetchone()

    # Category spent breakdown
    cat_rows = conn.execute("""
        SELECT category, SUM(amount) as spent
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY category
    """, (user_id, f"{month}%")).fetchall()

    conn.close()

    total_income = float(stats["total_income"] or 0)
    total_expenses = float(stats["total_expenses"] or 0)
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0
    budget_utilization = (total_expenses / total_budget * 100) if total_budget > 0 else 0.0

    category_progress = []
    spent_map = {r["category"]: float(r["spent"]) for r in cat_rows}

    for cat, cap in category_budgets.items():
        spent = spent_map.get(cat, 0.0)
        category_progress.append({
            "category": cat,
            "budget": cap,
            "spent": spent,
            "remaining": cap - spent,
            "percentage": min(100.0, (spent / cap * 100)) if cap > 0 else 0.0,
            "is_exceeded": spent > cap
        })

    return jsonify({
        "month": month,
        "total_budget": total_budget,
        "category_budgets": category_budgets,
        "savings_goal": savings_goal,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": round(savings_rate, 1),
        "budget_utilization": round(budget_utilization, 1),
        "remaining_budget": total_budget - total_expenses,
        "savings_goal_progress": min(100.0, round((net_savings / savings_goal * 100), 1)) if savings_goal > 0 else 0.0,
        "category_progress": category_progress
    }), 200

@budgets_bp.route("", methods=["POST"])
def set_budget():
    """Sets or updates monthly budget and savings goal."""
    user_id = get_current_user_id()
    data = request.get_json() or {}

    month = data.get("month") # YYYY-MM
    total_budget = data.get("total_budget", 45000.0)
    category_budgets = data.get("category_budgets", {})
    savings_goal = data.get("savings_goal", 20000.0)

    if not month:
        return jsonify({"error": "Month (YYYY-MM) is required"}), 400
    if float(total_budget) < 0:
        return jsonify({"error": "Total budget cannot be negative"}), 400

    cat_json = json.dumps(category_budgets)

    with transaction_scope() as conn:
        conn.execute("""
            INSERT INTO budgets (user_id, month, total_budget, category_budgets, savings_goal)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, month) DO UPDATE SET
                total_budget = excluded.total_budget,
                category_budgets = excluded.category_budgets,
                savings_goal = excluded.savings_goal
        """, (user_id, month, float(total_budget), cat_json, float(savings_goal)))

    return jsonify({"message": "Budget saved successfully"}), 200

@budgets_bp.route("/what-if", methods=["POST"])
def simulate_what_if():
    """Simulates impact of reducing a category spend by X amount."""
    user_id = get_current_user_id()
    data = request.get_json() or {}
    category = data.get("category", "Shopping")
    reduction = float(data.get("reduction", 1000.0))
    month = data.get("month", "2026-10")

    conn = get_db_connection()
    current_spent = conn.execute("""
        SELECT SUM(amount) FROM transactions
        WHERE user_id = ? AND type = 'expense' AND category = ? AND date LIKE ?
    """, (user_id, category, f"{month}%")).fetchone()[0] or 0.0
    conn.close()

    new_spent = max(0.0, current_spent - reduction)
    return jsonify({
        "category": category,
        "original_spent": current_spent,
        "reduction": reduction,
        "projected_spent": new_spent,
        "projected_annual_savings": reduction * 12
    }), 200
