import os
import tempfile
import pytest
from backend.app import create_app
from backend.database import init_db, transaction_scope
from backend.config import Config

@pytest.fixture
def app():
    # Use temporary SQLite database file for testing
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    Config.DATABASE_PATH = db_path

    app = create_app()
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret-key-123"

    with app.app_context():
        init_db()
        # Seed test user ID 1
        with transaction_scope() as conn:
            conn.execute("""
                INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, currency)
                VALUES (1, 'test_user', 'test@smartspend.ai', 'hashedpwd123', 'Test User', 'INR')
            """)

    yield app

    os.close(db_fd)
    if os.path.exists(db_path):
        os.remove(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    return {"X-User-Id": "1"}
