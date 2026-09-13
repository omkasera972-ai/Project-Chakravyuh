import requests

BASE_URL = "http://127.0.0.1:8000"
USERNAME = "testadmin_alert_del"
PASSWORD = "password123"

# 1. Login
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"moduleId": "attendance", "username": USERNAME, "password": PASSWORD}
)

if login_res.status_code != 200:
    requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"moduleId": "attendance", "username": USERNAME, "password": PASSWORD, "confirmPassword": PASSWORD}
    )
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"moduleId": "attendance", "username": USERNAME, "password": PASSWORD}
    )

token = login_res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Mark attendance for test student
mark_res = requests.post(
    f"{BASE_URL}/api/attendance/mark",
    json={
        "id": "STU-E2E-TEST",
        "name": "Test Student Verification",
        "role": "Student",
        "department": "Computer Science",
        "status": "Present",
        "date": "2026-09-13"
    },
    headers=headers
)
print("Mark attendance response:", mark_res.status_code, mark_res.json())

# 3. Fetch initial-data to verify student personnel object
res = requests.get(f"{BASE_URL}/api/initial-data", headers=headers)
personnel = res.json().get("data", {}).get("personnel", [])
print(f"Personnel records retrieved: {len(personnel)}")

stu = next((p for p in personnel if p.get("id") == "STU-E2E-TEST"), None)
if stu:
    print("Found updated student record:")
    print("Status:", stu.get("status"))
    print("Entry:", stu.get("entry"))
    print("AttendanceHistory:", stu.get("attendanceHistory"))
    if stu.get("status") == "Present" and "2026-09-13" in stu.get("attendanceHistory", {}):
        print("\n========================================================")
        print("VERIFICATION SUCCESS: Student attendance synced perfectly!")
        print("========================================================\n")
    else:
        print("VERIFICATION FAILED: Status or history not updated properly.")
else:
    print("Test student record not found.")
