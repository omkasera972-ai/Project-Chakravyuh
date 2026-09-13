import asyncio
import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
mongo_uri = os.getenv("MONGO_URI")

async def check():
    client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where())
    db = client["Criminal_traking"]
    collections = await db.list_collection_names()
    print("=== MONGODB ATLAS RECORD COUNTS ===")
    for coll in sorted(collections):
        count = await db[coll].count_documents({})
        print(f"{coll}: {count}")

asyncio.run(check())
