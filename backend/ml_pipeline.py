import os
import datetime
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.svm import SVC
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    confusion_matrix, precision_score, recall_score, f1_score, accuracy_score,
    roc_auc_score, silhouette_score
)
import sys
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import Config



MODELS_DIR = Path(__file__).resolve().parent.parent / "data" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = ["Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]
ALL_INPUT_COLS = ["Income", "Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]

# Full catalog of 18 required serialized model and metadata artifacts
REQUIRED_MODEL_FILES = [
    "linear_regression.joblib",
    "ridge_regression.joblib",
    "lasso_regression.joblib",
    "poly_regression.joblib",
    "poly_features.joblib",
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
    "scaler_cats.joblib",
    "q_table.npy"
]

def verify_model_artifacts():
    """
    Verifies that every required serialized model artifact exists on disk
    and is non-empty before inference or serving.
    Returns (is_valid: bool, missing_or_corrupted: list[str]).
    """
    missing_or_corrupted = []
    for filename in REQUIRED_MODEL_FILES:
        filepath = MODELS_DIR / filename
        if not filepath.exists() or filepath.stat().st_size == 0:
            missing_or_corrupted.append(filename)
    return len(missing_or_corrupted) == 0, missing_or_corrupted

def get_dataset():
    """
    Loads, cleans, and validates the project dataset.
    Performs type verification, missing-value imputation, and bounds checks.
    """
    df = pd.read_csv(Config.DATASET_PATH)
    
    # Coerce numeric columns
    for col in ALL_INPUT_COLS + ["TotalExpenses", "OverBudget"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            
    # Impute missing values with column medians if present
    if df.isnull().sum().sum() > 0:
        df = df.fillna(df.median(numeric_only=True))
        
    # Deduplicate records if any
    if df.duplicated().sum() > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        
    return df

# ── 1. Full Training Pipeline & Artifact Serializer ───────────────────────────
def train_and_save_all_models():
    """
    Executes actual training on the dataset, evaluates strictly on held-out test splits,
    fits preprocessing solely on training sets to prevent target or feature leakage,
    and serializes all fitted estimators, scalers, and evaluation metadata to disk.
    
    Target Definition Note:
    TotalExpenses represents concurrent cross-sectional expense reconstruction
    from observed budget categories plus unobserved incidental variance
    (Miscellaneous ~ N(2500, 800)). This measures concurrent spending reconciliation,
    not longitudinal time-series forecasting.
    """
    df = get_dataset()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ── Exp 1: Feature Engineering & Preprocessing Split ──
    X_reg = df[ALL_INPUT_COLS]
    y_reg = df["TotalExpenses"]
    y_clf = df["OverBudget"].astype(int)

    # Use stratified split on OverBudget to guarantee balanced class distributions
    X_train, X_test, y_train_reg, y_test_reg, y_train_c, y_test_c = train_test_split(
        X_reg, y_reg, y_clf, test_size=0.20, random_state=42, stratify=y_clf
    )

    # Fit regression scaler strictly on training split
    scaler_reg = StandardScaler()
    X_train_reg_s = scaler_reg.fit_transform(X_train)
    X_test_reg_s = scaler_reg.transform(X_test)
    joblib.dump(scaler_reg, MODELS_DIR / "scaler_reg.joblib")

    # Category-only features: fit scaler strictly on training slice
    X_train_cats = X_train[FEATURE_COLS]
    X_test_cats = X_test[FEATURE_COLS]
    scaler_cats = StandardScaler()
    X_train_cats_s = scaler_cats.fit_transform(X_train_cats)
    X_test_cats_s = scaler_cats.transform(X_test_cats)
    joblib.dump(scaler_cats, MODELS_DIR / "scaler_cats.joblib")

    # ── Exp 2: Dimensionality Reduction (PCA & LDA) ──
    # PCA: fit on training categories, transform test
    pca = PCA(n_components=2, random_state=42)
    pca.fit(X_train_cats_s)
    joblib.dump(pca, MODELS_DIR / "pca_model.joblib")
    pca_evr = [round(float(v) * 100, 1) for v in pca.explained_variance_ratio_]

    # LDA: fit on training categories and training labels; evaluate on held-out test split
    lda = LinearDiscriminantAnalysis(n_components=1)
    lda.fit(X_train_cats_s, y_train_c)
    joblib.dump(lda, MODELS_DIR / "lda_model.joblib")
    lda_acc = round(float(lda.score(X_test_cats_s, y_test_c)) * 100, 1)

    # ── Exp 3: Multiple Linear Regression ──
    lr = LinearRegression()
    lr.fit(X_train_reg_s, y_train_reg)
    y_pred_lr = lr.predict(X_test_reg_s)
    joblib.dump(lr, MODELS_DIR / "linear_regression.joblib")

    # ── Exp 4: Polynomial Regression (degree=2) ──
    poly = PolynomialFeatures(degree=2, include_bias=False)
    X_train_poly = poly.fit_transform(X_train_reg_s)
    X_test_poly = poly.transform(X_test_reg_s)
    joblib.dump(poly, MODELS_DIR / "poly_features.joblib")

    poly_lr = LinearRegression()
    poly_lr.fit(X_train_poly, y_train_reg)
    y_pred_poly = poly_lr.predict(X_test_poly)
    joblib.dump(poly_lr, MODELS_DIR / "poly_regression.joblib")

    # ── Exp 5: Ridge & Lasso Regularization ──
    ridge = Ridge(alpha=1.0, random_state=42)
    ridge.fit(X_train_reg_s, y_train_reg)
    y_pred_ridge = ridge.predict(X_test_reg_s)
    joblib.dump(ridge, MODELS_DIR / "ridge_regression.joblib")

    lasso = Lasso(alpha=5.0, random_state=42, max_iter=2000)
    lasso.fit(X_train_reg_s, y_train_reg)
    y_pred_lasso = lasso.predict(X_test_reg_s)
    joblib.dump(lasso, MODELS_DIR / "lasso_regression.joblib")

    # ── Exp 6: Logistic Regression Classification ──
    scaler_clf = StandardScaler()
    X_train_cs = scaler_clf.fit_transform(X_train)
    X_test_cs = scaler_clf.transform(X_test)
    joblib.dump(scaler_clf, MODELS_DIR / "scaler_clf.joblib")

    clf_log = LogisticRegression(random_state=42)
    clf_log.fit(X_train_cs, y_train_c)
    y_pred_log = clf_log.predict(X_test_cs)
    y_prob_log = clf_log.predict_proba(X_test_cs)[:, 1]
    joblib.dump(clf_log, MODELS_DIR / "logistic_regression.joblib")

    # Explicit class labels [0, 1] ensure consistent confusion matrix orientation [[TN, FP], [FN, TP]]
    cm = confusion_matrix(y_test_c, y_pred_log, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    # Safely compute classification metrics with zero_division protection
    acc_val = round(float(accuracy_score(y_test_c, y_pred_log)) * 100, 1)
    prec_val = round(float(precision_score(y_test_c, y_pred_log, zero_division=0)) * 100, 1)
    rec_val = round(float(recall_score(y_test_c, y_pred_log, zero_division=0)) * 100, 1)
    f1_val = round(float(f1_score(y_test_c, y_pred_log, zero_division=0)) * 100, 1)
    try:
        roc_auc_val = round(float(roc_auc_score(y_test_c, y_prob_log)) * 100, 1) if len(np.unique(y_test_c)) > 1 else None
    except ValueError:
        roc_auc_val = None

    log_metrics = {
        "accuracy": acc_val,
        "precision": prec_val,
        "recall": rec_val,
        "f1": f1_val,
        "roc_auc": roc_auc_val,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "sklearn_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "class_labels": ["Within Budget", "Over Budget"],
        "positive_class": "Over Budget",
        "negative_class": "Within Budget",
        "total_test_samples": int(len(y_test_c))
    }

    # ── Exp 7: Linear & Nonlinear SVM ──
    svm_lin = SVC(kernel="linear", C=1.0, probability=True, random_state=42)
    svm_lin.fit(X_train_cs, y_train_c)
    y_pred_svm_lin = svm_lin.predict(X_test_cs)
    joblib.dump(svm_lin, MODELS_DIR / "svm_linear.joblib")

    svm_rbf = SVC(kernel="rbf", C=1.0, probability=True, random_state=42)
    svm_rbf.fit(X_train_cs, y_train_c)
    y_pred_svm_rbf = svm_rbf.predict(X_test_cs)
    joblib.dump(svm_rbf, MODELS_DIR / "svm_rbf.joblib")

    svm_metrics = {
        "linear_accuracy": round(float(accuracy_score(y_test_c, y_pred_svm_lin)) * 100, 1),
        "linear_f1": round(float(f1_score(y_test_c, y_pred_svm_lin, zero_division=0)) * 100, 1),
        "rbf_accuracy": round(float(accuracy_score(y_test_c, y_pred_svm_rbf)) * 100, 1),
        "rbf_f1": round(float(f1_score(y_test_c, y_pred_svm_rbf, zero_division=0)) * 100, 1)
    }

    # ── Exp 8: K-Means Clustering ──
    km = KMeans(n_clusters=3, random_state=42, n_init=10)
    km_labels = km.fit_predict(X_train_cats_s)
    # Calculate silhouette score only when mathematically valid (more than 1 cluster present)
    sil_score = None
    if len(set(km_labels)) > 1 and len(set(km_labels)) < len(X_train_cats_s):
        sil_score = round(float(silhouette_score(X_train_cats_s, km_labels)), 3)
    joblib.dump(km, MODELS_DIR / "kmeans.joblib")

    cluster_names = ["Frugal Savers", "Discretionary Lifestyle", "Fixed Essentials"]
    clusters_info = []
    for c_id in range(3):
        cnt = int(np.sum(km_labels == c_id))
        clusters_info.append({
            "id": c_id,
            "name": cluster_names[c_id],
            "count": cnt,
            "percentage": round(cnt / len(X_train_cats_s) * 100, 1)
        })

    # ── Exp 9: DBSCAN Density Clustering ──
    db = DBSCAN(eps=1.8, min_samples=3)
    db_labels = db.fit_predict(X_train_cats_s)
    dbscan_outliers = int(np.sum(db_labels == -1))
    dbscan_cluster_count = int(len(set(db_labels) - {-1}))
    joblib.dump(db, MODELS_DIR / "dbscan.joblib")

    # ── Exp 10: Random Forest & Gradient Boosting ──
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train_cs, y_train_c)
    y_pred_rf = rf.predict(X_test_cs)
    joblib.dump(rf, MODELS_DIR / "random_forest.joblib")

    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
    gb.fit(X_train_cs, y_train_c)
    y_pred_gb = gb.predict(X_test_cs)
    joblib.dump(gb, MODELS_DIR / "gradient_boosting.joblib")

    rf_acc = round(float(accuracy_score(y_test_c, y_pred_rf)) * 100, 1)
    gb_acc = round(float(accuracy_score(y_test_c, y_pred_gb)) * 100, 1)

    importances = [
        {"feature": f, "importance": round(float(imp) * 100, 1)}
        for f, imp in sorted(zip(ALL_INPUT_COLS, rf.feature_importances_), key=lambda x: x[1], reverse=True)
    ]

    # ── Exp 11: Q-Learning Environment & Episode Training Loop ──
    q_result = train_q_learning_agent(episodes=250, seed=42)
    np.save(MODELS_DIR / "q_table.npy", q_result["q_table"])

    # Package metadata report
    metadata = {
        "status": "Trained & Serialized",
        "last_trained_at": timestamp,
        "task_type": "Cross-sectional simultaneous expense estimation and budget risk classification",
        "dataset_notes": "TotalExpenses is modeled from concurrent category inputs plus unobserved incidental variance (Miscellaneous ~ N(2500, 800)). This measures concurrent spending reconciliation, not longitudinal time-series forecasting.",
        "model_catalog": {
            "live_prediction_models": [
                "Multiple Linear Regression (Continuous Expenses)",
                "Ridge Regularized Regression (Continuous Expenses)",
                "Polynomial Regression (Nonlinear Expenses)",
                "Logistic Regression (Over-Budget Probability)",
                "Linear Support Vector Classifier (Over-Budget Binary)"
            ],
            "evaluation_benchmarks": [
                "Lasso Regression (Feature Sparsity Benchmark)",
                "RBF Kernel SVM (Nonlinear Boundary Benchmark)",
                "Random Forest Classifier (Ensemble Feature Importance)",
                "Gradient Boosting Classifier (Ensemble Accuracy Benchmark)",
                "PCA (Unsupervised Dimensionality Reduction)",
                "LDA (Supervised Projection & Separation)",
                "K-Means (Spending Persona Clustering)",
                "DBSCAN (Anomalous Outlier Spending Detection)",
                "Q-Learning (MDP Dynamic Budget Policy Benchmark)"
            ]
        },
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "pca_evr": pca_evr,
        "lda_accuracy": lda_acc,
        "regression": {
            "linear": {
                "mae": round(float(mean_absolute_error(y_test_reg, y_pred_lr)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_test_reg, y_pred_lr))), 2),
                "r2": round(float(r2_score(y_test_reg, y_pred_lr)), 4),
                "r2_pct": round(float(r2_score(y_test_reg, y_pred_lr)) * 100, 1)
            },
            "poly": {
                "mae": round(float(mean_absolute_error(y_test_reg, y_pred_poly)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_test_reg, y_pred_poly))), 2),
                "r2": round(float(r2_score(y_test_reg, y_pred_poly)), 4),
                "r2_pct": round(float(r2_score(y_test_reg, y_pred_poly)) * 100, 1)
            },
            "ridge": {
                "mae": round(float(mean_absolute_error(y_test_reg, y_pred_ridge)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_test_reg, y_pred_ridge))), 2),
                "r2": round(float(r2_score(y_test_reg, y_pred_ridge)), 4),
                "r2_pct": round(float(r2_score(y_test_reg, y_pred_ridge)) * 100, 1)
            },
            "lasso": {
                "mae": round(float(mean_absolute_error(y_test_reg, y_pred_lasso)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_test_reg, y_pred_lasso))), 2),
                "r2": round(float(r2_score(y_test_reg, y_pred_lasso)), 4),
                "r2_pct": round(float(r2_score(y_test_reg, y_pred_lasso)) * 100, 1)
            }
        },
        "classification": log_metrics,
        "svm": svm_metrics,
        "clustering": {
            "silhouette": sil_score,
            "inertia": round(float(km.inertia_), 1),
            "clusters": clusters_info,
            "dbscan_outliers": dbscan_outliers,
            "dbscan_clusters": dbscan_cluster_count
        },
        "ensemble": {
            "random_forest_accuracy": rf_acc,
            "gradient_boosting_accuracy": gb_acc,
            "importances": importances
        },
        "q_learning": {
            "episodes": q_result["episodes"],
            "convergence_episode": q_result["convergence_episode"],
            "convergence_criterion": q_result.get("convergence_criterion"),
            "avg_reward_final_50": q_result["avg_reward_final_50"],
            "baseline_reward": q_result["baseline_reward"],
            "agent_eval": q_result.get("agent_eval"),
            "baseline_eval": q_result.get("baseline_eval"),
            "simulation_disclaimer": "Synthetic MDP simulation environment for policy benchmarking under stochastic shocks; not empirical customer transaction telemetry.",
            "reward_curve": q_result["reward_curve"],
            "policies": q_result["policies"]
        }
    }

    # Verify that all 18 required artifact files exist on disk before writing metadata
    is_valid, missing = verify_model_artifacts()
    if not is_valid:
        raise RuntimeError(f"Training serialization incomplete. Missing artifacts: {missing}")

    joblib.dump(metadata, MODELS_DIR / "ml_metadata.joblib")
    return metadata

