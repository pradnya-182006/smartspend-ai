import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SMARTSPEND_SECRET_KEY", "smartspend-fintech-supersecret-key-2026")
    DATABASE_PATH = os.environ.get("SMARTSPEND_DB_PATH", str(DATA_DIR / "smartspend.db"))
    DATASET_PATH = str(DATA_DIR / "expenses_dataset.csv")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
