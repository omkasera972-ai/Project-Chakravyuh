import asyncio
import os
import sys

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_dir = os.path.join(root_dir, 'backend')

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

try:
    from backend.utils.notifier import send_criminal_alert
except Exception:
    from utils.notifier import send_criminal_alert  # type: ignore # noqa

async def main():
    print("Testing send_criminal_alert...")
    print("EMAIL_USER:", os.getenv("EMAIL_USER"))
    print("EMAIL_PASS:", os.getenv("EMAIL_PASS")[:4] + "****" if os.getenv("EMAIL_PASS") else None)

    alert_payload = {
        "name": "Dup Suspect Test",
        "id": "CRIM-DUP-99",
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "risk_level": "Critical Risk",
        "crime_details": "Under Active Watchlist Surveillance",
        "ipc_charges": "IPC 302 / 395 - Armed Robbery & Homicide",
        "age": "34"
    }
    location_payload = {
        "cam_id": "CAM-01",
        "camera_location": "Web cam",
        "lat": 24.516094,
        "lng": 75.702581
    }

    res = await send_criminal_alert(alert_payload, location_payload)
    print("RESULT:", res)

if __name__ == "__main__":
    asyncio.run(main())
