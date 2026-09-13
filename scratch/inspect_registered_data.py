import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://omkasera972_db_user:3mw7nBCC8OIfDWxp@cluster0.xy8twbt.mongodb.net/"

async def inspect():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['Attendence']
    async for doc in db['registered_data'].find():
        print("Doc:", doc)

asyncio.run(inspect())
