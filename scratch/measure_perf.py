import time
import requests

urls = [
    'http://127.0.0.1:8000/api/auth/me',
    'http://127.0.0.1:8000/api/criminal/officer_information',
    'http://127.0.0.1:8000/api/criminal/camera_network',
    'http://127.0.0.1:8000/api/attendance/personnel',
    'http://127.0.0.1:8000/api/criminal/watchlist',
    'http://127.0.0.1:8000/api/anpr/vehicles',
    'http://127.0.0.1:8000/api/missing-children/records',
    'http://127.0.0.1:8000/api/defence/inventory'
]

print("--- MEASURING BACKEND ENDPOINT LATENCY ---")
for url in urls:
    t0 = time.perf_counter()
    try:
        r = requests.get(url, timeout=10)
        t1 = time.perf_counter()
        ms = (t1 - t0) * 1000
        print(f"{url}: {ms:.2f} ms | status: {r.status_code}")
    except Exception as e:
        t1 = time.perf_counter()
        ms = (t1 - t0) * 1000
        print(f"{url}: {ms:.2f} ms | ERROR: {e}")
