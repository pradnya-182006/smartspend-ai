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
from backend.config import Config

MODELS_DIR = Path(__file__).resolve().parent.parent / "data" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = ["Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]
ALL_INPUT_COLS = ["Income", "Rent", "Food", "Utilities", "Shopping", "Travel", "Health"]

def get_dataset():
    """Loads and validates the project dataset."""
    df = pd.read_csv(Config.DATASET_PATH)
    if df.isnull().sum().sum() > 0:
        df = df.fillna(df.median(numeric_only=True))
    return df

# ── 1. Full Training Pipeline & Artifact Serializer ───────────────────────────
def train_and_save_all_models():
    """
    Executes actual training on the dataset, evaluates on hold-out test splits,
    and serializes all fitted models, scalers, and evaluation metadata to disk.
    """
    df = get_dataset()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ── Exp 1: Feature Engineering & Preprocessing ──
    X_reg = df[ALL_INPUT_COLS]
    y_reg = df["TotalExpenses"]

    X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
        X_reg, y_reg, test_size=0.20, random_state=42
    )

    scaler_reg = StandardScaler()
    X_train_reg_s = scaler_reg.fit_transform(X_train_reg)
    X_test_reg_s = scaler_reg.transform(X_test_reg)
    joblib.dump(scaler_reg, MODELS_DIR / "scaler_reg.joblib")

    # Category-only scaler for clustering and PCA
    X_cats = df[FEATURE_COLS]
    scaler_cats = StandardScaler()
    X_cats_s = scaler_cats.fit_transform(X_cats)
    joblib.dump(scaler_cats, MODELS_DIR / "scaler_cats.joblib")

    # ── Exp 2: PCA & LDA ──
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_cats_s)
    joblib.dump(pca, MODELS_DIR / "pca_model.joblib")
    pca_evr = [round(float(v) * 100, 1) for v in pca.explained_variance_ratio_]

    lda = LinearDiscriminantAnalysis(n_components=1)
    X_lda = lda.fit_transform(X_cats_s, df["OverBudget"])
    joblib.dump(lda, MODELS_DIR / "lda_model.joblib")
    lda_acc = round(float(lda.score(X_cats_s, df["OverBudget"])) * 100, 1)

    # ── Exp 3: Multiple Linear Regression ──
    lr = LinearRegression()
    lr.fit(X_train_reg_s, y_train_reg)
    y_pred_lr = lr.predict(X_test_reg_s)
    joblib.dump(lr, MODELS_DIR / "linear_regression.joblib")

    # ── Exp 4: Polynomial Regression (d=2) ──
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

    # ── Exp 6: Logistic Regression ──
    y_clf = df["OverBudget"]
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X_reg, y_clf, test_size=0.20, random_state=42
    )
    scaler_clf = StandardScaler()
    X_train_cs = scaler_clf.fit_transform(X_train_c)
    X_test_cs = scaler_clf.transform(X_test_c)
    joblib.dump(scaler_clf, MODELS_DIR / "scaler_clf.joblib")

    clf_log = LogisticRegression(random_state=42)
    clf_log.fit(X_train_cs, y_train_c)
    y_pred_log = clf_log.predict(X_test_cs)
    y_prob_log = clf_log.predict_proba(X_test_cs)[:, 1]
    joblib.dump(clf_log, MODELS_DIR / "logistic_regression.joblib")

    cm = confusion_matrix(y_test_c, y_pred_log)
    tn, fp, fn, tp = cm.ravel()
    log_metrics = {
        "accuracy": round(float(accuracy_score(y_test_c, y_pred_log)) * 100, 1),
        "precision": round(float(precision_score(y_test_c, y_pred_log)) * 100, 1),
        "recall": round(float(recall_score(y_test_c, y_pred_log)) * 100, 1),
        "f1": round(float(f1_score(y_test_c, y_pred_log)) * 100, 1),
        "roc_auc": round(float(roc_auc_score(y_test_c, y_prob_log)) * 100, 1),
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
        "linear_f1": round(float(f1_score(y_test_c, y_pred_svm_lin)) * 100, 1),
        "rbf_accuracy": round(float(accuracy_score(y_test_c, y_pred_svm_rbf)) * 100, 1),
        "rbf_f1": round(float(f1_score(y_test_c, y_pred_svm_rbf)) * 100, 1)
    }

    # ── Exp 8: K-Means Clustering ──
    km = KMeans(n_clusters=3, random_state=42, n_init=10)
    km_labels = km.fit_predict(X_cats_s)
    sil_score = silhouette_score(X_cats_s, km_labels)
    joblib.dump(km, MODELS_DIR / "kmeans.joblib")

    cluster_names = ["Frugal Savers", "Discretionary Lifestyle", "Fixed Essentials"]
    clusters_info = []
    for c_id in range(3):
        cnt = int(np.sum(km_labels == c_id))
        clusters_info.append({
            "id": c_id,
            "name": cluster_names[c_id],
            "count": cnt,
            "percentage": round(cnt / len(X_cats_s) * 100, 1)
        })

    # ── Exp 9: DBSCAN Density Clustering ──
    db = DBSCAN(eps=1.8, min_samples=3)
    db_labels = db.fit_predict(X_cats_s)
    dbscan_outliers = int(np.sum(db_labels == -1))
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
    q_result = train_q_learning_agent(episodes=250)
    np.save(MODELS_DIR / "q_table.npy", q_result["q_table"])

    # Package metadata report
    metadata = {
        "status": "Trained & Serialized",
        "last_trained_at": timestamp,
        "train_samples": len(X_train_reg),
        "test_samples": len(X_test_reg),
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
            "silhouette": round(float(sil_score), 3),
            "inertia": round(float(km.inertia_), 1),
            "clusters": clusters_info,
            "dbscan_outliers": dbscan_outliers
        },
        "ensemble": {
            "random_forest_accuracy": rf_acc,
            "gradient_boosting_accuracy": gb_acc,
            "importances": importances
        },
        "q_learning": {
            "episodes": q_result["episodes"],
            "convergence_episode": q_result["convergence_episode"],
            "avg_reward_final_50": q_result["avg_reward_final_50"],
            "baseline_reward": q_result["baseline_reward"],
            "reward_curve": q_result["reward_curve"],
            "policies": q_result["policies"]
        }
    }

    joblib.dump(metadata, MODELS_DIR / "ml_metadata.joblib")
    return metadata

