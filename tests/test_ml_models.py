import pytest
from pathlib import Path
import math
from backend.ml_pipeline import (
    train_and_save_all_models,
    get_or_train_metadata,
    predict_from_saved_models,
    MODELS_DIR
)

def test_pipeline_training_and_serialization():
    meta = train_and_save_all_models()
    assert meta["status"] == "Trained & Serialized"
    assert meta["train_samples"] == 288
    assert meta["test_samples"] == 72

    # Verify all 16 expected artifacts exist on disk
    expected_files = [
        "linear_regression.joblib",
        "ridge_regression.joblib",
        "lasso_regression.joblib",
        "poly_regression.joblib",
        "logistic_regression.joblib",
        "svm_linear.joblib",
        "svm_rbf.joblib",
        "kmeans.joblib",
        "dbscan.joblib",
        "random_forest.joblib",
        "gradient_boosting.joblib",
        "pca_model.joblib",
        "lda_model.joblib",
        "scaler_reg.joblib",
        "scaler_clf.joblib",
        "q_table.npy"
    ]
    for filename in expected_files:
        assert (MODELS_DIR / filename).exists(), f"Missing serialized artifact: {filename}"

def test_regression_metrics_consistency_and_no_target_leakage():
    meta = get_or_train_metadata()
    reg = meta["regression"]

    # Verify all 4 models are benchmarked
    for key in ["linear", "poly", "ridge", "lasso"]:
        assert key in reg
        m = reg[key]
        assert 0.0 < m["r2"] < 1.0, f"R2 must be a valid float between 0 and 1, got {m['r2']}"
        assert m["rmse"] > 0, "RMSE must be > 0 (confirms no exact identity target leakage)"
        assert m["mae"] > 0, "MAE must be > 0"
        assert m["rmse"] >= m["mae"], "RMSE must mathematically be >= MAE"

def test_classification_and_confusion_matrix_consistency():
    meta = get_or_train_metadata()
    clf = meta["classification"]
    cm = clf["confusion_matrix"]

    tn, fp, fn, tp = cm["tn"], cm["fp"], cm["fn"], cm["tp"]
    total = tn + fp + fn + tp
    assert total == meta["test_samples"] == 72, f"Confusion matrix total must equal test set size (72), got {total}"

    # Verify mathematical integrity of accuracy, precision, and recall
    expected_acc = round((tp + tn) / total * 100, 1)
    assert clf["accuracy"] == expected_acc, f"Expected accuracy {expected_acc}, got {clf['accuracy']}"

    expected_prec = round(tp / (tp + fp) * 100, 1)
    assert clf["precision"] == expected_prec, f"Expected precision {expected_prec}, got {clf['precision']}"

    expected_rec = round(tp / (tp + fn) * 100, 1)
    assert clf["recall"] == expected_rec, f"Expected recall {expected_rec}, got {clf['recall']}"

    # Verify F1-score calculation
    expected_f1 = round((2 * clf["precision"] * clf["recall"]) / (clf["precision"] + clf["recall"]), 1)
    assert abs(clf["f1"] - expected_f1) <= 0.1, f"Expected F1 {expected_f1}, got {clf['f1']}"

    # Verify scikit-learn matrix orientation
    assert clf["sklearn_matrix"] == [[tn, fp], [fn, tp]], "Scikit-learn matrix ordering must be [[TN, FP], [FN, TP]]"
    assert clf["positive_class"] == "Over Budget"
    assert clf["negative_class"] == "Within Budget"
    assert 50.0 <= clf["roc_auc"] <= 100.0, "ROC-AUC must be a valid probability percentage"

def test_pca_lda_and_clustering_metrics():
    meta = get_or_train_metadata()
    # PCA EVR
    assert len(meta["pca_evr"]) == 2
    assert sum(meta["pca_evr"]) > 40.0

    # LDA
    assert meta["lda_accuracy"] > 85.0

    # Clustering
    assert -1.0 <= meta["clustering"]["silhouette"] <= 1.0
    assert meta["clustering"]["dbscan_outliers"] > 0
    assert len(meta["clustering"]["clusters"]) == 3

def test_q_learning_learning_progress_and_baseline_outperformance():
    meta = get_or_train_metadata()
    q_data = meta["q_learning"]
    assert q_data["episodes"] == 250
    assert len(q_data["reward_curve"]) > 20
    assert len(q_data["policies"]) == 3

    # Learned policy must outperform naive fixed baseline
    assert q_data["avg_reward_final_50"] > q_data["baseline_reward"], (
        f"Learned reward ({q_data['avg_reward_final_50']}) should outperform baseline ({q_data['baseline_reward']})"
    )

def test_ensemble_random_forest_and_gradient_boosting():
    meta = get_or_train_metadata()
    ens = meta["ensemble"]
    assert ens["random_forest_accuracy"] > 70.0
    assert ens["gradient_boosting_accuracy"] > 70.0
    assert len(ens["importances"]) == 7

def test_live_prediction_from_loaded_models():
    sample_input = {
        "Income": 60000,
        "Rent": 16000,
        "Food": 11000,
        "Utilities": 4500,
        "Shopping": 7000,
        "Travel": 3500,
        "Health": 2000
    }
    result = predict_from_saved_models(sample_input)
    assert result["status"] == "success"
    preds = result["predictions"]

    assert preds["linear_regression_expense"] > 0
    assert preds["ridge_regression_expense"] > 0
    assert 0.0 <= preds["over_budget_probability"] <= 100.0
    assert preds["svm_classification"] in ("Over Budget", "Within Budget")

def test_ml_api_endpoints(client):
    res_meta = client.get("/api/ml/metadata")
    assert res_meta.status_code == 200
    data = res_meta.get_json()
    assert "regression" in data
    assert "classification" in data
    assert "q_learning" in data

    res_pred = client.post("/api/ml/predict", json={
        "Income": 50000,
        "Rent": 15000,
        "Food": 9000,
        "Utilities": 4000,
        "Shopping": 5000,
        "Travel": 3000,
        "Health": 2000
    })
    assert res_pred.status_code == 200
    assert "predictions" in res_pred.get_json()
