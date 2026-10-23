# Smart Pharmacy Inventory Management System
## Technical Architecture & Academic Artificial Intelligence Project Documentation

---

### Executive Metadata
* **Project Title:** Smart Pharmacy Inventory Management & Intelligent Demand Forecasting System
* **Domain:** Applied Artificial Intelligence in Healthcare & Supply Chain Management
* **Core Paradigm:** Machine Learning Regression, Recursive Time-Series Forecasting, Automated Inventory Optimization, and Enterprise Full-Stack System Design
* **Document Purpose:** Comprehensive Technical Source Documentation for University/Academic Project Report Generation

---

## 1. Project Title
**Smart Pharmacy Inventory Management & AI Demand Forecasting System**  
*(An End-to-End Enterprise Solution for Intelligent Pharmaceutical Stock Control, POS Dispensation, Multi-Model Demand Prediction, and Automated Supply Chain Procurement)*

---

## 2. Problem Statement
Traditional retail and institutional pharmacy management systems suffer from critical operational vulnerabilities:
1. **Unpredictable Demand Surges & Stockouts:** Unexpected spikes in seasonal illnesses (e.g., flu, dengue, seasonal viral outbreaks) lead to stockouts of life-saving medications, antipyretics, and antibiotics.
2. **Medication Expiry & Financial Loss:** Pharmacies frequently over-order slow-moving pharmaceutical compounds that expire on shelves before dispensation, resulting in severe financial write-offs and hazardous medical waste.
3. **Static Rule-Based Reordering:** Traditional inventory systems rely on fixed, static reorder thresholds (e.g., "reorder when stock < 50") that completely ignore seasonal demand fluctuations, day-of-week trends, historical sales velocities, and supplier lead times.
4. **Disjointed Point of Sale (POS) and Stock Adjustment:** Lack of real-time synchronization between counter sales, inventory adjustments, expiry tracking, and procurement ordering causes delayed replenishment cycles and inventory discrepancy.
5. **Absence of Role-Based Security & Compliance Auditing:** Unrestricted stock and pricing modifications without strict immutable audit trails create compliance risks in regulated healthcare environments.

---

## 3. Project Objectives
1. **Intelligent Demand Forecasting:** Develop and deploy supervised Machine Learning regression models to accurately forecast 30-day future demand for pharmaceutical items based on historical sales patterns, seasonal indices, day-of-week trends, and rolling sales velocities.
2. **Automated Safety Stock & Reorder Computation:** Implement dynamic safety stock formulas ($20\%$ buffer) and automated reorder point calculation ($Reorder = \max(0, \text{Predicted Demand} + \text{Safety Stock} - \text{Current Available Stock})$) to eliminate human estimation errors.
3. **Multi-Model Competitive ML Pipeline:** Build an automated ML training and evaluation pipeline comparing **Random Forest Regressor**, **Gradient Boosting Regressor**, and **Linear Regression**, dynamically evaluating models on **Root Mean Squared Error (RMSE)**, **Mean Absolute Error (MAE)**, and **Coefficient of Determination ($R^2$)**, and deploying the best-performing model.
4. **End-to-End Real-Time Inventory Control:** Provide a centralized inventory management portal with real-time stock status classification (Optimal, Low Stock, Critical Stock, Near Expiry, Overstock).
5. **Integrated Point of Sale (POS) Engine:** Facilitate counter transactions that immediately deduct physical and available stock, record financial revenue, and trigger instant real-time forecast updates.
6. **Multi-Role Security & Auditability:** Enforce strict Role-Based Access Control (**RBAC**) across `admin`, `pharmacist`, and `manager` roles with JSON Web Token (**JWT**) authentication and automated Firestore-backed audit logging for all critical operations.
7. **Business Intelligence Reporting:** Provide dynamic PDF and Excel export services for sales reconciliations, inventory valuation, and procurement planning.

---

## 4. Proposed Solution
The proposed system integrates an asynchronous **FastAPI (Python 3.12)** backend, **Google Cloud Firestore (NoSQL)** database, **Scikit-Learn ML Engine**, and a modern **React 18 + Vite** frontend.

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                    |
|                      (React 18 + Vite + Tailwind CSS + Recharts)                   |
|   +----------------+ +----------------+ +----------------+ +------------------+   |
|   | Dashboard (BI) | | Inventory CRUD | |   POS Sales    | | ML Forecast Page |   |
|   +----------------+ +----------------+ +----------------+ +------------------+   |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JWT Auth)
                                           v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND API                                |
|                                (Python 3.12 Async)                                |
|   +------------------+  +--------------------+  +-------------------------------+ |
|   | Auth & RBAC      |  | Inventory & POS    |  | Reporting Service             | |
|   | (PyJWT + Bcrypt) |  | Business Logic     |  | (ReportLab PDF + OpenPyXL XL) | |
|   +------------------+  +--------------------+  +-------------------------------+ |
+-----------------------+----------------------------------+------------------------+
                        |                                  |
                        v                                  v
