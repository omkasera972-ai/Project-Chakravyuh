import sys
import os
import urllib.request
import json

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_dir = os.path.join(root_dir, 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

try:
    from backend.routers.auth import create_admin_token
except ImportError:
    from routers.auth import create_admin_token

token = create_admin_token("ADM-CRIM-1789132093", "admin", "criminal")

url = "http://127.0.0.1:8000/api/alerts/dispatch-auto"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
payload = {
    "targetName": "Automatic Detection Test",
    "targetId": "CRIM-TEST-422",
    "crimeType": "Armed Robbery Surveillance",
    "cameraNode": "WEB-Cam01",
    "confidence": "98.5%",
    "lat": 24.515996,
    "lng": 75.702526
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