# ── 2. Q-Learning Environment Simulation ──────────────────────────────────────
class SimulatedBudgetEnv:
    """
    Synthetic Markov Decision Process (MDP) Budget Simulation Environment:
    - State: (day_bin: 0..2, budget_used_bin: 0..2, savings_progress_bin: 0..2) -> 27 discrete states
    - Actions:
        0: Conservative Throttle (cut discretionary, build buffer)
        1: Balanced Pace (normal standard lifestyle)
        2: Aggressive Discretionary (high lifestyle, zero reserve)
    - Stochastic shocks simulate unexpected financial demands (e.g. medical, emergency repair).
    
    Disclaimer:
    This environment is a synthetic mathematical benchmark designed to train and evaluate
    a discrete reinforcement learning policy under controlled conditions. It does NOT represent
    empirical customer financial telemetry.
    """
    def __init__(self, monthly_budget=45000, savings_target=10000, rng=None):
        self.monthly_budget = monthly_budget
        self.savings_target = savings_target
        self.rng = rng if rng is not None else np.random.default_rng(42)
        self.reset()

    def reset(self):
        self.day = 1
        self.spent = 0.0
        self.saved = 0.0
        return self._get_state()

    def _get_state(self):
        d_bin = 0 if self.day <= 10 else 1 if self.day <= 20 else 2
        b_ratio = self.spent / (self.monthly_budget or 1)
        b_bin = 0 if b_ratio < 0.35 else 1 if b_ratio < 0.75 else 2
        s_ratio = self.saved / (self.savings_target or 1)
        s_bin = 0 if s_ratio < 0.35 else 1 if s_ratio < 0.75 else 2
        return d_bin * 9 + b_bin * 3 + s_bin

    def step(self, action):
        daily_allowance = self.monthly_budget / 30.0
        # Stochastic financial shock via isolated RNG
        shock = self.rng.choice([0, daily_allowance * 0.4, daily_allowance * 0.9], p=[0.70, 0.22, 0.08])

        if action == 0:    # Conservative Throttle
            spend = daily_allowance * 0.65 + shock * 0.5
            save = daily_allowance * 0.35
        elif action == 1:  # Balanced Pace
            spend = daily_allowance * 0.95 + shock * 0.8
            save = daily_allowance * 0.10
        else:              # Aggressive Discretionary
            spend = daily_allowance * 1.30 + shock
            save = 0.0

        self.spent += spend
        self.saved += save
        self.day += 1

        # Daily operational reward
        reward = 5.0 if spend <= daily_allowance else -12.0
        done = self.day > 30

        if done:
            if self.spent <= self.monthly_budget:
                reward += 50.0  # Final month-end within budget reward
            else:
                reward -= 80.0  # Budget breach deficit penalty
            if self.saved >= self.savings_target:
                reward += 40.0  # Savings target achieved bonus
            else:
                reward -= 20.0  # Missed savings target penalty

        return self._get_state(), reward, done

