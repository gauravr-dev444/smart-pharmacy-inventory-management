# Smart Pharmacy Inventory Management System - API Documentation

The Smart Pharmacy System backend is built in **FastAPI (Python)** and runs locally on `http://localhost:8000`. It features role-based access control (RBAC), JWT Authentication, Firestore DB connections, and an AI Demand Forecasting Engine.

---

## 1. Authentication Module

### Register User
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "Sarah Croft",
    "email": "pharmacist@pharmacy.com",
    "password": "pharmacist123",
    "role": "pharmacist"
  }
  ```
  *(Supported roles: `admin`, `pharmacist`, `manager`)*
* **Response**:
  ```json
  {
    "message": "Registration successful. You can log in now."
  }
  ```

### Login & Get Token
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "admin@pharmacy.com",
    "password": "admin123"
  }
  ```
* **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "admin",
    "name": "Admin Manager"
  }
  ```

### Forgot Password
* **Endpoint**: `POST /api/auth/forgot-password`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "admin@pharmacy.com"
  }
  ```
* **Response**:
  ```json
  {
    "message": "If this email is registered, a password reset link has been simulated. Check backend logs."
  }
  ```

---

## 2. Inventory Management Module

### List Medicines & Stock Level
* **Endpoint**: `GET /api/inventory`
* **Access**: Authenticated (`admin`, `pharmacist`, `manager`)
* **Response**:
  ```json
  [
    {
      "medicine_id": "med_1000",
      "name": "Calpol 650 Tablet",
      "generic_name": "Paracetamol",
      "category": "Antipyretic",
      "manufacturer": "GSK Pharmaceuticals Ltd",
      "batch_no": "B2026-PA01",
      "price": 30.5,
      "cost_price": 21.35,
      "supplier_id": "sup_glaxo",
      "supplier_name": "GSK India Distributors",
      "reorder_level": 500,
      "expiry_date": "2026-07-02",
      "current_stock": 1200,
      "reserved_stock": 12,
      "available_stock": 1188,
      "last_updated": "2026-06-17T16:13:03.495784"
    }
  ]
  ```

### Add Medicine
* **Endpoint**: `POST /api/inventory`
* **Access**: Restrictive (`admin`, `manager`)
* **Request Body**:
  ```json
  {
    "name": "Becosules Capsule",
    "generic_name": "Multivitamin",
    "category": "Vitamin",
    "manufacturer": "Pfizer Ltd",
    "batch_no": "B2026-MV15",
    "price": 45.5,
    "cost_price": 31.85,
    "supplier_id": "sup_glaxo",
    "reorder_level": 300,
    "expiry_date": "2027-06-30",
    "initial_stock": 1000
  }
  ```
* **Response**:
  ```json
  {
    "message": "Medicine added and stock initialized successfully.",
    "medicine_id": "med_a23b45c"
  }
  ```

### Edit Medicine / Stock level
* **Endpoint**: `PUT /api/inventory/{id}`
* **Access**: Restrictive (`admin`, `manager`)
* **Request Body**:
  *(Provide fields to update)*
  ```json
  {
    "price": 48.0,
    "current_stock": 1250
  }
  ```
* **Response**:
  ```json
  {
    "message": "Medicine updated successfully."
  }
  ```

### Delete Medicine
* **Endpoint**: `DELETE /api/inventory/{id}`
* **Access**: Admin (`admin`)
* **Response**:
  ```json
  {
    "message": "Medicine and corresponding stock records deleted."
  }
  ```

---

## 3. Sales Module

### Record Client Sale
* **Endpoint**: `POST /api/sales`
* **Access**: Restrictive (`admin`, `pharmacist`)
* **Request Body**:
  ```json
  {
    "medicine_id": "med_1000",
    "quantity": 10
  }
  ```
* **Response**:
  ```json
  {
    "message": "Sale recorded successfully.",
    "sale_id": "sale_7fc128",
    "revenue": 305.0
  }
  ```
  *(Deducts `10` units from `current_stock` and `available_stock` and recalculates forecasting automatically)*

### View Sales Transactions
* **Endpoint**: `GET /api/sales`
* **Access**: Authenticated (`admin`, `pharmacist`, `manager`)

---

## 4. Machine Learning & Forecasting Module

### Retrieve 30-Day Demand Forecast
* **Endpoint**: `GET /api/forecast/{med_id}`
* **Access**: Authenticated
* **Response**:
  ```json
  {
    "medicine_name": "Calpol 650 Tablet",
    "generic_name": "Paracetamol",
    "predicted_demand": 3450,
    "safety_stock": 690,
    "recommended_reorder": 2940,
    "confidence_score": 0.758,
    "forecast_series": [
      { "date": "2026-06-18", "demand": 115 },
      { "date": "2026-06-19", "demand": 122 }
    ],
    "is_mock": false,
    "metrics": {
      "RMSE": 561.65,
      "MAE": 355.47,
      "R2": 0.258
    },
    "best_model": "RandomForest"
  }
  ```

### Retrain ML Forecasting Models
* **Endpoint**: `POST /api/forecast/train`
* **Access**: Admin (`admin`)
* **Response**:
  ```json
  {
    "message": "Model retraining pipeline started in the background. It will update the metrics on completion."
  }
  ```
  *(Triggers training of Linear Regression, Random Forest, and Gradient Boosting Regressors on `datasets/pharmacy_sales.csv` and auto-chooses the best one)*

### View Model Metrics
* **Endpoint**: `GET /api/forecast/metrics`
* **Access**: Authenticated

---

## 5. Alerts & Reporting Modules

### Fetch Alerts & Suggestion Feeds
* **Endpoint**: `GET /api/alerts`
* **Access**: Authenticated
* **Response**: List of Low Stock, Critical Stock, Near Expiry, Overstock, and Reorder suggestions.

### Download PDF Report
* **Endpoint**: `GET /api/reports/pdf?type=sales|inventory|forecast`
* **Access**: Authenticated
* **Response**: Streamed PDF attachment.

### Download Excel Spreadsheet Export
* **Endpoint**: `GET /api/reports/excel?type=sales|inventory`
* **Access**: Authenticated
* **Response**: Streamed Excel attachment.

### Fetch Audit Logs
* **Endpoint**: `GET /api/audit_logs`
* **Access**: Admin (`admin`)
* **Response**: Sorted security logs.
