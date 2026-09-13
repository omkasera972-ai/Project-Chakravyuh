import sys
import asyncio
from pathlib import Path

# Add workspace root to sys.path so backend module resolves both statically in IDE and at runtime
root_path = Path(__file__).resolve().parent.parent
backend_path = root_path / "backend"
for path_str in [str(root_path), str(backend_path)]:
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

from backend.utils.notifier import send_officer_welcome_email, send_criminal_alert

async def test_officer_mail():
    print("--- Testing Officer Welcome Email ---", flush=True)
    test_officer = {
        "officer_id": "OFFICER-TEST-99",
        "officer_name": "Inspector Vijay Sharma",
        "rank": "Senior Inspector",
        "police_station_name": "Central Cyber Police Station HQ",
        "stationLocation": "Indore Police HQ, MP",
        "officer_email": "omt48889@gmail.com"
    }
    res1 = await send_officer_welcome_email(test_officer)
    print("Welcome Email Result:", res1, flush=True)

    print("\n--- Testing Criminal Alert Broadcast ---", flush=True)
    test_criminal = {
        "id": "CRIM-TEST-001",
        "name": "Test Suspect Vikram",
        "crime_details": "Testing Automatic Email Dispatch",
        "risk_level": "Critical Threat",
        "age": "29",
        "ipc_charges": "IPC 302/395"
    }
    test_location = {
        "cam_id": "CAM-01 Test Node",
        "camera_location": "Main Gate Gateway",
        "lat": 22.7196,
        "lng": 75.8577
    }
    res2 = await send_criminal_alert(test_criminal, test_location)
    print("Criminal Alert Result:", res2, flush=True)

if __name__ == "__main__":
    asyncio.run(test_officer_mail())
