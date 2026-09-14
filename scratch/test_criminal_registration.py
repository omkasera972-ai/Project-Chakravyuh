import requests

BASE_URL = "http://127.0.0.1:8000"

def test_criminal_registration():
    # 1. Login to get token
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "password123",
        "moduleId": "criminal-tracking"
    })
    print("Login Status:", login_resp.status_code)
    print("Login Data:", login_resp.json())
    
    if login_resp.status_code == 200:
        token = login_resp.json().get("token")
    else:
        print("Login failed, trying to register an account first...")
        import uuid
        uname = f"test_officer_{uuid.uuid4().hex[:4]}"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": uname,
            "password": "password123",
            "moduleId": "criminal-tracking",
            "full_name": "Officer Test"
        })
        print("Register Status:", reg_resp.status_code)
        token = reg_resp.json().get("token")
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Try POST /api/criminal/watchlist
    watchlist_payload = {
        "name": "Test Criminal Case",
        "riskLevel": "Critical Risk",
        "crimeType": "Robbery & Extortion",
        "age": 35,
        "lastSeen": "CAM-01 Station",
        "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "status": "Active Alert",
        "details": "[IPC: IPC 302] Test details"
    }
    
    post_res = requests.post(f"{BASE_URL}/api/criminal/watchlist", json=watchlist_payload, headers=headers)
    print("POST /api/criminal/watchlist Status:", post_res.status_code)
    print("POST /api/criminal/watchlist Response:", post_res.json())
    
    # 3. Try POST /api/criminal/registered-data
    reg_data_payload = {
        "name": "Test Criminal Registered Data",
        "riskLevel": "High Risk",
        "crimeType": "Cyber Fraud",
        "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    post_reg_res = requests.post(f"{BASE_URL}/api/criminal/registered-data", json=reg_data_payload, headers=headers)
    print("POST /api/criminal/registered-data Status:", post_reg_res.status_code)
    print("POST /api/criminal/registered-data Response:", post_reg_res.json())

if __name__ == "__main__":
    test_criminal_registration()
