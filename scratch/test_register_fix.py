import urllib.request
import json

url = "http://127.0.0.1:8000/api/auth/register"
headers = {"Content-Type": "application/json"}
payload = {
    "username": "lakh_test_user",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "fullName": "Lakh Officer",
    "email": "lakh.officer@police.gov.in",
    "police_station_name": "Indore Police Station",
    "police_station_address": "Indore HQ",
    "moduleId": "criminal"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        print("STATUS CODE:", resp.status)
        print("RESPONSE:", json.loads(resp.read().decode("utf-8")))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode("utf-8"))
