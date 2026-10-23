import requests
import os

BASE_URL = "http://localhost:8000/api"
EVIDENCE_DIR = "c:\\Users\\user\\OneDrive\\Desktop\\Smart_Pharmacy_System\\evidence"

def download_reports():
    print("=== DOWNLOADING DEMO REPORT FILES ===")
    
    # 1. Login
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@pharmacy.com",
        "password": "admin123"
    })
    
    if res.status_code != 200:
        print("Auth failed.")
        return
        
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Files to download
    files = [
        {"url": f"{BASE_URL}/reports/pdf?type=sales", "filename": "sales_report.pdf"},
        {"url": f"{BASE_URL}/reports/pdf?type=inventory", "filename": "inventory_report.pdf"},
        {"url": f"{BASE_URL}/reports/pdf?type=forecast", "filename": "forecast_report.pdf"},
        {"url": f"{BASE_URL}/reports/excel?type=sales", "filename": "sales_export.xlsx"},
        {"url": f"{BASE_URL}/reports/excel?type=inventory", "filename": "inventory_export.xlsx"}
    ]
    
    for f in files:
        target_path = os.path.join(EVIDENCE_DIR, f["filename"])
        print(f"Downloading {f['filename']}...")
        try:
            res = requests.get(f["url"], headers=headers)
            if res.status_code == 200:
                with open(target_path, "wb") as out:
                    out.write(res.content)
                print(f"Saved: {target_path} ({len(res.content)} bytes)")
            else:
                print(f"Failed to fetch {f['filename']}: {res.status_code}")
        except Exception as e:
            print(f"Error: {e}")
            
    print("=== REPORTS DOWNLOADED successfully ===")

if __name__ == "__main__":
    download_reports()
