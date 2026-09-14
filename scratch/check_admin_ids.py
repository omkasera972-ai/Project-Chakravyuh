import asyncio
import os
import sys

# Ensure project root directory is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from dotenv import load_dotenv

env_path = os.path.join(root_dir, 'backend', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from backend.database import db_criminal

async def check_admins():
    print("=== OFFICERS IN MONGODB ATLAS ===")
    officers = await db_criminal["officer_information"].find({}).to_list(length=100)
    for off in officers:
        print(f"Name: {off.get('officer_name') or off.get('name')} | Email: {off.get('officer_email') or off.get('email')} | Station: {off.get('police_station_name')} | admin_id: {off.get('admin_id')}")

    print("\n=== CAMERAS IN MONGODB ATLAS ===")
    cameras = await db_criminal["camera_network"].find({}).to_list(length=100)
    for cam in cameras:
        print(f"Cam ID: {cam.get('camera_id') or cam.get('id')} | Name: {cam.get('camera_name') or cam.get('name')} | admin_id: {cam.get('admin_id')}")

if __name__ == "__main__":
    asyncio.run(check_admins())
