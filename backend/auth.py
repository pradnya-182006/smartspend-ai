from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from backend.database import get_db_connection, transaction_scope

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            # Check for Demo Header or Query param if testing
            user_id = request.headers.get("X-User-Id")
            if user_id:
                session["user_id"] = int(user_id)
            else:
                return jsonify({"error": "Authentication required. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user_id():
    """Returns the authenticated user ID, or defaults to 1 for demo sandbox mode."""
    return session.get("user_id", 1)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    display_name = data.get("display_name", username)

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    pwd_hash = generate_password_hash(password)

    try:
        with transaction_scope() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
                (username, email, pwd_hash, display_name),
            )
            user_id = cursor.lastrowid
            session["user_id"] = user_id
            session["username"] = username

            # Initialize default alert preference
            cursor.execute("INSERT OR IGNORE INTO alert_preferences (user_id) VALUES (?)", (user_id,))

        return jsonify({
            "message": "User registered successfully",
            "user": {"id": user_id, "username": username, "email": email, "display_name": display_name}
        }), 201
    except Exception as e:
        if "UNIQUE" in str(e):
            return jsonify({"error": "Username or email already exists"}), 409
        return jsonify({"error": "Registration failed"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username_or_email = data.get("username", "").strip().lower()
    password = data.get("password", "")

    if not username_or_email or not password:
        return jsonify({"error": "Please provide username and password"}), 400

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
        (username_or_email, username_or_email),
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({
        "message": "Logged in successfully",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "display_name": user["display_name"],
            "currency": user["currency"],
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id", 1)
    conn = get_db_connection()
    user = conn.execute("SELECT id, username, email, display_name, currency FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if not user:
        # Provide default authenticated demo user
        return jsonify({
            "id": 1,
            "username": "student_demo",
            "email": "student@smartspend.ai",
            "display_name": "College Project Demo User",
            "currency": "INR",
            "is_demo": True
        }), 200

    return jsonify(dict(user)), 200
