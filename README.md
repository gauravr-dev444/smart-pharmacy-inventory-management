# Smart Pharmacy Inventory Management System with AI Demand Forecasting

Smart Pharmacy is a state-of-the-art SaaS inventory management system designed for modern pharmacies. It tracks stock, audits administrative activities, processes customer sales, and leverages **machine learning** to predict future medicine demand and generate automated reorder suggestions.

---

## 🚀 Key Features
1. **Interactive SaaS Dashboard**: Glassmorphism UI cards, real-time KPI metrics, category breakdowns, and monthly trends using **Recharts** charts.
2. **Point of Sale (POS) Sales recorder**: Process customer sales, deduct inventory stock automatically, track daily/monthly revenues.
3. **AI Demand Forecasting**: Recurrent daily multi-step demand forecasting using a trained **Random Forest Regressor** with lagged rolling features.
4. **Intelligent Procurement & Safety Stock**: Automatically recommends reorder quantities using the formula:
   $$\text{Recommended Reorder} = \text{Predicted Demand (30d)} + \text{Safety Stock (20\%)} - \text{Current Stock}$$
5. **Real-time Alert Engine**: Identifies Low Stock (current < reorder), Critical Stock (< 50% reorder), Expiry Danger (expires within 30 days), and Overstock batches.
6. **Downloadable Business Intelligence Reports**: Streamed PDF sheets (ReportLab) and XLSX spreadsheets (openpyxl) for inventory and sales.
7. **JWT Authentication & RBAC**: Dedicated panels for `Admin` (manage users/retrain ML), `Pharmacist` (view stock/process sales), and `Inventory Manager` (update stock/manage suppliers).
8. **Dual-Mode Database**: Real Firebase Firestore connection with local JSON database mockup file fallback.
9. **Dark Mode Support**: Seamless HSL dark/light modes toggle.

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite), Tailwind CSS (v3.4), Recharts, Framer Motion, Lucide Icons, Axios.
* **Backend**: FastAPI (Python), Uvicorn, Pydantic, JWT Auth, ReportLab, Pandas.
* **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib.
* **Database**: Firebase Firestore (or Mock JSON Fallback).

---

## 📂 Project Structure
```
smart-pharmacy-system/
├── datasets/                 # Raw datasets (pharmacy_sales.csv, medicines.csv)
├── trained_models/           # Saved ML models (best_forecast_model.joblib)
├── firebase/                 # Firestore rules
├── docs/                     # REST API documentation
├── backend/                  # Python FastAPI codebase
└── frontend/                 # Vite React application
```

---

## ⚙️ Local Setup Instructions

### 1. Backend Setup (FastAPI & ML Engine)
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the DB Seeding script to ingest products from `medicines.csv` and set up demo transactions:
   ```bash
   python seed.py
   ```
4. Start the FastAPI Uvicorn dev server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The server runs locally on `http://localhost:8000`.*
   *API Swagger Docs are available at `http://localhost:8000/docs`.*

### 2. Frontend Setup (React Vite SPA)
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client web portal runs locally on `http://localhost:5173`.*

---

## 🔐 Credentials for Demo Accounts
Log in immediately using one of the pre-seeded users:
* **Administrator**: `admin@pharmacy.com` | Password: `admin123`
* **Pharmacist**: `pharmacist@pharmacy.com` | Password: `pharmacist123`
* **Inventory Manager**: `manager@pharmacy.com` | Password: `manager123`

---

## 🧠 Machine Learning Engine Summary
The system processes daily sales of 10 generic medicine categories from 2020 to 2025 (`datasets/pharmacy_sales.csv`).
1. **Feature Engineering**: Creates Month, Quarter, Day of Week, Seasonal monthly demand index, 7-day lagged rolling average, and sales growth velocity.
2. **Model Selection**: Trains and validates Linear Regression, Random Forest Regressor, and Gradient Boosting Regressor.
3. **Execution**: RandomForest is selected automatically based on its superior validation RMSE.
4. **Confidence Scores**: Recalculates confidence scores based on validation coefficients.

---

## 🌐 Production Deployment Guidelines

### Frontend → Vercel
1. Set up a Vercel project linked to your repository.
2. Build commands: `npm run build`, output directory: `dist`.
3. Set environment variable `VITE_API_URL` to point to your backend url.

### Backend → Render
1. Set up a Web Service on Render from your Git repository.
2. Environment: `Python`, Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Put environment variable `SECRET_KEY` for JWT.

### Database → Firebase Firestore
To deploy Firestore:
1. In the Firebase console, create a Firestore database project.
2. Generate a Service Account Certificate JSON file.
3. Save the certificate file as `firebase_credentials.json` in the workspace root.
4. Restart the FastAPI backend. It will automatically detect the file and switch from mock JSON fallback to the real Firestore!
