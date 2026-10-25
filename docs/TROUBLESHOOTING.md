# SmartSpend AI — Troubleshooting & Recovery Guide

**Project Title:** SmartSpend AI — Intelligent Expense Analysis and Financial Habit Prediction System  
**Audience:** Developers, Presenters, and Systems Evaluators  

This guide provides immediate diagnosis and step-by-step remediation procedures for common hardware, software, network, and runtime issues.

---

## 1. Port Conflicts (Port 5000 or 5173 Already in Use)

### Symptom:
- Backend fails to start with `OSError: [WinError 10048] Only one usage of each socket address (protocol/network address/port) is normally permitted`.
- Frontend starts on `http://localhost:5174` instead of `5173`.

### Root Cause:
Another Python process, Flask instance, or Vite dev server is lingering in the background and holding the socket.

### Resolution Steps:

#### Step 1: Identify the process ID (PID)
In PowerShell, check which PID is occupying port 5000:
```powershell
netstat -ano | findstr :5000
```
*(Example output: `TCP    127.0.0.1:5000         0.0.0.0:0              LISTENING       12345`)*

#### Step 2: Identify the application name
```powershell
tasklist /FI "PID eq 12345"
```

#### Step 3: Terminate the lingering process
```powershell
taskkill /F /PID 12345
```

#### Step 4: For Vite (Port 5173)
```powershell
netstat -ano | findstr :5173
taskkill /F /PID <VITE_PID>
```

#### Step 5: Restart the application using the launcher scripts
```powershell
.\start_backend.bat
.\start_frontend.bat
```

---

## 2. Python Dependency & Environment Errors

### Symptom:
`ModuleNotFoundError: No module named 'sklearn'` or `No module named 'flask'` or `No module named 'backend'`.

### Resolution Steps:
1. Ensure you are running Python 3.10+ (tested on Python 3.13):
   ```powershell
   python --version
   ```
2. Reinstall backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. If executing python modules directly, always run from the root project folder:
   ```powershell
   cd "c:\Users\HP\Downloads\Smart spend Ai\smart spend ai"
   python -m backend.app
   ```

---

## 3. Node.js & Vite Build Errors

### Symptom:
- `npm run dev` fails with `'vite' is not recognized as an internal or external command`.
- `npm run build` fails during minification or module bundling.

### Resolution Steps:
1. Confirm Node.js is installed:
   ```powershell
   node -v
   npm -v
   ```
2. If `node_modules` is missing or corrupted, perform a clean reinstall:
   ```powershell
   rmdir /s /q node_modules
   npm install
   ```
3. Test production build to verify bundle:
   ```powershell
   npm run build
   ```
   *(Expected output: `dist/index.html`, `dist/assets/...`, built in ~3s with 0 errors).*

---

## 4. SQLite Database Initialization & Locking

### Symptom:
- `sqlite3.OperationalError: database is locked`.
- Tables or columns missing when opening the app.

### Resolution Steps:
1. Ensure no external SQLite viewer (such as DB Browser for SQLite) has an open write-lock transaction on `data/smartspend.db`.
2. Re-initialize database schema and seed demo data safely:
   ```powershell
   python backend/seed_demo_data.py --reset
   ```
   *Note: This resets strictly User ID 1 (`demo_user`) without damaging any other records.*
3. Verify the database file is not marked read-only.

---

## 5. Missing or Corrupted Machine Learning Artifacts

### Symptom:
- `/api/ml/metadata` returns status `"Untrained"` or error loading model.
- `/api/ml/predict` returns `FileNotFoundError: [Errno 2] No such file or directory: '.../data/models/linear_regression.joblib'`.

### Root Cause:
Model artifacts in `data/models/` were accidentally deleted or cleared.

### Resolution Steps:
1. Trigger a fresh training and serialization run of all 11 experiments:
   ```powershell
   python backend/train_models.py
   ```
2. Or trigger via curl/PowerShell request to the backend:
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/ml/retrain" -Method Post
   ```
3. Confirm that 16 model files are present in `data/models/`:
   ```powershell
   dir data\models
   ```
   *Expected files: `linear_regression.joblib`, `ridge_regression.joblib`, `poly_regression.joblib`, `poly_features.joblib`, `lasso_regression.joblib`, `logistic_regression.joblib`, `svm_linear.joblib`, `svm_rbf.joblib`, `kmeans.joblib`, `dbscan.joblib`, `pca_model.joblib`, `lda_model.joblib`, `random_forest.joblib`, `gradient_boosting.joblib`, `scaler_reg.joblib`, `scaler_clf.joblib`, `q_table.npy`.*

---

## 6. Frontend / Backend Connection Problems (CORS or Network Failure)

### Symptom:
- "Failed to fetch" banner in the frontend UI.
- Browser console shows `ERR_CONNECTION_REFUSED` on `http://127.0.0.1:5000`.

### Resolution Steps:
1. Check backend status:
   ```powershell
   python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:5000/api/health').read().decode())"
   ```
2. Check `vite.config.js`: confirm the proxy is routing `/api` to `http://127.0.0.1:5000`.
3. Check `backend/app.py`: confirm `flask_cors.CORS` is enabled.
4. Restart the Flask server using `start_backend.bat`.

---

## 7. Failed Predictions (Input Validation 400 Errors)

### Symptom:
- `/api/ml/predict` returns HTTP 400 Bad Request.

### Root Cause:
Phase 4 security hardening strictly enforces valid numeric inputs between ₹0 and ₹100,000,000.

### Resolution Steps:
1. Ensure amounts provided are numbers, not text or negative values.
2. In the AI Predictions form, enter positive values (e.g., Income: 55000, Rent: 15000, Food: 10000).
3. If testing via API, format payload as:
   ```json
   {
     "Income": 55000,
     "Rent": 15000,
     "Food": 10000,
     "Utilities": 5000,
     "Shopping": 6000,
     "Travel": 4000,
     "Health": 3000
   }
   ```

---

## 8. Test Failures During Automated Verification

### Symptom:
`python -m pytest tests -v` fails on one or more tests.

### Resolution Steps:
1. Identify the failing test module:
   - `test_budgets.py`: Check SQLite database schema and what-if calculations.
   - `test_calculations.py`: Check mathematical edge cases (e.g. division by zero).
   - `test_ml_models.py`: Confirm model artifacts exist in `data/models/`. If missing, run `python backend/train_models.py`.
   - `test_security_privacy.py`: Confirm PBKDF2 hashing and session configuration.
   - `test_transactions.py`: Verify CSV import limits (max 5,000 rows).
2. Run pytest with increased verbosity and short traceback:
   ```powershell
   python -m pytest tests -v --tb=short
   ```
3. Run the automated test runner:
   ```powershell
   .\run_tests.bat
   ```
