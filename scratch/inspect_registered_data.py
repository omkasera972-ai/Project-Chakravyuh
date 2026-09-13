import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

import os
MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://omkasera972_db_user:mongo_db_userom123@cluster0.xy8twbt.mongodb.net/"

async def inspect():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['Attendence']
    async for doc in db['registered_data'].find():
        print("Doc:", doc)

asyncio.run(inspect())
