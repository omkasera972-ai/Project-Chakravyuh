import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL")

async def inspect():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["Criminal_traking"]
    
    print("--- CAMERA NETWORK ---")
    cams = await db["camera_network"].find({}).to_list(length=100)
    for c in cams:
        print(f"ID: {c.get('camera_id') or c.get('id')}, Name: {c.get('camera_name') or c.get('name')}, Location: {c.get('location')}, Lat: {c.get('latitude') or c.get('lat')}, Lng: {c.get('longitude') or c.get('lng')}, Admin: {c.get('admin_id')}")
        
    print("\n--- OFFICER INFORMATION ---")
    offs = await db["officer_information"].find({}).to_list(length=100)
    for o in offs:
        print(f"Station: {o.get('police_station_name') or o.get('stationName')}, Email: {o.get('officer_email') or o.get('email')}, Rank: {o.get('rank')}, Admin: {o.get('admin_id')}")

if __name__ == "__main__":
    asyncio.run(inspect())
