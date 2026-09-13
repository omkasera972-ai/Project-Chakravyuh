import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

import os
MONGO_URI = os.getenv("MONGO_URI")

async def inspect():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['Attendence']
    async for doc in db['registered_data'].find():
        print("Doc:", doc)

asyncio.run(inspect())
