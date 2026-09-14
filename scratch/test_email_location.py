import asyncio
import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_dir)

try:
    from backend.utils.notifier import send_criminal_alert  # type: ignore # pyright: ignore
except ImportError:
    from utils.notifier import send_criminal_alert  # type: ignore # pyright: ignore

async def test():
    print("Testing send_criminal_alert camera network location resolution...")
    # Simulate a payload sent from live webcam with browser GPS (e.g. lat=19.076, lng=72.877 - Mumbai)
    criminal_data = {
        "name": "Test Criminal",
        "id": "W-TEST-99"
    }
    webcam_location_data = {
        "cam_id": "CAM-01 Live Webcam",
        "lat": 19.0760,  # Live webcam location
        "lng": 72.8770
    }
    
    # We pass webcam_location_data to send_criminal_alert
    res = await send_criminal_alert(criminal_data, webcam_location_data, admin_id="ADM-CRIM-1789132093")
    print("Alert dispatch result:", res)

if __name__ == "__main__":
    asyncio.run(test())