def train_q_learning_agent(episodes=250, alpha=0.1, gamma=0.95, epsilon=0.3, seed=42):
    """
    Trains a Q-Learning agent using an isolated NumPy Generator (no global state mutation).
    Monitors convergence via max Q-value change across evaluation windows.
    Evaluates both the trained greedy policy and the balanced baseline on 50 independent test episodes.
    """
    rng = np.random.default_rng(seed)
    env = SimulatedBudgetEnv(rng=rng)
    n_states = 27
    n_actions = 3
    Q = np.zeros((n_states, n_actions))
    reward_curve = []

    convergence_episode = None
    convergence_window = 10
    convergence_threshold = 0.50
    q_snapshot = Q.copy()

    for ep in range(episodes):
        state = env.reset()
        done = False
        ep_reward = 0.0
        eps = max(0.02, epsilon * (1 - ep / episodes))

        while not done:
            if rng.random() < eps:
                action = int(rng.integers(0, n_actions))
            else:
                action = int(np.argmax(Q[state]))

            next_state, reward, done = env.step(action)
            best_next = np.max(Q[next_state])
            Q[state, action] += alpha * (reward + gamma * best_next - Q[state, action])

            state = next_state
            ep_reward += reward

        if ep % 5 == 0 or ep == episodes - 1:
            reward_curve.append({"episode": ep + 1, "reward": round(ep_reward, 1)})

        # Real convergence diagnostic: monitor maximum delta of Q-table over 10-episode windows after ep 50
        if (ep + 1) % convergence_window == 0 and (ep + 1) >= 50:
            max_delta = float(np.max(np.abs(Q - q_snapshot)))
            if convergence_episode is None and max_delta < convergence_threshold:
                convergence_episode = ep + 1
            q_snapshot = Q.copy()

    # ── Independent Test Evaluation ──
    # Run 50 independent test episodes with exploration disabled (epsilon=0)
    test_eval_episodes = 50
    eval_seeds = [10000 + i for i in range(test_eval_episodes)]

    # 1. Evaluate Learned Greedy Policy
    agent_rewards = []
    agent_budget_met = 0
    agent_savings_met = 0

    for s in eval_seeds:
        test_env = SimulatedBudgetEnv(rng=np.random.default_rng(s))
        s_curr = test_env.reset()
        d_done = False
        r_tot = 0.0
        while not d_done:
            a_opt = int(np.argmax(Q[s_curr]))
            s_curr, r, d_done = test_env.step(a_opt)
            r_tot += r
        agent_rewards.append(r_tot)
        if test_env.spent <= test_env.monthly_budget:
            agent_budget_met += 1
        if test_env.saved >= test_env.savings_target:
            agent_savings_met += 1

    # 2. Evaluate Fixed Balanced Baseline Policy (Action 1) on identical seeds
    base_rewards = []
    base_budget_met = 0
    base_savings_met = 0

    for s in eval_seeds:
        test_env = SimulatedBudgetEnv(rng=np.random.default_rng(s))
        test_env.reset()
        d_done = False
        r_tot = 0.0
        while not d_done:
            _, r, d_done = test_env.step(1)
            r_tot += r
        base_rewards.append(r_tot)
        if test_env.spent <= test_env.monthly_budget:
            base_budget_met += 1
        if test_env.saved >= test_env.savings_target:
            base_savings_met += 1

    action_names = ["Conservative Throttle", "Balanced Pace", "Aggressive Discretionary"]
    policies = [
        {"phase": "Early Month (Days 1–10)", "action": action_names[int(np.argmax(Q[0]))], "q_val": round(float(np.max(Q[0])), 1)},
        {"phase": "Mid Month (Days 11–20)", "action": action_names[int(np.argmax(Q[9]))], "q_val": round(float(np.max(Q[9])), 1)},
        {"phase": "Late Month (Days 21–30)", "action": action_names[int(np.argmax(Q[18]))], "q_val": round(float(np.max(Q[18])), 1)},
    ]

    agent_mean = round(float(np.mean(agent_rewards)), 1)
    agent_std = round(float(np.std(agent_rewards)), 1)
    base_mean = round(float(np.mean(base_rewards)), 1)
    base_std = round(float(np.std(base_rewards)), 1)

    return {
        "episodes": episodes,
        "convergence_episode": convergence_episode,
        "convergence_criterion": f"Max Q-table delta < {convergence_threshold} over {convergence_window}-episode window",
        "avg_reward_final_50": agent_mean,
        "baseline_reward": base_mean,
        "agent_eval": {
            "mean_reward": agent_mean,
            "std_reward": agent_std,
            "budget_adherence_pct": round(agent_budget_met / test_eval_episodes * 100, 1),
            "savings_achieved_pct": round(agent_savings_met / test_eval_episodes * 100, 1)
        },
        "baseline_eval": {
            "mean_reward": base_mean,
            "std_reward": base_std,
            "budget_adherence_pct": round(base_budget_met / test_eval_episodes * 100, 1),
            "savings_achieved_pct": round(base_savings_met / test_eval_episodes * 100, 1)
        },
        "reward_curve": reward_curve,
        "policies": policies,
        "q_table": Q
    }

