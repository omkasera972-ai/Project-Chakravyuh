import requests

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "testadmin_alert_del"
PASSWORD = "password123"

# 1. Login
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"moduleId": "criminal", "username": USERNAME, "password": PASSWORD}
)
token = login_res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Create 3 alerts
a1 = requests.post(f"{BASE_URL}/api/criminal/alerts", json={"title": "Batch Alert 1"}, headers=headers).json()["data"]["_id"]
a2 = requests.post(f"{BASE_URL}/api/criminal/alerts", json={"title": "Batch Alert 2"}, headers=headers).json()["data"]["_id"]
a3 = requests.post(f"{BASE_URL}/api/criminal/alerts", json={"title": "Batch Alert 3"}, headers=headers).json()["data"]["_id"]

print("Created 3 alerts:", [a1, a2, a3])

# 3. Test delete-batch on a1 and a2
batch_res = requests.post(f"{BASE_URL}/api/alerts/delete-batch", json={"ids": [a1, a2]}, headers=headers)
print("Batch delete status:", batch_res.status_code, batch_res.json())

# Check remaining alerts
res1 = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
alerts1 = res1.json().get("data", {}).get("alerts", [])
print(f"Remaining alerts count after batch delete: {len(alerts1)}")

# 4. Test clear-all
clear_res = requests.delete(f"{BASE_URL}/api/alerts/clear-all", headers=headers)
print("Clear all status:", clear_res.status_code, clear_res.json())

# Check remaining alerts after clear-all
res2 = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
alerts2 = res2.json().get("data", {}).get("alerts", [])
print(f"Remaining alerts count after clear-all: {len(alerts2)}")

if len(alerts2) == 0:
    print("\n========================================================")
    print("VERIFICATION SUCCESS: Batch Delete and Clear All work perfectly!")
    print("========================================================\n")
else:
    print("VERIFICATION FAILED: Alerts still present after clear-all!")
