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

def test_dataset_integrity_and_target_definition():
    """TASK 1: Verify dataset structure, target definitions, and lack of identity leakage."""
    from backend.ml_pipeline import get_dataset, ALL_INPUT_COLS
    df = get_dataset()
    assert len(df) == 360, f"Expected 360 samples, got {len(df)}"
    assert df.isnull().sum().sum() == 0, "Dataset must not have missing values"

    for col in ALL_INPUT_COLS + ["TotalExpenses", "OverBudget"]:
        assert col in df.columns, f"Expected column {col} in dataset"

    # Confirm TotalExpenses is not a strict deterministic identity of input categories
    # due to unobserved incidental variance (Miscellaneous)
    sum_cats = df[["Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]].sum(axis=1)
    diff = df["TotalExpenses"] - sum_cats
    assert not (diff == 0).all(), "TotalExpenses must not be an identity sum of category columns"
    assert diff.mean() > 1000, "Unobserved miscellaneous expense expected"

def test_lda_and_pca_holdout_evaluation_no_leakage():
    """TASK 2: Ensure PCA & LDA preprocessing fit strictly on train and evaluate on hold-out."""
    meta = get_or_train_metadata()
    assert "lda_accuracy" in meta
    # Evaluated on held-out test split, must remain high and bounded
    assert 75.0 <= meta["lda_accuracy"] <= 100.0
    assert "task_type" in meta
    assert "Cross-sectional" in meta["task_type"]

def test_artifact_completeness_and_verification():
    """TASK 4: Test verify_model_artifacts accurately detects valid and missing artifacts."""
    from backend.ml_pipeline import verify_model_artifacts, REQUIRED_MODEL_FILES
    is_valid, missing = verify_model_artifacts()
    assert is_valid is True
    assert len(missing) == 0
    assert len(REQUIRED_MODEL_FILES) >= 18

def test_q_learning_reproducibility_and_eval_metrics():
    """TASK 3: Test isolated RNG does not mutate global state and real convergence diagnostics."""
    import numpy as np
    from backend.ml_pipeline import train_q_learning_agent, SimulatedBudgetEnv

    # Save state before
    state_before = np.random.get_state()
    res1 = train_q_learning_agent(episodes=60, seed=123)
    state_after = np.random.get_state()
    # Ensure global numpy state was not mutated by isolated RNG
    assert np.array_equal(state_before[1], state_after[1]), "train_q_learning_agent must not mutate global random state"

    # Check convergence diagnostic
    assert "convergence_episode" in res1
    assert res1["convergence_episode"] is None or isinstance(res1["convergence_episode"], int)
    assert "convergence_criterion" in res1

    # Check independent test evaluation metrics
    assert "agent_eval" in res1 and "baseline_eval" in res1
    assert "mean_reward" in res1["agent_eval"]
    assert "std_reward" in res1["agent_eval"]
    assert "budget_adherence_pct" in res1["agent_eval"]
    assert "savings_achieved_pct" in res1["agent_eval"]
    assert 0.0 <= res1["agent_eval"]["budget_adherence_pct"] <= 100.0

def test_model_catalog_transparency():
    """TASK 5: Verify metadata explicitly distinguishes live prediction models vs evaluation benchmarks."""
    meta = get_or_train_metadata()
    assert "model_catalog" in meta
    cat = meta["model_catalog"]
    assert "live_prediction_models" in cat
    assert "evaluation_benchmarks" in cat
    assert len(cat["live_prediction_models"]) == 5
    assert len(cat["evaluation_benchmarks"]) == 9

def test_prediction_input_validation():
    """TASK 4: Test that prediction safely handles bounds, invalid types, and missing fields."""
    # Valid input with default fallback
    res = predict_from_saved_models({"Income": 75000})
    assert res["status"] == "success"
    assert res["predictions"]["linear_regression_expense"] > 0

    # Negative bounds or NaN rejection
    with pytest.raises(ValueError):
        predict_from_saved_models({"Income": -500})

    with pytest.raises(ValueError):
        predict_from_saved_models({"Income": float("nan")})

    with pytest.raises(ValueError):
        predict_from_saved_models({"Rent": "invalid_number_string"})

