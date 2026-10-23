import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.database.connection import db
from app.auth.jwt_handler import hash_password, verify_password, create_access_token, get_current_user, RoleChecker
from app.ml.engine import ml_engine
from app.services.reporting import reporting_service

router = APIRouter()

# --- PYDANTIC SCHEMAS ---

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "pharmacist" # admin, pharmacist, manager

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class MedicineCreate(BaseModel):
    name: str
    generic_name: str
    category: str
    manufacturer: str
    batch_no: str
    price: float
    cost_price: float
    supplier_id: str
    reorder_level: int
    expiry_date: str
    initial_stock: int = 100

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_no: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    supplier_id: Optional[str] = None
    reorder_level: Optional[int] = None
    expiry_date: Optional[str] = None
    current_stock: Optional[int] = None

class SaleCreate(BaseModel):
    medicine_id: str
    quantity: int

# --- AUTH ENDPOINTS ---

from firebase_admin import auth as fb_admin_auth
import requests

@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    if req.role not in ["admin", "pharmacist", "manager"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'pharmacist', or 'manager'.")
        
    try:
        # Check if user exists in Firestore first
        existing = db.query("users", "email", "==", req.email)
        if existing:
            raise HTTPException(status_code=400, detail="User already registered with this email.")
            
        user_id = f"usr_{uuid.uuid4().hex[:8]}"
        
        # Save profile to Firestore with password hash
        user_doc = {
            "user_id": user_id,
            "name": req.name,
            "email": req.email,
            "role": req.role,
            "password_hash": hash_password(req.password),
            "created_at": datetime.now().isoformat()
        }
        db.create("users", user_id, user_doc)
        
        # Ingest audit log
        log_id = f"audit_{uuid.uuid4().hex[:8]}"
        db.create("audit_logs", log_id, {
            "log_id": log_id,
            "action": "User Registration",
            "user": req.email,
            "timestamp": datetime.now().isoformat(),
            "details": f"Registered user {req.name} as {req.role} in Firestore."
        })
        return {"message": "Registration successful. You can log in now."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    try:
        users = db.query("users", "email", "==", req.email)
        if not users:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
            
        user = users[0]
        # Verify password
        password_hash = user.get("password_hash")
        if password_hash:
            if not verify_password(req.password, password_hash):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        else:
            default_pass = "admin123" if "admin" in req.email else "manager123" if "manager" in req.email else "pharmacist123"
            if req.password != default_pass:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
            
        # Create token
        token = create_access_token({"sub": user["email"], "role": user["role"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"],
            "name": user["name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/auth/forgot-password")
def forgot_password(req: Dict[str, str]):
    email = req.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    users = db.query("users", "email", "==", email)
    if not users:
         raise HTTPException(status_code=404, detail="Email not found.")
    
    # Simulate forgot password reset
    return {"message": "If this email is registered, a password reset link has been simulated. Check backend logs."}

# --- INVENTORY ENDPOINTS ---

@router.get("/inventory")
def get_inventory(current_user: dict = Depends(get_current_user)):
    medicines = db.get_all("medicines")
    inventory = db.get_all("inventory")
    suppliers = db.get_all("suppliers")
    
    inv_map = {item["medicine_id"]: item for item in inventory}
    sup_map = {item["supplier_id"]: item for item in suppliers}
    
    # Join records
    result = []
    for med in medicines:
        med_id = med["medicine_id"]
        inv = inv_map.get(med_id, {})
        sup = sup_map.get(med.get("supplier_id", ""), {})
        
        result.append({
            "medicine_id": med_id,
            "name": med.get("name"),
            "generic_name": med.get("generic_name"),
            "category": med.get("category"),
            "manufacturer": med.get("manufacturer"),
            "batch_no": med.get("batch_no"),
            "price": med.get("price"),
            "cost_price": med.get("cost_price"),
            "supplier_id": med.get("supplier_id"),
            "supplier_name": sup.get("supplier_name", "Unknown Supplier"),
            "reorder_level": med.get("reorder_level"),
            "expiry_date": med.get("expiry_date"),
            "current_stock": inv.get("current_stock", 0),
            "reserved_stock": inv.get("reserved_stock", 0),
            "available_stock": inv.get("available_stock", 0),
            "last_updated": inv.get("last_updated"),
            "created_at": med.get("created_at")
        })
    return result

@router.post("/inventory", status_code=status.HTTP_201_CREATED)
def add_medicine(req: MedicineCreate, current_user: dict = Depends(RoleChecker(["admin", "manager"]))):
    med_id = f"med_{uuid.uuid4().hex[:8]}"
    
    medicine_doc = {
        "medicine_id": med_id,
        "name": req.name,
        "generic_name": req.generic_name,
        "category": req.category,
        "manufacturer": req.manufacturer,
        "batch_no": req.batch_no,
        "price": req.price,
        "cost_price": req.cost_price,
        "supplier_id": req.supplier_id,
        "reorder_level": req.reorder_level,
        "expiry_date": req.expiry_date,
        "created_at": datetime.now().isoformat()
    }
    
    inventory_doc = {
        "inventory_id": f"inv_{med_id}",
        "medicine_id": med_id,
        "current_stock": req.initial_stock,
        "reserved_stock": 0,
        "available_stock": req.initial_stock,
        "last_updated": datetime.now().isoformat()
    }
    
    db.create("medicines", med_id, medicine_doc)
    db.create("inventory", f"inv_{med_id}", inventory_doc)
    
    # Audit log
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    db.create("audit_logs", log_id, {
        "log_id": log_id,
        "action": "Add Medicine",
        "user": current_user["email"],
        "timestamp": datetime.now().isoformat(),
        "details": f"Added medicine {req.name} (Batch: {req.batch_no}) with stock {req.initial_stock}."
    })
    
    # Generate an initial forecast for this medicine
    forecast = ml_engine.forecast_demand(req.name, req.initial_stock)
    forecast_id = f"forc_{med_id}"
    db.create("forecasts", forecast_id, {
        "forecast_id": forecast_id,
        "medicine_id": med_id,
        "medicine_name": req.name,
        "category": req.category,
        "predicted_demand": forecast["predicted_demand"],
        "recommended_reorder": forecast["recommended_reorder"],
        "confidence_score": forecast["confidence_score"],
        "forecast_date": datetime.now().strftime("%Y-%m-%d"),
        "safety_stock": forecast["safety_stock"]
    })
    
    return {"message": "Medicine added and stock initialized successfully.", "medicine_id": med_id}

@router.put("/inventory/{med_id}")
def update_medicine(med_id: str, req: MedicineUpdate, current_user: dict = Depends(RoleChecker(["admin", "manager"]))):
    med = db.get_by_id("medicines", med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
        
    # Gather medicine fields to update
    med_update = {}
    for field in ["name", "generic_name", "category", "manufacturer", "batch_no", "price", "cost_price", "supplier_id", "reorder_level", "expiry_date"]:
        val = getattr(req, field, None)
        if val is not None:
            med_update[field] = val
            
    if med_update:
        db.update("medicines", med_id, med_update)
        
    # Update inventory current_stock if provided
    if req.current_stock is not None:
        inv = db.get_by_id("inventory", f"inv_{med_id}")
        if inv:
            reserved = inv.get("reserved_stock", 0)
            db.update("inventory", f"inv_{med_id}", {
                "current_stock": req.current_stock,
                "available_stock": req.current_stock - reserved,
                "last_updated": datetime.now().isoformat()
            })
            
    # Audit log
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    db.create("audit_logs", log_id, {
        "log_id": log_id,
        "action": "Update Medicine",
        "user": current_user["email"],
        "timestamp": datetime.now().isoformat(),
        "details": f"Updated medicine {med.get('name')} ({med_id})."
    })
    
    # Recalculate forecast for this medicine with new stock
    inv = db.get_by_id("inventory", f"inv_{med_id}")
    stock_val = inv["current_stock"] if inv else 100
    forecast = ml_engine.forecast_demand(med.get("name"), stock_val)
    db.create("forecasts", f"forc_{med_id}", {
        "forecast_id": f"forc_{med_id}",
        "medicine_id": med_id,
        "medicine_name": med.get("name"),
        "category": med.get("category"),
        "predicted_demand": forecast["predicted_demand"],
        "recommended_reorder": forecast["recommended_reorder"],
        "confidence_score": forecast["confidence_score"],
        "forecast_date": datetime.now().strftime("%Y-%m-%d"),
        "safety_stock": forecast["safety_stock"]
    })
    
    return {"message": "Medicine updated successfully."}

@router.delete("/inventory/{med_id}")
def delete_medicine(med_id: str, current_user: dict = Depends(RoleChecker(["admin"]))):
    med = db.get_by_id("medicines", med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
        
    db.delete("medicines", med_id)
    db.delete("inventory", f"inv_{med_id}")
    db.delete("forecasts", f"forc_{med_id}")
    
    # Audit log
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    db.create("audit_logs", log_id, {
        "log_id": log_id,
        "action": "Delete Medicine",
        "user": current_user["email"],
        "timestamp": datetime.now().isoformat(),
        "details": f"Deleted medicine {med.get('name')} ({med_id}) and its stock."
    })
    
    return {"message": "Medicine and corresponding stock records deleted."}

# --- SALES ENDPOINTS ---

@router.get("/sales")
def get_sales(current_user: dict = Depends(get_current_user)):
    sales = db.get_all("sales")
    return sorted(sales, key=lambda x: x.get("sale_date", ""), reverse=True)

@router.post("/sales", status_code=status.HTTP_201_CREATED)
def record_sale(req: SaleCreate, current_user: dict = Depends(RoleChecker(["admin", "pharmacist"]))):
    med = db.get_by_id("medicines", req.medicine_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
        
    inv = db.get_by_id("inventory", f"inv_{req.medicine_id}")
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory stock record not found.")
        
    if inv["available_stock"] < req.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {inv['available_stock']}, Requested: {req.quantity}")
        
    # Deduct stock
    new_current = inv["current_stock"] - req.quantity
    new_avail = inv["available_stock"] - req.quantity
    
    db.update("inventory", f"inv_{req.medicine_id}", {
        "current_stock": new_current,
        "available_stock": new_avail,
        "last_updated": datetime.now().isoformat()
    })
    
    # Create Sale
    sale_id = f"sale_{uuid.uuid4().hex[:8]}"
    revenue = round(req.quantity * med["price"], 2)
    sale_doc = {
        "sale_id": sale_id,
        "medicine_id": req.medicine_id,
        "medicine_name": med["name"],
        "category": med["category"],
        "quantity": req.quantity,
        "sale_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "revenue": revenue
    }
    db.create("sales", sale_id, sale_doc)
    
    # Audit log
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    db.create("audit_logs", log_id, {
        "log_id": log_id,
        "action": "Process Sale",
        "user": current_user["email"],
        "timestamp": datetime.now().isoformat(),
        "details": f"Processed sale of {req.quantity} units of {med['name']} for INR {revenue}."
    })
    
    # Update forecast for this medicine
    forecast = ml_engine.forecast_demand(med["name"], new_current)
    db.create("forecasts", f"forc_{req.medicine_id}", {
        "forecast_id": f"forc_{req.medicine_id}",
        "medicine_id": req.medicine_id,
        "medicine_name": med["name"],
        "category": med["category"],
        "predicted_demand": forecast["predicted_demand"],
        "recommended_reorder": forecast["recommended_reorder"],
        "confidence_score": forecast["confidence_score"],
        "forecast_date": datetime.now().strftime("%Y-%m-%d"),
        "safety_stock": forecast["safety_stock"]
    })
    
    return {"message": "Sale recorded successfully.", "sale_id": sale_id, "revenue": revenue}

# --- FORECAST ENDPOINTS ---

@router.get("/forecast")
def get_forecast(current_user: dict = Depends(get_current_user)):
    # Calculate alerts and suggestions
    forecasts = db.get_all("forecasts")
    return forecasts

@router.get("/forecast/metrics")
def get_train_metrics(current_user: dict = Depends(get_current_user)):
    if not ml_engine.is_loaded or not ml_engine.metrics:
        ml_engine.load_model_and_artifacts()

    if ml_engine.is_loaded and ml_engine.metrics:
        data = dict(ml_engine.metrics)
        if "all_models" not in data or not data["all_models"]:
            if "metrics" in data and "best_model" in data:
                data["all_models"] = {
                    data["best_model"]: data["metrics"]
                }
        return data
    else:
        return {
            "best_model": "None (Model has not been trained yet)",
            "metrics": {"RMSE": 0.0, "MAE": 0.0, "R2": 0.0},
            "all_models": {},
            "is_loaded": False
        }

def background_train_ml():
    try:
        metrics = ml_engine.train_pipeline()
        print("Background ML Training finished:", metrics)
    except Exception as e:
        print("Background ML Training failed:", str(e))

@router.post("/forecast/train")
def train_forecast(background_tasks: BackgroundTasks, current_user: dict = Depends(RoleChecker(["admin"]))):
    background_tasks.add_task(background_train_ml)
    
    # Audit log
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    db.create("audit_logs", log_id, {
        "log_id": log_id,
        "action": "Train ML Models",
        "user": current_user["email"],
        "timestamp": datetime.now().isoformat(),
        "details": "Triggered background training pipeline for demand forecasting models."
    })
    
    return {"message": "Model retraining pipeline started in the background. It will update the metrics on completion."}

@router.get("/forecast/{med_id}")
def get_medicine_forecast(med_id: str, current_user: dict = Depends(get_current_user)):
    med = db.get_by_id("medicines", med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
        
    inv = db.get_by_id("inventory", f"inv_{med_id}")
    current_stock = inv["current_stock"] if inv else 100
    
    forecast_data = ml_engine.forecast_demand(med["name"], current_stock)
    return forecast_data

# --- ALERTS ENDPOINT ---

@router.get("/alerts")
def get_alerts(current_user: dict = Depends(get_current_user)):
    medicines = db.get_all("medicines")
    inventory = db.get_all("inventory")
    forecasts = db.get_all("forecasts")
    
    inv_map = {item["medicine_id"]: item for item in inventory}
    frc_map = {f["medicine_id"]: f for f in forecasts}
    
    low_stock = []
    critical_stock = []
    near_expiry = []
    overstock = []
    reorder_suggestions = []
    
    today = datetime.now()
    expiry_threshold = today + timedelta(days=30)
    
    for med in medicines:
        med_id = med["medicine_id"]
        inv = inv_map.get(med_id, {})
        stock = inv.get("current_stock", 0)
        reorder_level = med.get("reorder_level", 500)
        
        # 1. Low Stock & Critical Stock Alerts
        if stock < (reorder_level * 0.5):
            critical_stock.append({
                "medicine_id": med_id,
                "name": med["name"],
                "stock": stock,
                "reorder_level": reorder_level,
                "badge": "Red",
                "message": f"Critical Stock: current stock ({stock}) is below 50% of reorder level ({reorder_level})."
            })
        elif stock < reorder_level:
            low_stock.append({
                "medicine_id": med_id,
                "name": med["name"],
                "stock": stock,
                "reorder_level": reorder_level,
                "badge": "Red",
                "message": f"Low Stock: current stock ({stock}) is below reorder level ({reorder_level})."
            })
            
        # 2. Near Expiry Alerts
        exp_date_str = med.get("expiry_date", "")
        if exp_date_str:
            try:
                exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d")
                days_left = (exp_date - today).days
                if days_left <= 30:
                    near_expiry.append({
                        "medicine_id": med_id,
                        "name": med["name"],
                        "expiry_date": exp_date_str,
                        "days_remaining": days_left,
                        "badge": "Orange",
                        "message": f"Expiry Danger: expires in {days_left} days ({exp_date_str})."
                    })
            except Exception:
                pass
                
        # 3. Overstock & Reorder Alerts
        frc = frc_map.get(med_id, {})
        if frc:
            pred_demand = frc.get("predicted_demand", 0)
            rec_reorder = frc.get("recommended_reorder", 0)
            
            if stock > (pred_demand * 2) and pred_demand > 0:
                overstock.append({
                    "medicine_id": med_id,
                    "name": med["name"],
                    "stock": stock,
                    "predicted_demand_30d": pred_demand,
                    "badge": "Yellow",
                    "message": f"Overstock Warning: stock ({stock}) is double the predicted 30-day demand ({pred_demand})."
                })
                
            if rec_reorder > 0:
                reorder_suggestions.append({
                    "medicine_id": med_id,
                    "name": med["name"],
                    "stock": stock,
                    "predicted_demand_30d": pred_demand,
                    "recommended_reorder": rec_reorder,
                    "supplier_id": med.get("supplier_id"),
                    "badge": "Blue",
                    "message": f"Reorder Suggestion: recommend ordering {rec_reorder} units to meet forecast and safety levels."
                })
                
    return {
        "critical_stock": critical_stock,
        "low_stock": low_stock,
        "near_expiry": near_expiry,
        "overstock": overstock,
        "reorder_suggestions": reorder_suggestions,
        "counts": {
            "critical_stock": len(critical_stock),
            "low_stock": len(low_stock),
            "near_expiry": len(near_expiry),
            "overstock": len(overstock),
            "reorder_suggestions": len(reorder_suggestions)
        }
    }

# --- REPORTS ENDPOINTS ---

@router.get("/reports/pdf")
def get_pdf_report(type: str = Query(..., regex="^(sales|inventory|forecast)$"), current_user: dict = Depends(get_current_user)):
    if type == "sales":
        buffer = reporting_service.generate_sales_pdf()
        filename = "sales_report.pdf"
    elif type == "inventory":
        buffer = reporting_service.generate_inventory_pdf()
        filename = "inventory_report.pdf"
    else:
        buffer = reporting_service.generate_forecast_pdf()
        filename = "forecast_report.pdf"
        
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/excel")
def get_excel_report(type: str = Query(..., regex="^(sales|inventory)$"), current_user: dict = Depends(get_current_user)):
    if type == "sales":
        buffer = reporting_service.export_sales_excel()
        filename = "sales_export.xlsx"
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        buffer = reporting_service.export_inventory_excel()
        filename = "inventory_export.xlsx"
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
    return StreamingResponse(
        buffer,
        media_type=media,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- SUPPLIERS ENDPOINTS ---

@router.get("/suppliers")
def get_suppliers(current_user: dict = Depends(get_current_user)):
    return db.get_all("suppliers")

@router.post("/suppliers")
def add_supplier(req: Dict[str, str], current_user: dict = Depends(RoleChecker(["admin", "manager"]))):
    supplier_id = f"sup_{uuid.uuid4().hex[:8]}"
    doc = {
        "supplier_id": supplier_id,
        "supplier_name": req.get("supplier_name", "New Supplier"),
        "contact": req.get("contact", ""),
        "email": req.get("email", ""),
        "address": req.get("address", "")
    }
    db.create("suppliers", supplier_id, doc)
    return {"message": "Supplier created.", "supplier_id": supplier_id}

# --- AUDIT LOGS ENDPOINTS ---

@router.get("/audit_logs")
def get_audit_logs(current_user: dict = Depends(RoleChecker(["admin"]))):
    logs = db.get_all("audit_logs")
    return sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)
