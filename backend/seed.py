import os
import sys
import uuid
import random
import pandas as pd
from datetime import datetime, timedelta

# Ensure backend folder is in path for imports
sys.path.append(os.path.dirname(__file__))

from app.database.connection import db
from app.auth.jwt_handler import hash_password
from app.ml.engine import ml_engine

MEDICINES_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "medicines.csv")

def run_seeding():
    print("=== STARTING SMART PHARMACY DATABASE SEEDING ===")

    # 1. Clear existing mock database if any (re-initialize)
    if not db.is_firebase:
        db.mock_data = {}
        print("Cleared existing mock DB.")
    else:
        print("Connected to Firestore. Adding data if not already exists.")

    # 2. Seed Users
    from firebase_admin import auth as fb_auth
    users_to_seed = [
        {
            "user_id": "usr_admin",
            "name": "Admin Manager",
            "email": "admin@pharmacy.com",
            "role": "admin",
            "password_hash": hash_password("admin123"),
            "created_at": datetime.now().isoformat()
        },
        {
            "user_id": "usr_pharmacist",
            "name": "Sarah Croft",
            "email": "pharmacist@pharmacy.com",
            "role": "pharmacist",
            "password_hash": hash_password("pharmacist123"),
            "created_at": datetime.now().isoformat()
        },
        {
            "user_id": "usr_manager",
            "name": "John Doe",
            "email": "manager@pharmacy.com",
            "role": "manager",
            "password_hash": hash_password("manager123"),
            "created_at": datetime.now().isoformat()
        }
    ]

    for user in users_to_seed:
        db.create("users", user["user_id"], user)
    print(f"Seeded {len(users_to_seed)} users in Firestore.")

    # 3. Seed Suppliers
    suppliers_to_seed = [
        {
            "supplier_id": "sup_alembic",
            "supplier_name": "Alembic Pharmaceuticals Logistics Ltd",
            "contact": "+91 9876543210",
            "email": "logistics@alembic.com",
            "address": "GIDC Estate, Vadodara, Gujarat, India"
        },
        {
            "supplier_id": "sup_glaxo",
            "supplier_name": "GSK India Distributors",
            "contact": "+91 9998887776",
            "email": "distributors@gsk.in",
            "address": "Worli, Mumbai, Maharashtra, India"
        },
        {
            "supplier_id": "sup_sanofi",
            "supplier_name": "Sanofi India Supply Chain",
            "contact": "+91 8887776665",
            "email": "supplies@sanofi.com",
            "address": "Saki Naka, Andheri, Mumbai, India"
        },
        {
            "supplier_id": "sup_glenmark",
            "supplier_name": "Glenmark Pharma Distributors",
            "contact": "+91 7776665554",
            "email": "sales@glenmark.com",
            "address": "Nashik Road, Nashik, Maharashtra, India"
        }
    ]

    for supplier in suppliers_to_seed:
        db.create("suppliers", supplier["supplier_id"], supplier)
    print(f"Seeded {len(suppliers_to_seed)} suppliers.")

    # 4. Parse A-Z medicines and find matches for generic categories
    generic_mappings = {
        "Antibiotic": [
            {"generic": "Azithromycin", "keywords": ["azithral", "azee"], "supplier": "sup_alembic"},
            {"generic": "Amoxicillin", "keywords": ["augmentin", "amoxyclav"], "supplier": "sup_glaxo"}
        ],
        "Chronic": [
            {"generic": "Amlodipine", "keywords": ["amlodac", "stamlo", "amlokind"], "supplier": "sup_alembic"},
            {"generic": "Metformin", "keywords": ["glycomet", "met small"], "supplier": "sup_sanofi"}
        ],
        "Vitamin": [
            {"generic": "Vitamin C", "keywords": ["limcee", "celin"], "supplier": "sup_sanofi"},
            {"generic": "Multivitamin", "keywords": ["becosules", "supradyn"], "supplier": "sup_glaxo"}
        ],
        "Cough_Cold": [
            {"generic": "Cough Syrup", "keywords": ["ascoril", "alex syrup", "benadryl"], "supplier": "sup_glenmark"},
            {"generic": "Cetirizine", "keywords": ["alerid", "okacet"], "supplier": "sup_glenmark"}
        ],
        "Antipyretic": [
            {"generic": "Paracetamol", "keywords": ["calpol", "crocin", "dolo"], "supplier": "sup_glaxo"},
            {"generic": "Ibuprofen", "keywords": ["brufen", "combiflam"], "supplier": "sup_alembic"}
        ]
    }

    print("Reading medicines dataset to select matching brand name medicines...")
    try:
        df_med = pd.read_csv(MEDICINES_PATH)
        print(f"Successfully loaded medicines.csv with {len(df_med)} rows.")
    except Exception as e:
        print(f"Error loading medicines.csv: {e}. Seeding with placeholder medicines.")
        # Create a tiny dummy df if reading failed
        df_med = pd.DataFrame([
            {"id": 1, "name": "Calpol 650 Tablet", "price(₹)": 30.50, "manufacturer_name": "GlaxoSmithKline", "type": "allopathy", "short_composition1": "Paracetamol (650mg)"}
        ])

    seeded_medicines = []
    med_id_counter = 1

    for category, items in generic_mappings.items():
        for item in items:
            generic_name = item["generic"]
            supplier_id = item["supplier"]
            
            # Find a match in the dataset using keywords
            matched_df = pd.DataFrame()
            if len(df_med) > 1:
                for kw in item["keywords"]:
                    subset = df_med[df_med['name'].str.contains(kw, case=False, na=False)]
                    if not subset.empty:
                        matched_df = pd.concat([matched_df, subset])
                        
            # Select 2 matches if possible
            matches = []
            if not matched_df.empty:
                # Deduplicate and take top 2
                matched_df = matched_df.drop_duplicates(subset=['name'])
                matches = matched_df.head(2).to_dict('records')
            
            # If no matches, generate mock entries
            if len(matches) < 2:
                shortage = 2 - len(matches)
                for s in range(shortage):
                    kw = item["keywords"][0]
                    mock_name = f"{kw.capitalize()} Brand-{s+1} Tablet"
                    matches.append({
                        "id": med_id_counter * 1000,
                        "name": mock_name,
                        "price(₹)": float(random.randint(50, 250)),
                        "manufacturer_name": "Generic Indian Manufacturer Ltd",
                        "type": "allopathy",
                        "short_composition1": f"{generic_name} (500mg)"
                    })
                    med_id_counter += 1

            # Save to Medicines and Inventory
            for m in matches:
                med_id = f"med_{m.get('id', random.randint(10000, 99999))}"
                price = float(m.get("price(₹)", 100.0))
                if pd.isna(price) or price <= 0:
                    price = 45.0
                cost_price = round(price * 0.70, 2)
                
                # Expiry date: Randomly spread between 10 days and 500 days
                # To test "near expiry within 30 days" and "critical stock", we'll make:
                # - One medicine expire in 15 days
                # - Another have low stock
                # - The rest normal
                expiry_offset = random.randint(45, 450)
                if generic_name == "Paracetamol" and "calpol" in m.get("name", "").lower():
                    # Set near expiry for testing!
                    expiry_offset = 15
                    
                expiry_date = (datetime.now() + timedelta(days=expiry_offset)).strftime("%Y-%m-%d")
                
                # Stock level: Randomize stock
                # - Azithromycin: make low stock (current stock < reorder level)
                # - Amoxicillin: make critical stock (current stock < reorder level * 0.5)
                # - Limcee (Vitamin C): make overstock (current stock > predicted demand * 2)
                reorder_level = 500
                current_stock = random.randint(600, 1500)
                
                if generic_name == "Azithromycin":
                    current_stock = 350  # Low stock alert trigger
                elif generic_name == "Amoxicillin":
                    current_stock = 150  # Critical stock alert trigger
                elif generic_name == "Vitamin C":
                    current_stock = 8500  # Overstock alert trigger (forecast will be ~3500)
                
                reserved_stock = random.randint(10, 50)
                available_stock = current_stock - reserved_stock
                
                medicine_doc = {
                    "medicine_id": med_id,
                    "name": m.get("name", "Generic Medicine"),
                    "generic_name": generic_name,
                    "category": category,
                    "manufacturer": m.get("manufacturer_name", "Unknown Manufacturer"),
                    "batch_no": f"B2026-{generic_name[:2].upper()}{random.randint(10, 99)}",
                    "price": price,
                    "cost_price": cost_price,
                    "supplier_id": supplier_id,
                    "reorder_level": reorder_level,
                    "expiry_date": expiry_date,
                    "created_at": datetime.now().isoformat()
                }
                
                inventory_doc = {
                    "inventory_id": f"inv_{med_id}",
                    "medicine_id": med_id,
                    "current_stock": current_stock,
                    "reserved_stock": reserved_stock,
                    "available_stock": available_stock,
                    "last_updated": datetime.now().isoformat()
                }
                
                db.create("medicines", med_id, medicine_doc)
                db.create("inventory", f"inv_{med_id}", inventory_doc)
                
                seeded_medicines.append(medicine_doc)

    print(f"Seeded {len(seeded_medicines)} medicines and corresponding inventory stock files.")

    # 5. Seed Historical Sales
    print("Seeding recent sales history for chart visualizations...")
    today = datetime.now()
    sales_count = 0
    for med in seeded_medicines:
        # Generate 5-10 sales records in the last 30 days
        num_sales = random.randint(8, 15)
        for s in range(num_sales):
            days_ago = random.randint(0, 30)
            sale_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
            qty = random.randint(5, 40)
            rev = round(qty * med["price"], 2)
            sale_id = f"sale_{uuid.uuid4().hex[:8]}"
            
            sale_doc = {
                "sale_id": sale_id,
                "medicine_id": med["medicine_id"],
                "medicine_name": med["name"],
                "category": med["category"],
                "quantity": qty,
                "sale_date": sale_date,
                "revenue": rev
            }
            db.create("sales", sale_id, sale_doc)
            sales_count += 1
            
    print(f"Seeded {sales_count} sales transactions.")

    # 6. Seed Audit Logs
    audit_logs = [
        {
            "log_id": "audit_1",
            "action": "Database Initialization",
            "user": "admin@pharmacy.com",
            "timestamp": (datetime.now() - timedelta(minutes=10)).isoformat(),
            "details": "Database seeded with default users, suppliers, medicines, and inventory records."
        }
    ]
    for log in audit_logs:
        db.create("audit_logs", log["log_id"], log)
    print("Seeded basic audit logs.")

    # 7. Pre-compute and Seed Forecasts
    # If the ML model is trained, use it. Otherwise, use mock values.
    print("Generating demand forecasts and intelligent reorder suggestions...")
    for med in seeded_medicines:
        med_id = med["medicine_id"]
        # Retrieve stock
        inv = db.get_by_id("inventory", f"inv_{med_id}")
        current_stock = inv["current_stock"] if inv else 1000
        
        # Calculate forecast using ML Engine
        forecast = ml_engine.forecast_demand(med["name"], current_stock)
        
        forecast_id = f"forc_{med_id}"
        forecast_doc = {
            "forecast_id": forecast_id,
            "medicine_id": med_id,
            "medicine_name": med["name"],
            "category": med["category"],
            "predicted_demand": forecast["predicted_demand"],
            "recommended_reorder": forecast["recommended_reorder"],
            "confidence_score": forecast["confidence_score"],
            "forecast_date": today.strftime("%Y-%m-%d"),
            "safety_stock": forecast["safety_stock"]
        }
        db.create("forecasts", forecast_id, forecast_doc)
        
    print("Seeded forecasts and reorder predictions.")
    print("=== SEEDING COMPLETED SUCCESSFULY ===")

if __name__ == "__main__":
    run_seeding()
