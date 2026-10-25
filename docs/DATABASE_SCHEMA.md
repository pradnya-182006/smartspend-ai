# SmartSpend AI — SQLite Database Architecture & Schema

## 1. Database Specifications
- **RDBMS**: SQLite 3
- **File Location**: `data/smartspend.db`
- **Integrity**: `PRAGMA foreign_keys = ON;`
- **Transactions**: Atomic `transaction_scope()` with automatic rollback on unhandled exceptions.

---

## 2. Table Schemas & Indexes

### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| `username` | TEXT | UNIQUE, NOT NULL | Account login username |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `password_hash` | TEXT | NOT NULL | Werkzeug pbkdf2:sha256 hash |
| `display_name` | TEXT | NOT NULL | Profile display name |
| `currency` | TEXT | DEFAULT 'INR' | Active display currency code |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### Table: `transactions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique record ID |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` ON DELETE CASCADE | Data isolation owner |
| `amount` | REAL | NOT NULL, CHECK(amount > 0) | Transaction value |
| `type` | TEXT | NOT NULL, CHECK(type IN ('income', 'expense')) | Financial flow |
| `category` | TEXT | NOT NULL | Expenditure or income bucket |
| `description` | TEXT | NOT NULL | Human-readable title |
| `date` | TEXT | NOT NULL (YYYY-MM-DD) | Date of transaction |
| `notes` | TEXT | NULLABLE | Optional details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_tx_user_date` on `(user_id, date)` for instant monthly filtering.
- `idx_tx_category` on `(category)` for rapid category aggregation.

### Table: `budgets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Record ID |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` ON DELETE CASCADE | Owner |
| `month` | TEXT | NOT NULL (YYYY-MM) | Budget tracking period |
| `total_budget` | REAL | NOT NULL DEFAULT 45000 | Monthly overall spending limit |
| `category_budgets` | TEXT | NOT NULL DEFAULT '{}' | JSON map of category caps |
| `savings_goal` | REAL | NOT NULL DEFAULT 20000 | Target savings |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp |

**Constraint:** `UNIQUE (user_id, month)` ensures one master budget per month per user.

### Table: `notifications`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Alert identifier |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` ON DELETE CASCADE | Target recipient |
| `title` | TEXT | NOT NULL | Alert summary |
| `message` | TEXT | NOT NULL | Detailed warning/success text |
| `type` | TEXT | NOT NULL CHECK(type IN ('danger', 'warning', 'info', 'success')) | Visual style |
| `event_key` | TEXT | NULLABLE | Duplicate alert prevention key |
| `is_read` | INTEGER | DEFAULT 0 | Read flag |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