+-----------------------------------+     +-----------------------------------------+
|      AI / MACHINE LEARNING        |     |         DATABASE & CLOUD STORAGE        |
|    (Scikit-Learn, NumPy, Pandas)  |     |         (Google Cloud Firestore)        |
|  * Feature Engineering            |     |  * users        * medicines             |
|  * Linear / RF / GradientBoost    |     |  * inventory    * sales                 |
|  * Recursive 30-Day Forecaster    |     |  * forecasts    * suppliers             |
|  * Model Serialization (.joblib)  |     |  * audit_logs                           |
+-----------------------------------+     +-----------------------------------------+
```

---

## 5. Overall System Overview
The system functions as a closed-loop supply chain intelligence platform:
1. Historical sales datasets ($177,990+$ transactions spanning 6 years) train competitive regression models.
2. The deployed ML model generates recursive 30-day daily predictions for each pharmaceutical product.
3. Every counter transaction recorded through the POS terminal atomically updates Firestore inventory counts and immediately recalculates recommended purchase order quantities.
4. An automated Alert Center continuously monitors stock thresholds and expiration horizons ($<90$ days), providing one-click procurement order workflows.
5. All administrative, dispensation, and training actions are persisted into immutable audit logs.

---

## 6. System Architecture

### Architectural Style: Decoupled Multi-Tier Client-Server Architecture
1. **Presentation Tier (Client Layer):** Single Page Application (SPA) built using React 18, utilizing React Router DOM for client-side navigation, Tailwind CSS for glassmorphic styling, Lucide icons, and Recharts for interactive analytics visualization.
2. **API & Business Logic Tier (Application Layer):** High-performance asynchronous FastAPI REST service with modular routers, Pydantic data validation schemas, role checkers, and background worker threads.
3. **Intelligence Tier (Machine Learning Layer):** Python Scikit-Learn subsystem managing dataset preprocessing, feature extraction, cross-model training, artifact serialization (`joblib`), and recursive 30-day forward demand simulation.
4. **Persistence Tier (Database Layer):** Google Cloud Firestore NoSQL cloud database providing structured document-collection storage.
5. **Reporting & Document Generation Tier:** In-memory stream generation of PDF documents (`ReportLab`) and Excel workbooks (`OpenPyXL`).

---

## 7. Detailed Project Workflow

```
[ Historical Sales Data (CSV) ]
               │
               ▼
[ ML Feature Pipeline (Lag, Seasonality, Growth) ]
               │
               ▼
[ Model Training & Evaluation (Linear vs RF vs GBDT) ]
               │
               ▼
[ Best Model Deployed (.joblib) & Forecasts Cached ] ◄──────┐
               │                                            │ (Triggers Recalculation)
               ▼                                            │
[ Inventory Stock Registry (Firestore) ]                    │
               │                                            │
               ├──► [ Alert Center (Critical / Expiry) ]    │
               │                                            │
               └──► [ POS Sales Counter ] ──────────────────┘
                            │
                            ▼
               [ Instant Stock Deduction + Audit Log ]
                            │
                            ▼
               [ PDF / Excel BI Reports Export ]