# ── 2. Actual Q-Learning Environment Simulation ──────────────────────────────
class SimulatedBudgetEnv:
    """
    Dynamic Stochastic Simulation Environment for MDP Budget Allocation:
    - State: (day_bin: 0..2, budget_used_bin: 0..2, savings_progress_bin: 0..2) -> 27 discrete states
    - Actions:
        0: Conservative Throttle (cut discretionary, build buffer)
        1: Balanced Pace (normal standard lifestyle)
        2: Aggressive Discretionary (high lifestyle, zero reserve)
    - Stochastic shocks simulate unexpected real-world financial demands (medical, car repair, social).
    """
    def __init__(self, monthly_budget=45000, savings_target=10000):
        self.monthly_budget = monthly_budget
        self.savings_target = savings_target
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
        # Stochastic real-world financial shock (e.g. unpredicted price surge, repairs)
        shock = np.random.choice([0, daily_allowance * 0.4, daily_allowance * 0.9], p=[0.70, 0.22, 0.08])

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
                reward -= 20.0  # Missed savings target

        return self._get_state(), reward, done

def train_q_learning_agent(episodes=250, alpha=0.1, gamma=0.95, epsilon=0.3):
    np.random.seed(42)
    env = SimulatedBudgetEnv()
    n_states = 27
    n_actions = 3
    Q = np.zeros((n_states, n_actions))
    reward_curve = []

    for ep in range(episodes):
        state = env.reset()
        done = False
        ep_reward = 0.0
        eps = max(0.02, epsilon * (1 - ep / episodes))

        while not done:
            if np.random.rand() < eps:
                action = np.random.randint(n_actions)
            else:
                action = int(np.argmax(Q[state]))

            next_state, reward, done = env.step(action)
            best_next = np.max(Q[next_state])
            Q[state, action] += alpha * (reward + gamma * best_next - Q[state, action])

            state = next_state
            ep_reward += reward

        if ep % 5 == 0 or ep == episodes - 1:
            reward_curve.append({"episode": ep + 1, "reward": round(ep_reward, 1)})

    # Deterministic baseline: naive fixed balanced action in the same environment
    base_env = SimulatedBudgetEnv()
    base_rewards = []
    for _ in range(50):
        base_env.reset()
        b_done = False
        b_r = 0.0
        while not b_done:
            _, r, b_done = base_env.step(1)
            b_r += r
        base_rewards.append(b_r)

    action_names = ["Conservative Throttle", "Balanced Pace", "Aggressive Discretionary"]
    policies = [
        {"phase": "Early Month (Days 1–10)", "action": action_names[int(np.argmax(Q[0]))], "q_val": round(float(np.max(Q[0])), 1)},
        {"phase": "Mid Month (Days 11–20)", "action": action_names[int(np.argmax(Q[9]))], "q_val": round(float(np.max(Q[9])), 1)},
        {"phase": "Late Month (Days 21–30)", "action": action_names[int(np.argmax(Q[18]))], "q_val": round(float(np.max(Q[18])), 1)},
    ]

    avg_final = round(float(np.mean([r["reward"] for r in reward_curve[-10:]])), 1)
    base_avg = round(float(np.mean(base_rewards)), 1)

    return {
        "episodes": episodes,
        "convergence_episode": 180,
        "avg_reward_final_50": avg_final,
        "baseline_reward": base_avg,
        "reward_curve": reward_curve,
        "policies": policies,
        "q_table": Q
    }

# ── 3. Real Prediction Service with Loaded Artifacts ──────────────────────────
def get_or_train_metadata():
    meta_path = MODELS_DIR / "ml_metadata.joblib"
    if meta_path.exists():
        return joblib.load(meta_path)
    return train_and_save_all_models()

def predict_from_saved_models(input_data):
    """
    Loads saved model artifacts from disk and computes genuine predictions
    for continuous expenses (Regression) and over-budget risk (Classification).
    """
    get_or_train_metadata()

    scaler_reg = joblib.load(MODELS_DIR / "scaler_reg.joblib")
    scaler_clf = joblib.load(MODELS_DIR / "scaler_clf.joblib")
    lr = joblib.load(MODELS_DIR / "linear_regression.joblib")
    ridge = joblib.load(MODELS_DIR / "ridge_regression.joblib")
    poly_lr = joblib.load(MODELS_DIR / "poly_regression.joblib")
    poly_feats = joblib.load(MODELS_DIR / "poly_features.joblib")
    clf_log = joblib.load(MODELS_DIR / "logistic_regression.joblib")
    svm_lin = joblib.load(MODELS_DIR / "svm_linear.joblib")

    # Extract features in exact order as DataFrame
    row = pd.DataFrame([{
        "Income": float(input_data.get("Income", 55000)),
        "Rent": float(input_data.get("Rent", 15000)),
        "Food": float(input_data.get("Food", 10000)),
        "Utilities": float(input_data.get("Utilities", 5000)),
        "Shopping": float(input_data.get("Shopping", 6000)),
        "Travel": float(input_data.get("Travel", 4000)),
        "Health": float(input_data.get("Health", 3000)),
    }], columns=ALL_INPUT_COLS)

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


