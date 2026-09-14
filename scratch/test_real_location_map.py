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
    from backend.database import db_criminal
    from backend.utils.notifier import send_criminal_alert, find_nearest_police_station
except Exception:
    from database import db_criminal  # type: ignore # noqa
    from utils.notifier import send_criminal_alert, find_nearest_police_station  # type: ignore # noqa

async def test_real_locations():
    print("==================================================")
    print("VERIFYING REAL CAMERA NETWORK & POLICE STATION DATA")
    print("==================================================")

    # 1. Fetch Cameras from DB
    cams = await db_criminal["camera_network"].find({}).to_list(length=10)
    print(f"Total Cameras in 'camera_network' collection: {len(cams)}")
    for i, c in enumerate(cams, 1):
        c_id = c.get("camera_id") or c.get("id") or c.get("cam_id")
        c_name = c.get("camera_name") or c.get("name") or c.get("location")
        c_lat = c.get("latitude") if c.get("latitude") is not None else c.get("lat")
        c_lng = c.get("longitude") if c.get("longitude") is not None else c.get("lng")
        print(f"  Camera #{i}: ID={c_id} | Name={c_name} | Lat={c_lat}, Lng={c_lng}")

    # 2. Fetch Police Stations & Officers from DB
    officers = await db_criminal["officer_information"].find({}).to_list(length=10)
    print(f"\nTotal Officers/Stations in 'officer_information' collection: {len(officers)}")
    for i, o in enumerate(officers, 1):
        st_name = o.get("police_station_name") or o.get("stationName")
        off_name = o.get("officer_name") or o.get("name")
        off_email = o.get("officer_email") or o.get("email")
        loc = o.get("police_station_location") or {}
        st_lat = loc.get("latitude") or o.get("latitude")
        st_lng = loc.get("longitude") or o.get("longitude")
        print(f"  Officer #{i}: Name={off_name} | Email={off_email} | Station={st_name} | Lat={st_lat}, Lng={st_lng}")

    # 3. Test nearest station lookup for first camera
    if cams:
        test_cam = cams[0]
        c_id = test_cam.get("camera_id") or test_cam.get("id") or test_cam.get("cam_id")
        c_lat = float(test_cam.get("latitude") or test_cam.get("lat") or 22.4632)
        c_lng = float(test_cam.get("longitude") or test_cam.get("lng") or 76.9381)

        print(f"\nFinding nearest police station for Camera '{c_id}' at coordinates ({c_lat}, {c_lng})...")
        nearest = await find_nearest_police_station(c_lat, c_lng)
        print("NEAREST STATION RESULT:")
        print("  Station Name:", nearest.get("police_station_name") if nearest else None)
        print("  Station Address:", nearest.get("police_station_address") if nearest else None)
        print("  Station Lat, Lng:", nearest.get("station_lat"), nearest.get("station_lng") if nearest else None)
        print("  Distance:", nearest.get("distance_km"), "km" if nearest else None)
        print("  Dispatched Officers:", [o.get("officer_name") for o in nearest.get("officers", [])] if nearest else None)

if __name__ == "__main__":
    asyncio.run(test_real_locations())