```

1. **Authentication:** User supplies email and password. System checks Bcrypt hash in Firestore and issues an HS256 JWT access token containing user identity and role.
2. **Dashboard Initialization:** Client performs parallel asynchronous requests (`Promise.all`) fetching inventory counts, sales totals, active alerts, supplier counts, and ML evaluation metrics.
3. **Forecasting Request:** When a medicine is queried, `ml_engine.forecast_demand()` runs a 30-day recursive daily simulation using historical 30-day sales context and seasonal factors.
4. **Point of Sale (POS) Checkout:** Pharmacist selects item and quantity. Backend verifies stock availability, decrements `current_stock` and `available_stock`, writes the sale transaction, recalculates the forecast, and appends an audit record.
5. **Background Retraining:** Admin triggers `POST /api/forecast/train`. FastAPI spawns an asynchronous background task retraining all models on latest CSV/sales data without blocking HTTP request threads.

---

## 8. Technologies, Frameworks, Libraries, and Tools Used

### Backend & AI Stack
| Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Python** | 3.12.x | Primary backend and machine learning language |
| **FastAPI** | 0.111.0 | High-performance asynchronous REST API framework |
| **Uvicorn** | 0.30.1 | ASGI web server for asynchronous request handling |
| **Pydantic** | 2.7.4 | Data parsing, validation, and request/response schemas |
| **Scikit-Learn** | 1.5.0 | Core ML library: Linear Regression, Random Forest, Gradient Boosting |
| **Pandas** | 2.2.2 | Data analysis, time-series aggregations, rolling window calculations |
| **NumPy** | 1.26.4 | Numerical arrays, vector math, percentile capping, and clipping |
| **Joblib** | 1.4.2 | Model and pipeline artifact serialization/deserialization |
| **Firebase Admin SDK**| 6.5.0 | Firestore cloud database connectivity and certificate management |
| **PyJWT** | 2.8.0 | JWT generation, signing, and verification |
| **Bcrypt** | 4.1.3 | Secure cryptographic password hashing |
| **ReportLab** | 4.2.2 | Programmatic PDF report rendering with custom styling |
| **OpenPyXL** | 3.1.5 | Excel spreadsheet workbook generation and formatting |

### Frontend Stack
| Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| **React** | 18.3.1 | Component-based UI library |
| **Vite** | 5.4.11 | Fast frontend build tool, dev server, and API proxy engine |
| **Tailwind CSS** | 3.4.17 | Utility-first styling framework with custom medical color palette |
| **React Router DOM** | 6.28.0 | Declarative client-side routing and protected route guards |
| **Axios** | 1.7.9 | Promise-based HTTP client with request/response interceptors |
| **Recharts** | 2.15.0 | Composable React charting library (Area, Bar, Pie charts) |
| **Lucide React** | 0.468.0 | Modern SVG iconography |

---

## 9. AI/ML Concepts and Techniques Used

### 1. Supervised Regression
Demand forecasting is modeled as a supervised regression task where continuous target variable $y$ represents daily unit sales ($\text{units\_sold}$) for each specific pharmaceutical compound.

### 2. Time-Series Feature Engineering
To enable standard regression algorithms to capture temporal dynamics without data leakage:
* **Calendar Features:** Month ($1-12$), Quarter ($1-4$), Day of Week ($0-6$).
* **Seasonal Demand Index:** Mean daily sales for medicine $m$ in month $M$:
  $$\text{SeasonalDemand}_{m, M} = \frac{1}{|D_{m,M}|} \sum_{t \in D_{m,M}} y_{m,t}$$
* **Lagged Rolling Moving Averages:** Computed with `shift(1)` to eliminate look-ahead bias:
  $$\text{RollingAvg7}_t = \frac{1}{7} \sum_{i=1}^{7} y_{t-i}$$
  $$\text{RollingAvg30}_t = \frac{1}{30} \sum_{i=1}^{30} y_{t-i}$$
* **Sales Growth Velocity Rate:** Captures short-term acceleration versus medium-term baseline:
  $$\text{SalesGrowthRate}_t = \frac{\text{RollingAvg7}_t}{\text{RollingAvg30}_t + 10^{-5}}$$

### 3. Outlier Capping (Winsorization)
To prevent extreme demand spikes (e.g., bulk emergency hospital orders) from distorting model weights, sales are capped per medicine at the 99th percentile:
$$y_{m,t}^{\text{capped}} = \min(y_{m,t}, P_{99}(y_m))$$

### 4. Feature Normalization
Continuous engineered features ($\text{SeasonalDemand}$, $\text{RollingAvg7}$, $\text{RollingAvg30}$, $\text{SalesGrowthRate}$) are standardized using Z-score normalization:
$$z = \frac{x - \mu}{\sigma}$$

### 5. Multi-Model Competitive Evaluation
The pipeline trains three distinct algorithms on the training partition ($< 2025\text{-}07\text{-}01$) and validates them on the unseen test partition ($\ge 2025\text{-}07\text{-}01$):
* **Ordinary Least Squares (Linear Regression):** Baseline parametric model.
* **Random Forest Regressor:** Non-linear ensemble of decision trees with bootstrap aggregation (`n_estimators=30, max_depth=6`).
* **Gradient Boosting Regressor:** Sequential boosting optimizing residual errors (`n_estimators=30, max_depth=4`).

### 6. Recursive Forward-Step Multi-Period Demand Forecasting
To project 30 days into the future:
$$\text{For day } d \in [1, 30]:$$
1. Construct feature vector using calendar attributes of date $(T + d)$ and current rolling window memory.
2. Predict demand $\hat{y}_{T+d} = \max(0, \text{Model}(X_{T+d}))$.
3. Append $\hat{y}_{T+d}$ to the rolling history buffer, update 7-day and 30-day moving averages, and advance to day $d+1$.

---

## 10. Dataset and Data Sources

### Primary Datasets in Repository:

#### 1. Historical Sales Dataset: `datasets/pharmacy_sales.csv`
* **Size on Disk:** $15.45\text{ MB}$
* **Total Records:** $177,990\text{ rows}$
* **Temporal Coverage:** January 1, 2020 to December 31, 2025 ($6\text{ full years}$)
* **Granularity:** Daily sales transactions across multiple regions and categories
* **Attributes:**
  1. `date` (YYYY-MM-DD)
  2. `year` (Integer: 2020–2025)
  3. `month` (Integer: 1–12)
  4. `day` (Integer: 1–31)
  5. `region` (Geographic territory / zone)
  6. `country` (Country code / name)
  7. `category` (Therapeutic class: Chronic, Vitamin, Antibiotic, Cough_Cold, Antipyretic)
  8. `medicine` (Product commercial name)
  9. `age_group` (Demographic segment)
  10. `units_sold` (Continuous integer: quantity dispensed)
  11. `unit_price` (Float: unit selling price)
  12. `stock_level` (Integer: recorded closing stock)
  13. `expiry_days_remaining` (Integer: shelf life days)
  14. `covid_flag` (Binary flag: 0 or 1 for pandemic lockdown impact)

#### 2. Master Medicines Dataset: `datasets/medicines.csv`
* **Size on Disk:** $32.06\text{ MB}$
* **Contents:** Comprehensive commercial drug database containing trade names, active generic chemical compositions, manufacturer information, pack sizes, and prices in INR ($\text{₹}$). Used during database seeding (`seed.py`) to construct realistic master catalogs.

---

## 11. Data Preprocessing Pipeline

```
Raw CSV Dataset (177,990 rows)
               │
               ▼
[ Daily Aggregation by Date + Medicine + Category ]
               │
               ▼
[ Missing Value Imputation (fillna(0)) ]
               │
               ▼
[ 99th Percentile Outlier Capping per Medicine ]
               │
               ▼
[ Temporal Feature Extraction (Month, Quarter, DayOfWeek) ]
               │
               ▼
[ Lagged Rolling Feature Calculation (7-day & 30-day Shifted Averages) ]
               │
               ▼
[ Label Encoding (Medicine Names) & Standard Scaling (Features) ]
               │
               ▼
