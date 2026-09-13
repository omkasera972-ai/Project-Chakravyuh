import requests
import time

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "testadmin_alert_del"
PASSWORD = "password123"

# 1. Login
t0 = time.time()
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"moduleId": "criminal", "username": USERNAME, "password": PASSWORD}
)
t_login = (time.time() - t0) * 1000
print(f"Login Time: {t_login:.2f} ms")

token = login_res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Measure /api/initial-data speed
t1 = time.time()
res = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
t_initial = (time.time() - t1) * 1000
print(f"Initial Data API Time: {t_initial:.2f} ms | Status: {res.status_code}")

# 3. Inspect payload size
content_len = len(res.content)
print(f"Payload Size: {content_len / 1024:.2f} KB")
