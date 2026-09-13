import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://omkasera972_db_user:3mw7nBCC8OIfDWxp@cluster0.xy8twbt.mongodb.net/"

async def clear_all_attendance_test_data():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['Attendence']
    
    c1 = await db['registered_data'].delete_many({})
    c2 = await db['attendance_scan'].delete_many({})
    c3 = await db['students_info_PA'].delete_many({})
    c4 = await db['alerts'].delete_many({})
    
    print(f"Cleared Attendence -> registered_data: {c1.deleted_count}")
    print(f"Cleared Attendence -> attendance_scan: {c2.deleted_count}")
    print(f"Cleared Attendence -> students_info_PA: {c3.deleted_count}")
    print(f"Cleared Attendence -> alerts: {c4.deleted_count}")

asyncio.run(clear_all_attendance_test_data())
