import sys
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from werkzeug.security import generate_password_hash
from backend.database import init_db, transaction_scope

DEMO_USER_ID = 1
DEMO_EMAIL = "demo@smartspend.ai"
DEMO_USERNAME = "demo_user"
DEMO_PASSWORD_PLAIN = "smartspend123"

def seed_demo_records(reset=False):
    """
    Initializes or resets a repeatable, fictional demonstration environment
    isolated exclusively to DEMO_USER_ID (1). Real user records are strictly preserved.
    """
    init_db()

    with transaction_scope() as conn:
        cursor = conn.cursor()

        if reset:
            print("[INFO] Resetting demo environment for demo_user (User ID 1)...")
            cursor.execute("DELETE FROM transactions WHERE user_id = ?", (DEMO_USER_ID,))
            cursor.execute("DELETE FROM budgets WHERE user_id = ?", (DEMO_USER_ID,))
            cursor.execute("DELETE FROM notifications WHERE user_id = ?", (DEMO_USER_ID,))
            print("[INFO] Cleared previous demo records. Re-seeding clean fictional records...")

        # 1. Create or Update Default Demo User
        pwd_hash = generate_password_hash(DEMO_PASSWORD_PLAIN)
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, display_name, currency)
            VALUES (?, ?, ?, ?, 'College Demo User (Fictional)', 'INR')
            ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash
        """, (DEMO_USER_ID, DEMO_USERNAME, DEMO_EMAIL, pwd_hash))

        # 2. Default Budget & Savings Goal for current demo month (October 2026)
        cat_budgets = {
            "Food": 12000,
            "Rent": 15000,
            "Bills": 6000,
            "Shopping": 5000,
            "Transport": 4000,
            "Health": 3000
        }
        cursor.execute("""
            INSERT OR REPLACE INTO budgets (user_id, month, total_budget, category_budgets, savings_goal)
            VALUES (?, '2026-10', 45000, ?, 20000)
        """, (DEMO_USER_ID, json.dumps(cat_budgets)))

        # 3. Realistic, Fictional Demonstration Transactions for October 2026
        demo_txs = [
            (DEMO_USER_ID, 117500, "income", "Salary", "[DEMO] October Professional Salary & Dividend", "2026-10-01", "Primary monthly income (Fictional)"),
            (DEMO_USER_ID, 18500, "expense", "Bills", "[DEMO] Apartment Rent & Society Maintenance", "2026-10-02", "Essential housing commitment"),
            (DEMO_USER_ID, 3150, "expense", "Bills", "[DEMO] Electricity & Broadband Bill", "2026-10-14", "Fixed monthly utility"),
            (DEMO_USER_ID, 7800, "expense", "Shopping", "[DEMO] Diwali Festive Shopping & Gifts", "2026-10-12", "Discretionary festive shopping"),
            (DEMO_USER_ID, 3200, "expense", "Food", "[DEMO] Weekend Dineout with Family", "2026-10-10", "Social restaurant dining"),
            (DEMO_USER_ID, 1750, "expense", "Health", "[DEMO] Dental Checkup & Vitamins", "2026-10-18", "Annual routine health checkup"),
            (DEMO_USER_ID, 899, "expense", "Entertainment", "[DEMO] Netflix & Spotify Premium", "2026-10-16", "Recurring digital entertainment"),
            (DEMO_USER_ID, 4500, "income", "Investment", "[DEMO] Mutual Fund Dividend Payout", "2026-10-15", "Liquid fund return"),
            (DEMO_USER_ID, 2400, "expense", "Transport", "[DEMO] Metro Monthly Travel Smart Card", "2026-10-05", "Daily office commute"),
            (DEMO_USER_ID, 4850, "expense", "Food", "[DEMO] Supermarket Grocery Restock", "2026-10-08", "Monthly home essentials"),
        ]

        existing = cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (DEMO_USER_ID,)).fetchone()[0]
        if existing == 0 or reset:
            cursor.executemany("""
                INSERT INTO transactions (user_id, amount, type, category, description, date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, demo_txs)
            print(f"[SUCCESS] Seeded {len(demo_txs)} fictional demo transactions for User 1.")
        else:
            print(f"[INFO] Demo user already has {existing} transactions. Use --reset to re-seed clean records.")

        # 4. Create sample Alert / Notification
        cursor.execute("""
            INSERT OR IGNORE INTO notifications (user_id, title, message, type, event_key, is_read)
            VALUES (?, '[DEMO] Welcome to SmartSpend AI', 'System initialized with local SQLite database & scikit-learn ML models.', 'success', 'welcome_msg', 0)
        """, (DEMO_USER_ID,))

    print(f"[DONE] Demo setup ready. Credentials: Username '{DEMO_USERNAME}' or Email '{DEMO_EMAIL}', Password '{DEMO_PASSWORD_PLAIN}'.")

if __name__ == "__main__":
    should_reset = "--reset" in sys.argv
    seed_demo_records(reset=should_reset)
