from flask import Blueprint, request, jsonify
from backend.ml_pipeline import (
    get_or_train_metadata,
    train_and_save_all_models,
    predict_from_saved_models
)

ml_bp = Blueprint("ml", __name__, url_prefix="/api/ml")

import time
import math

_LAST_RETRAIN_TIMESTAMP = 0
_RETRAIN_COOLDOWN_SECONDS = 5  # minimum seconds between retrain calls

@ml_bp.route("/metadata", methods=["GET"])
def get_ml_metadata():
    """Returns the full evaluation results, train/test metrics, and training timestamp."""
    try:
        data = get_or_train_metadata()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve ML metadata: {str(e)}"}), 500

@ml_bp.route("/retrain", methods=["POST"])
def retrain_models():
    """Executes fresh training of all 11 experiments and updates serialized artifacts with debounce protection."""
    global _LAST_RETRAIN_TIMESTAMP
    now = time.time()
    if now - _LAST_RETRAIN_TIMESTAMP < _RETRAIN_COOLDOWN_SECONDS:
        remaining = int(_RETRAIN_COOLDOWN_SECONDS - (now - _LAST_RETRAIN_TIMESTAMP))
        return jsonify({
            "error": f"Retraining is rate-limited. Please wait {remaining} seconds before requesting another model retrain."
        }), 429

    try:
        _LAST_RETRAIN_TIMESTAMP = now
        meta = train_and_save_all_models()
        return jsonify({
            "message": "All 11 ML experiments trained and saved successfully.",
            "metadata": meta
        }), 200
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500

@ml_bp.route("/predict", methods=["POST"])
def predict():
    """Performs genuine inference using the serialized model artifacts with bounds validation."""
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request payload. Expected a JSON object."}), 400

    feature_fields = ["Income", "Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]
    for field in feature_fields:
        if field in data and data[field] is not None:
            val = data[field]
            try:
                num_val = float(val)
                if math.isnan(num_val) or math.isinf(num_val):
                    return jsonify({"error": f"Feature '{field}' cannot be NaN or Infinite."}), 400
                if not (0 <= num_val <= 100_000_000):
                    return jsonify({"error": f"Feature '{field}' must be between 0 and 100,000,000."}), 400
            except (ValueError, TypeError):
                return jsonify({"error": f"Feature '{field}' must be a valid numeric amount."}), 400

    try:
        result = predict_from_saved_models(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

@ml_bp.route("/experiments/<exp_id>", methods=["GET"])
def get_experiment_details(exp_id):
    """Returns granular evaluated experiment results from the trained metadata."""
    meta = get_or_train_metadata()
    if exp_id in ("1", "exp1"):
        return jsonify({
            "title": "Exp 1: Feature Engineering & Preprocessing Pipeline",
            "status": "Trained",
            "last_trained_at": meta["last_trained_at"],
            "train_samples": meta["train_samples"],
            "test_samples": meta["test_samples"]
        }), 200
    elif exp_id in ("2", "exp2", "pca_lda"):
        return jsonify({
            "title": "Exp 2: Dimensionality Reduction (PCA & LDA)",
            "pca_evr": meta["pca_evr"],
            "lda_accuracy": meta["lda_accuracy"],
            "total_variance_explained": sum(meta["pca_evr"])
        }), 200
    elif exp_id in ("3", "4", "5", "regression"):
        return jsonify({
            "title": "Exp 3–5: Regression Benchmark Comparison",
            "metrics": meta["regression"]
        }), 200
    elif exp_id in ("6", "7", "classification"):
        return jsonify({
            "title": "Exp 6 & 7: Classification (Logistic Regression & SVM)",
            "logistic": meta["classification"],
            "svm": meta["svm"]
        }), 200
    elif exp_id in ("8", "9", "clustering"):
        return jsonify({
            "title": "Exp 8 & 9: Clustering (K-Means & DBSCAN)",
            "clustering": meta["clustering"]
        }), 200
    elif exp_id in ("10", "ensemble"):
        return jsonify({
            "title": "Exp 10: Ensemble Learning (Random Forest & Gradient Boosting)",
            "ensemble": meta["ensemble"]
        }), 200
    elif exp_id in ("11", "q_learning"):
        return jsonify({
            "title": "Exp 11: Q-Learning Budget Allocator Agent",
            "q_learning": meta["q_learning"]
        }), 200
    else:
        return jsonify({"error": f"Experiment '{exp_id}' not found"}), 404