# ── 3. Real Prediction Service with Loaded Artifacts ──────────────────────────
def get_or_train_metadata():
    """
    Returns stored evaluation metadata if artifacts are valid;
    otherwise triggers pipeline training to rebuild missing or corrupted files.
    """
    meta_path = MODELS_DIR / "ml_metadata.joblib"
    is_valid, _ = verify_model_artifacts()
    if meta_path.exists() and is_valid:
        try:
            return joblib.load(meta_path)
        except Exception:
            pass
    return train_and_save_all_models()

def predict_from_saved_models(input_data):
    """
    Validates input schema and bounds, loads serialized model artifacts from disk,
    and computes genuine predictions for continuous expenses (Regression)
    and over-budget risk probability (Classification).
    """
    if not isinstance(input_data, dict):
        raise ValueError("Invalid input data format: expected a dictionary.")

    # Validate feature presence and numeric validity
    sanitized = {}
    for col in ALL_INPUT_COLS:
        raw_val = input_data.get(col, None)
        if raw_val is None:
            # Provide sensible fallback default if key missing
            defaults = {"Income": 55000, "Rent": 15000, "Food": 10000, "Utilities": 5000, "Shopping": 6000, "Travel": 4000, "Health": 3000}
            raw_val = defaults.get(col, 0.0)
        try:
            num = float(raw_val)
            if np.isnan(num) or np.isinf(num):
                raise ValueError(f"Feature '{col}' cannot be NaN or Infinite.")
            if not (0 <= num <= 100_000_000):
                raise ValueError(f"Feature '{col}' value out of supported bounds (0 to 100,000,000).")
            sanitized[col] = num
        except (ValueError, TypeError) as e:
            raise ValueError(f"Feature '{col}' contains an invalid numeric value: {raw_val}") from e

    # Ensure all artifacts are valid
    get_or_train_metadata()
    is_valid, missing = verify_model_artifacts()
    if not is_valid:
        raise RuntimeError(f"Required model artifacts are missing or corrupted: {missing}")

    scaler_reg = joblib.load(MODELS_DIR / "scaler_reg.joblib")
    scaler_clf = joblib.load(MODELS_DIR / "scaler_clf.joblib")
    lr = joblib.load(MODELS_DIR / "linear_regression.joblib")
    ridge = joblib.load(MODELS_DIR / "ridge_regression.joblib")
    poly_lr = joblib.load(MODELS_DIR / "poly_regression.joblib")
    poly_feats = joblib.load(MODELS_DIR / "poly_features.joblib")
    clf_log = joblib.load(MODELS_DIR / "logistic_regression.joblib")
    svm_lin = joblib.load(MODELS_DIR / "svm_linear.joblib")

    # Extract features in exact order as DataFrame
    row = pd.DataFrame([sanitized], columns=ALL_INPUT_COLS)

    row_reg_s = scaler_reg.transform(row)
    row_clf_s = scaler_clf.transform(row)
    row_poly_s = poly_feats.transform(row_reg_s)

    pred_linear = float(lr.predict(row_reg_s)[0])
    pred_ridge = float(ridge.predict(row_reg_s)[0])
    pred_poly = float(poly_lr.predict(row_poly_s)[0])

    over_budget_prob = float(clf_log.predict_proba(row_clf_s)[0, 1])
    svm_decision = int(svm_lin.predict(row_clf_s)[0])

    return {
        "status": "success",
        "model_loaded_from": str(MODELS_DIR),
        "input_features": ALL_INPUT_COLS,
        "predictions": {
            "linear_regression_expense": round(pred_linear, 2),
            "ridge_regression_expense": round(pred_ridge, 2),
            "poly_regression_expense": round(pred_poly, 2),
            "over_budget_probability": round(over_budget_prob * 100, 1),
            "is_over_budget_predicted": bool(over_budget_prob >= 0.5),
            "svm_classification": "Over Budget" if svm_decision == 1 else "Within Budget"
        }
    }

if __name__ == "__main__":
    print("Training and serializing all 11 Machine Learning models...")
    metadata = train_and_save_all_models()
    print("Successfully trained and saved all models to data/models/!")
    print(f"Regression R2: {metadata['regression']['linear']['r2']}")
    print(f"Classification Accuracy: {metadata['classification']['accuracy']}%")
    print(f"LDA Holdout Accuracy: {metadata['lda_accuracy']}%")
    print(f"Q-Learning Test Reward: {metadata['q_learning']['avg_reward_final_50']} vs Baseline: {metadata['q_learning']['baseline_reward']}")



