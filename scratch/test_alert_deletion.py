import requests
import json

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "testadmin_alert_del"
PASSWORD = "password123"

# Try login or register
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"moduleId": "criminal", "username": USERNAME, "password": PASSWORD}
)

if login_res.status_code != 200:
    reg_res = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"moduleId": "criminal", "username": USERNAME, "password": PASSWORD, "confirmPassword": PASSWORD}
    )
    if reg_res.status_code == 200:
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"moduleId": "criminal", "username": USERNAME, "password": PASSWORD}
        )

data = login_res.json()
token = data.get("token") or data.get("access_token")
print("Logged in successfully. Token received:", bool(token))
headers = {"Authorization": f"Bearer {token}"}

# 1. Create a dummy alert
create_res = requests.post(
    f"{BASE_URL}/api/criminal/alerts",
    json={"title": "Test Deletion Alert", "priority": "High", "camera": "CAM-99", "location": "Sector 5"},
    headers=headers
)
print("Create alert status:", create_res.status_code, create_res.json())

# 2. Get initial data to verify created alert
res = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
initial = res.json()
alerts = initial.get("data", {}).get("alerts", [])
print(f"Total alerts in DB: {len(alerts)}")

test_alert = next((a for a in alerts if a.get("title") == "Test Deletion Alert"), None)
if test_alert:
    doc_id = str(test_alert.get("_id") or test_alert.get("id"))
    print(f"Found test alert doc_id: {doc_id}. Now attempting permanent deletion...")

    # 3. Call DELETE /api/alerts/{doc_id}
    del_res = requests.delete(f"{BASE_URL}/api/alerts/{doc_id}", headers=headers)
    print("Delete endpoint status:", del_res.status_code, del_res.json())

    # 4. Fetch initial data again to verify it is NOT in MongoDB anymore
    res_after = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
    alerts_after = res_after.json().get("data", {}).get("alerts", [])
    found_after = any(str(a.get("_id")) == doc_id or str(a.get("id")) == doc_id or a.get("title") == "Test Deletion Alert" for a in alerts_after)

    if not found_after:
        print("\n========================================================")
        print("VERIFICATION SUCCESS: Deleted alert is PERMANENTLY deleted from MongoDB!")
        print("========================================================\n")
    else:
        print("\nVERIFICATION FAILED: Alert still exists after deletion attempt!")
else:
    print("Test alert could not be found after creation.")