[ Temporal Split: Train (< 2025-07-01) vs Test (>= 2025-07-01) ]
```

---

## 12. Models and Algorithms

### Comparative Algorithm Summary

```
+---------------------+-------------------------------+-----------------------------------+
| Model Name          | Mathematical Basis            | Configuration in Code             |
+---------------------+-------------------------------+-----------------------------------+
| Linear Regression   | y = X beta + epsilon          | LinearRegression()                |
| Random Forest       | Bagging of Decision Trees     | n_estimators=30, max_depth=6      |
| Gradient Boosting   | Stage-wise Additive Boosting  | n_estimators=30, max_depth=4      |
+---------------------+-------------------------------+-----------------------------------+
```

### Evaluation Metrics Implemented
1. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2}$$
2. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |y_i - \hat{y}_i|$$
3. **Coefficient of Determination ($R^2$):**
   $$R^2 = 1 - \frac{\sum_{i=1}^{N} (y_i - \hat{y}_i)^2}{\sum_{i=1}^{N} (y_i - \bar{y})^2}$$

---

## 13. Major Modules and Components

1. **Authentication & Authorization Module (`backend/app/auth/`):**
   * Role-Based Access Control (`admin`, `pharmacist`, `manager`).
   * Password hashing via Bcrypt with dynamic salting.
   * Stateless HS256 JWT token generation and verification.
2. **Database Connectivity Layer (`backend/app/database/`):**
   * Singleton `DBConnection` class wrapping Google Cloud Firestore SDK.
   * Standardized CRUD and query methods (`get_all`, `get_by_id`, `create`, `update`, `delete`, `query`).
3. **Machine Learning Engine (`backend/app/ml/`):**
   * End-to-end data pipeline, model training, artifact caching, and recursive 30-day forecaster.
4. **API Endpoints Router (`backend/app/api/`):**
   * 17 distinct REST endpoints covering auth, inventory, sales, forecasting, alerts, reports, and audit logs.
5. **Reporting Service (`backend/app/services/`):**
   * Flowable PDF report generation (`ReportLab`) and styled Excel generation (`OpenPyXL`).
6. **Frontend Portal (`frontend/src/`):**
   * Reactive web application with role-aware navigation, interactive charts, and modal dialogs.

---

## 14. Detailed Explanation of Important Files

### Backend Files
* **[`backend/app/main.py`](file:///e:/Smart_Pharmacy_System/backend/app/main.py):** FastAPI root application entry point. Configures CORS middleware for `http://localhost:5173`, registers the `/api` sub-router, and provides root health check.
* **[`backend/app/api/endpoints.py`](file:///e:/Smart_Pharmacy_System/backend/app/api/endpoints.py):** Implements all REST API routes, request validation schemas (Pydantic), authorization dependencies, background task dispatching, and error handling.
* **[`backend/app/ml/engine.py`](file:///e:/Smart_Pharmacy_System/backend/app/ml/engine.py):** Implements the `MLEngine` class. Manages dataset reading, feature engineering, model training, model selection, joblib artifact persistence, and 30-day recursive demand forecasting.
* **[`backend/app/auth/jwt_handler.py`](file:///e:/Smart_Pharmacy_System/backend/app/auth/jwt_handler.py):** Implements Bcrypt password hashing/verification, JWT token creation, current user extraction, and the `RoleChecker` dependency class.
* **[`backend/app/database/connection.py`](file:///e:/Smart_Pharmacy_System/backend/app/database/connection.py):** Manages Google Cloud Firestore authentication via `serviceAccountKey.json` and exposes collection operations.
* **[`backend/app/services/reporting.py`](file:///e:/Smart_Pharmacy_System/backend/app/services/reporting.py):** Contains `ReportingService` with PDF generators (`generate_sales_pdf`, `generate_inventory_pdf`, `generate_forecast_pdf`) and Excel exporters (`export_inventory_excel`, `export_sales_excel`).
* **[`backend/seed.py`](file:///e:/Smart_Pharmacy_System/backend/seed.py):** Standalone database initialization script. Seeds default users (`usr_admin`, `usr_pharmacist`, `usr_manager`), pharmaceutical suppliers, real medicine records from `medicines.csv`, inventory records, historical sales, and initial ML demand forecasts into Firestore.

### Frontend Files
* **[`frontend/src/App.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/App.jsx):** Main React application component. Manages dark/light theme classes, integrates `AuthProvider`, and configures client-side route guards based on user roles.
* **[`frontend/src/context/AuthContext.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/context/AuthContext.jsx):** Provides authentication state context, sets Axios `baseURL = '/api'`, manages token persistence in `localStorage`, and injects `Authorization: Bearer <token>` headers.
* **[`frontend/src/pages/Dashboard.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/Dashboard.jsx):** Business intelligence overview featuring KPI summary cards, Recharts Area/Pie/Bar visualizers, and recent transactional lists.
* **[`frontend/src/pages/Inventory.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/Inventory.jsx):** Master inventory management interface supporting dynamic search, category filtering, stock adjustments, medicine creation, editing, deletion, and PDF/Excel report downloads.
* **[`frontend/src/pages/Sales.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/Sales.jsx):** Point of Sale (POS) dispensing terminal with dynamic pricing, stock verification, instant checkout, and historical sales table.
* **[`frontend/src/pages/Forecast.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/Forecast.jsx):** AI Forecasting page featuring medicine-specific 30-day projected demand graphs, safety stock indicators, recommended reorder quantities, model comparison cards, and background retraining triggers.
* **[`frontend/src/pages/AlertCenter.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/AlertCenter.jsx):** Operational alert feed categorizing items by Critical Stock, Low Stock, Near Expiry, and Overstock, with automated Purchase Order generation modal.
* **[`frontend/src/pages/AuditLogs.jsx`](file:///e:/Smart_Pharmacy_System/frontend/src/pages/AuditLogs.jsx):** Administrative audit trail viewer displaying timestamps, user IDs, action names, and change details.

---

## 15. Input → Processing → AI/Model → Output Flow

```
[ Input Data ]
  ├── 1. Historical Sales CSV (Units Sold, Dates, Medicine IDs, Categories)
  ├── 2. Real-Time Counter POS Dispensation (Medicine ID, Quantity)
  └── 3. Live Inventory Query (Medicine ID, Current Stock)
         │
         ▼
[ Processing & Feature Pipeline ]
  ├── Aggregate daily sales per medicine
  ├── Outlier capping at 99th percentile
  ├── Compute 7-day & 30-day lagged moving averages
  ├── Extract month, quarter, day of week
  └── Standard scale features via StandardScaler
         │
         ▼
[ AI / ML Model Inference (MLEngine) ]
  ├── Load trained Random Forest Regressor (.joblib)
  ├── Run 30-Day Recursive Step Simulation
  └── Sum projected daily units: Predicted Demand = SUM(day_1 .. day_30)
         │
         ▼
[ Output Generation ]
  ├── Safety Stock = 20% * Predicted Demand
  ├── Recommended Reorder = max(0, Predicted Demand + Safety Stock - Current Stock)
  ├── Confidence Score = R^2 validation metric
  ├── Visual 30-Day Interactive Area Chart (Frontend)
  └── Automated Restock Purchase Order Recommendation (Alert Center)
```

---

## 16. Frontend / UI Components and Functionality

| Page / Component | Key Visual & Interactive Features | RBAC Permissions |
| :--- | :--- | :--- |
| **Login (`Login.jsx`)** | Clean login form with quick-fill demo account buttons (`Admin`, `Pharmacist`, `Manager`) | Public |
| **Dashboard (`Dashboard.jsx`)** | 4 Top KPI cards, 30-Day Revenue Trend (AreaChart), Category Share (PieChart), Top Selling Medicines (BarChart), Recent Sales Feed | Authenticated (All Roles) |
| **Inventory (`Inventory.jsx`)** | Stock status badges (Optimal, Low, Critical), real-time search, category dropdown filter, Add/Edit/Delete modals, Excel/PDF export buttons | View: All; Add/Edit: Admin/Manager; Delete: Admin |
| **Sales POS (`Sales.jsx`)** | Interactive medicine selector, available stock indicator, real-time total price calculator, atomic checkout button, recent sales audit | Admin, Pharmacist |
| **Forecast (`Forecast.jsx`)** | 30-Day forecast AreaChart, confidence gauge, Safety Stock card, Recommended Reorder KPI, ML Models Comparison cards, Retrain ML button | View: All; Retrain: Admin |
| **Alert Center (`AlertCenter.jsx`)** | 4 Filter tabs (Critical, Low Stock, Near Expiry, Overstock), instant "Generate PO" modal with auto-calculated order quantities and supplier info | Authenticated (All Roles) |
| **Audit Logs (`AuditLogs.jsx`)** | Chronological security log table with action badges, user emails, timestamps, and metadata | Admin |

---

## 17. Backend, API, and Database Components

### Complete API Specification Matrix

| Method | Endpoint Path | Auth Required | Authorized Roles | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/auth/register` | No | Public | Register new user account with hashed password |
| `POST` | `/api/auth/login` | No | Public | Authenticate user and issue signed JWT access token |
| `POST` | `/api/auth/forgot-password` | No | Public | Password recovery simulation |
| `GET` | `/api/inventory` | Yes | All | Retrieve all medicines joined with stock and supplier data |
| `POST` | `/api/inventory` | Yes | `admin`, `manager` | Create new medicine and initialize inventory stock |
| `PUT` | `/api/inventory/{med_id}` | Yes | `admin`, `manager` | Update medicine specifications or manual stock count |
| `DELETE` | `/api/inventory/{med_id}` | Yes | `admin` | Delete medicine, inventory, and forecast documents |
| `GET` | `/api/sales` | Yes | All | Retrieve list of recorded sales sorted by date descending |
| `POST` | `/api/sales` | Yes | `admin`, `pharmacist` | Record POS sale, deduct stock, recalculate forecast |
| `GET` | `/api/forecast` | Yes | All | Retrieve all pre-computed forecast documents |
| `GET` | `/api/forecast/metrics` | Yes | All | Retrieve ML model comparison metrics (RMSE, MAE, R²) |
| `POST` | `/api/forecast/train` | Yes | `admin` | Trigger asynchronous background model retraining |
| `GET` | `/api/forecast/{med_id}` | Yes | All | Compute dynamic 30-day forecast for specific medicine |
| `GET` | `/api/alerts` | Yes | All | Compute critical stock, low stock, expiry, and overstock feeds |
| `GET` | `/api/reports/pdf` | Yes | All | Generate and stream PDF report (`sales`, `inventory`, `forecast`) |
| `GET` | `/api/reports/excel` | Yes | All | Generate and stream Excel workbook (`sales`, `inventory`) |
| `GET` | `/api/suppliers` | Yes | All | Retrieve supplier catalog |
| `POST` | `/api/suppliers` | Yes | `admin`, `manager` | Add new supplier entity |
| `GET` | `/api/audit_logs` | Yes | `admin` | Retrieve system audit logs sorted by timestamp descending |

---

## 18. Integration Between Components

1. **Frontend-to-Backend Proxy:** The Vite development server configures a reverse proxy mapping `/api` requests to `http://127.0.0.1:8000`, eliminating Cross-Origin Resource Sharing (CORS) preflight friction during development while allowing seamless production routing.
2. **Stateless JWT Injection:** `AuthContext.jsx` injects `Authorization: Bearer <token>` on all Axios HTTP dispatches. FastAPI's `OAuth2PasswordBearer` and `get_current_user` dependency decode and validate the token on every protected route.
3. **Reactive Forecast Recalculation:** When a POS transaction occurs (`POST /api/sales`), the backend immediately updates inventory stock in Firestore and calls `ml_engine.forecast_demand()` to update the forecasted reorder quantity in the `forecasts` collection.
4. **Decoupled Asynchronous Retraining:** When `POST /api/forecast/train` is invoked, FastAPI uses `BackgroundTasks` to execute `ml_engine.train_pipeline()` on a worker thread, allowing the HTTP endpoint to return immediately (`200 OK`) while models train in the background.

---

## 19. Key Implementation Details

### Dynamic Reorder & Safety Stock Formula
$$\text{Safety Stock} = \text{round}(\text{Predicted 30-Day Demand} \times 0.20)$$
$$\text{Recommended Reorder} = \max(0, \text{Predicted 30-Day Demand} + \text{Safety Stock} - \text{Current Stock})$$

### Automated Stock Classification Thresholds
* **Critical Stock:** $\text{Current Stock} < 0.50 \times \text{Reorder Level}$
* **Low Stock:** $\text{Current Stock} < \text{Reorder Level}$
* **Near Expiry:** $\text{Expiry Date} - \text{Current Date} \le 90\text{ days}$
* **Overstock:** $\text{Current Stock} > 3.0 \times \text{Reorder Level}$

---

## 20. Results and Actual Produced Metrics

### ML Model Evaluation Results (Verified on Unseen Test Partition)
```
+--------------------------+------------+------------+-----------+--------------+
| Model Algorithm          | RMSE       | MAE        | R² Score  | Selection    |
+--------------------------+------------+------------+-----------+--------------+
| Random Forest Regressor  | 561.65     | 355.47     | 0.2581    | DEPLOYED (1) |
| Gradient Boosting        | 568.69     | 383.81     | 0.2394    | Candidate(2) |
| Linear Regression        | 579.25     | 371.28     | 0.2109    | Candidate(3) |
+--------------------------+------------+------------+-----------+--------------+
```

### Verified System Outputs Produced
* **Trained Artifacts:** `trained_models/best_forecast_model.joblib` ($271.8\text{ KB}$), `ml_artifacts.joblib` ($6.3\text{ KB}$), `model_metadata.json` ($624\text{ B}$).
* **Export Documents:** Live generated binary streams for `sales_report.pdf`, `inventory_report.pdf`, `forecast_report.pdf`, `sales_export.xlsx`, `inventory_export.xlsx`.
* **Database Records:** Seeded Firestore collections containing 3 default users, 4 certified pharmaceutical suppliers, real commercial medications with verified compositions, stock balances, historical POS sales records, and active audit trails.

---

## 21. Testing and Validation Performed

1. **API Integration & Endpoint Testing:** Automated Python test scripts validated HTTP status codes ($200, 201, 401, 403, 404$), JWT authorization headers, and JSON schema compliance across all 17 routes.
2. **Machine Learning Pipeline Validation:** Tested temporal train/test split consistency, lag feature generation with zero data leakage, and verified that `forecast_demand()` outputs valid positive values across all medicine items.
3. **Database Connectivity Validation:** Verified real-time write, query, update, and delete operations against Google Cloud Firestore.
4. **Frontend Production Build Verification:** Executed `npm run build` using Vite 5.4.11 with zero syntax errors, type errors, or bundle chunking failures.

---

## 22. Limitations
1. **Cold-Start for Newly Added Medications:** For completely new drug products with no prior sales history, the rolling moving average features fall back to generic seasonal category averages until transaction history accumulates.
2. **External Market Shock Variables:** While the dataset includes historical pandemic indicators (`covid_flag`), external variables such as real-time epidemiological outbreak alerts or localized supply chain disruptions are not currently pulled from live external APIs.
3. **Single-Store Scope:** The current implementation models inventory and sales for a single pharmacy facility rather than a distributed multi-warehouse supply network.

---

## 23. Future Scope
1. **Deep Learning Integration:** Implement Recurrent Neural Networks (**LSTM** / **GRU**) or Temporal Fusion Transformers (**TFT**) to capture extended long-term seasonal cycles.
2. **Automated Supplier EDI Integration:** Connect procurement purchase order generation directly to pharmaceutical distributor APIs (Electronic Data Interchange / EDI) for fully autonomous stock replenishment.
3. **Barcode / QR Code Scanner Integration:** Hardware integration with POS barcode scanners for automated batch number and expiry verification during dispensation.
4. **Patient Prescription OCR:** Integration with Google Cloud Vision OCR or Gemini Multimodal AI to parse handwritten physician prescriptions directly into POS dispensation carts.

---

## 24. Installation and Execution Procedure

### Prerequisites
* **Python:** 3.12.x installed with virtual environment support
* **Node.js:** v18+ or v20+ / v24+ with `npm`
* **Firebase Service Account:** Valid `serviceAccountKey.json` placed in repository root

### Step 1: Backend Setup and Execution
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed database with initial data and train ML model
python seed.py

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend URL: `http://127.0.0.1:8000`
* Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

### Step 2: Frontend Setup and Execution
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* Frontend Application URL: `http://localhost:5173`

### Default System Test Accounts
* **Administrator:** `admin@pharmacy.com` / `admin123` *(Full access: Inventory, POS, Audit Logs, ML Retraining)*
* **Pharmacist:** `pharmacist@pharmacy.com` / `pharmacist123` *(Access: Inventory View, POS Sales, Forecasts, Alerts)*
* **Manager:** `manager@pharmacy.com` / `manager123` *(Access: Inventory Management, Forecasts, Alerts, Reports)*

---

## 25. Project Directory Structure with Explanations

```
E:\Smart_Pharmacy_System\
│
├── serviceAccountKey.json          # Google Cloud Firestore Service Account Certificate (Private Credentials)
├── README.md                       # Project overview and quickstart guide
├── walkthrough.md                  # Detailed developer walkthrough and execution history
├── demo_presentation.md            # Visual presentation and screen carousel documentation
├── PROJECT_DOCUMENTATION.md        # Comprehensive technical documentation for academic AI report
│
├── datasets/                       # Data storage directory
│   ├── pharmacy_sales.csv          # Historical 6-year sales dataset (177,990 rows)
│   └── medicines.csv               # Master Indian pharmaceutical catalogue (32 MB)
│
├── trained_models/                 # Serialized Machine Learning artifacts
│   ├── best_forecast_model.joblib  # Deployed Best Regressor (Random Forest)
│   ├── ml_artifacts.joblib         # Scaler, LabelEncoder, Seasonal Map, Sales History
│   └── model_metadata.json         # Performance metrics (RMSE, MAE, R²) and selection logs
│
├── backend/                        # FastAPI Backend Application
│   ├── requirements.txt            # Python package dependencies
│   ├── seed.py                     # Database initialization and Firestore seeder
│   └── app/                        # Application source package
│       ├── __init__.py
│       ├── main.py                 # FastAPI app entry point & CORS configuration
│       ├── api/
│       │   ├── __init__.py
│       │   └── endpoints.py        # All 17 REST API endpoints and Pydantic schemas
│       ├── auth/
│       │   ├── __init__.py
│       │   └── jwt_handler.py      # Bcrypt hashing, JWT generation & RoleChecker (RBAC)
│       ├── database/
│       │   ├── __init__.py
│       │   └── connection.py       # Firestore NoSQL singleton connection wrapper
│       ├── ml/
│       │   ├── __init__.py
│       │   └── engine.py           # ML pipeline, feature engineering & recursive forecaster
│       └── services/
│           ├── __init__.py
│           └── reporting.py        # ReportLab PDF & OpenPyXL Excel export service
│
├── frontend/                       # React 18 + Vite Frontend Portal
│   ├── package.json                # NPM dependency manifest
│   ├── vite.config.js              # Vite server & API proxy configuration (/api -> :8000)
│   ├── tailwind.config.js          # Tailwind CSS theme & custom medical color tokens
│   ├── postcss.config.js           # PostCSS Tailwind & Autoprefixer plugin setup
│   ├── index.html                  # HTML entry point with Google Fonts
│   └── src/                        # React source code
│       ├── main.jsx                # React DOM createRoot entry point
│       ├── App.jsx                 # Route manager, role protection & dark mode handler
│       ├── index.css               # Tailwind base directives & glassmorphism utilities
│       ├── components/
│       │   └── Sidebar.jsx         # Responsive sidebar navigation with role filtering
│       ├── context/
│       │   └── AuthContext.jsx     # React Context for JWT auth, user state & Axios config
│       ├── pages/
│       │   ├── Login.jsx           # Sign-in portal with quick demo account selector
│       │   ├── Dashboard.jsx       # BI executive overview & Recharts visualizations
│       │   ├── Inventory.jsx       # Inventory registry, stock CRUD & report exports
│       │   ├── Sales.jsx           # Point of Sale (POS) dispensation terminal
│       │   ├── Forecast.jsx        # AI demand forecasting & ML model comparison cards
│       │   ├── AlertCenter.jsx     # Critical/low stock & expiry feeds with PO generator
│       │   └── AuditLogs.jsx       # System compliance audit log viewer
│       └── services/               # Configured direct client SDKs (Optional / Reference)
│           ├── firebase.js
│           └── db.js
│
├── docs/                           # Technical documentation
│   └── api_docs.md                 # Detailed REST API endpoint specification
│
└── evidence/                       # Export samples and UI screenshots
    ├── sales_report.pdf            # Sample generated sales PDF
    ├── inventory_report.pdf        # Sample generated inventory PDF
    ├── forecast_report.pdf         # Sample generated forecast PDF
    ├── sales_export.xlsx           # Sample generated sales Excel workbook
    └── inventory_export.xlsx       # Sample generated inventory Excel workbook
```

---

## 26. Architecture & Flow Diagrams for Academic Presentation

### Diagram 1: Detailed End-to-End System Architecture
```
+─────────────────────────────────────────────────────────────────────────────────────────+
│                                  PRESENTATION LAYER                                     │
│                     React 18 + Vite + Tailwind CSS + Recharts (SPA)                     │
│                                                                                         │
│  [ Login Portal ]  [ BI Dashboard ]  [ Inventory CRUD ]  [ POS Sales ]  [ ML Forecast ] │
+────────────────────────────────────────────┬────────────────────────────────────────────+
                                             │ HTTPS / JSON REST API
                                             │ (Bearer JWT Authorization)
                                             ▼
+─────────────────────────────────────────────────────────────────────────────────────────+
│                                APPLICATION LAYER (FastAPI)                              │
│                                                                                         │
│  +─────────────────────────+  +──────────────────────────+  +─────────────────────────+ │
│  │     Authentication      │  │     Business Logic       │  │    Reporting Engine     │ │
│  │ (PyJWT / Bcrypt / RBAC) │  │  (Inventory & POS Routes)│  │ (ReportLab / OpenPyXL)  │ │
│  +─────────────────────────+  +──────────────────────────+  +─────────────────────────+ │
+──────────────────────────────┬────────────────────────────┬─────────────────────────────+
                               │                            │
                               ▼                            ▼
+─────────────────────────────────────────────────+  +────────────────────────────────────+
│            INTELLIGENCE LAYER (MLEngine)        │  │     DATABASE LAYER (Firestore)     │
│                                                 │  │                                    │
│  [ Preprocessing & 99th % Outlier Capping ]     │  │  Collections:                      │
│  [ Lagged Rolling Averages & Seasonality Index] │  │  * users       * medicines         │
│  [ Multi-Model Training (Linear, RF, GBDT) ]    │  │  * inventory   * sales             │
│  [ Recursive 30-Day Forward Step Simulator ]    │  │  * forecasts   * suppliers         │
│  [ Joblib Serialized Pipeline Artifacts ]       │  │  * audit_logs                      │
+─────────────────────────────────────────────────+  +────────────────────────────────────+
```

### Diagram 2: Machine Learning Pipeline & Inference Flow
```
[ Historical Sales (177,990 rows) ]
                 │
                 ▼
[ Aggregate Daily Units Sold (Date + Medicine + Category) ]
                 │
                 ▼
[ Feature Engineering (Month, DayOfWeek, SeasonalDemand, RollingAvg7, RollingAvg30, GrowthRate) ]
                 │
                 ▼
[ Temporal Partitioning: Train (< 2025-07-01) vs Test (>= 2025-07-01) ]
                 │
                 ├───────────────────────────────┬───────────────────────────────┐
                 ▼                               ▼                               ▼
    [ Linear Regression ]              [ Random Forest ]            [ Gradient Boosting ]
      RMSE: 579.25, R²: 0.2109           RMSE: 561.65, R²: 0.2581      RMSE: 568.69, R²: 0.2394
                 │                               │                               │
                 └───────────────────────┬───────┴───────────────────────────────┘
                                         ▼
                        [ Model Selection: Random Forest ]
                                         │
                                         ▼
                      [ Persist to best_forecast_model.joblib ]
                                         │
                                         ▼
                  [ Recursive 30-Day Forward Demand Forecasting ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ 30-Day Total Predicted Demand ]               [ 20% Dynamic Safety Stock ]
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                 [ Recommended Reorder = max(0, Demand + Safety - Current Stock) ]
```

---

## 27. Important Technical Observations for Academic Report Writing

1. **Superiority of Ensemble Non-Linear Methods:** In pharmaceutical retail demand modeling, **Random Forest Regressor** outperformed classical Ordinary Least Squares Linear Regression by reducing RMSE from $579.25$ to $561.65$ ($3.04\%$ error reduction) and increasing explained variance ($R^2$) from $0.2109$ to $0.2581$ ($+22.38\%$ relative gain), demonstrating the presence of non-linear seasonal interactions and complex temporal sales growth patterns.
2. **Preventing Data Leakage in Time-Series Features:** To maintain strict predictive validity on future unseen intervals, rolling moving averages ($\text{RollingAvg7}$ and $\text{RollingAvg30}$) must strictly be calculated using lag-1 shifted series (`shift(1)`). Calculating rolling metrics that include the current day's target introduces fatal look-ahead bias and invalidates real-world deployment.
3. **Robustness of Winsorization on Pharmaceutical Demand:** Pharmaceutical demand is frequently affected by abnormal localized buying shocks. Applying medicine-specific 99th percentile capping prevented outlier-induced weight distortion during gradient updates while retaining authentic underlying seasonal trends.
4. **Impact of Recursive Simulation on Long-Horizon Estimates:** Unlike direct multi-horizon forecasting, recursive multi-step autoregressive forecasting allows the dynamic recalculation of 7-day and 30-day moving averages as each successive day is projected, producing smooth, realistic forecast trajectories.
5. **Architectural Security & Decoupled Data Access:** Rather than having the browser directly interact with Cloud Firestore via client-side keys, routing all operations through a secure FastAPI middle tier with HS256 JWT validation ensures complete encapsulation of database credentials (`serviceAccountKey.json`), enforcement of business constraints, and automated immutable audit logging for medical compliance.

---
*Document compiled and verified against repository source files on October 3, 2026.*
