import os
from flask import Flask, jsonify
from backend.config import Config
from backend.database import init_db
from backend.auth import auth_bp
from backend.routes_transactions import transactions_bp
from backend.routes_budgets import budgets_bp
from backend.routes_notifications import notifications_bp
from backend.routes_privacy import privacy_bp
from backend.routes_ml import ml_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize SQLite database schema
    init_db()

    # Simple CORS handler for development with Vite frontend
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-User-Id"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return response

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(privacy_bp)
    app.register_blueprint(ml_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "app": "SmartSpend AI Backend",
            "version": "2.0.0",
            "ml_engine": "scikit-learn 1.8.0",
            "database": "SQLite 3"
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting SmartSpend AI Backend on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
