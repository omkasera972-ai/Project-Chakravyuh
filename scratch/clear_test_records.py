import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

import os
MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://omkasera972_db_user:mongo_db_userom123@cluster0.xy8twbt.mongodb.net/"

async def clear_dummy_records():
    print("Connecting to MongoDB Atlas Attendence database...")
    client = AsyncIOMotorClient(MONGO_URI)
    db_attendence = client['Attendence']

    # Delete dummy student records from registered_data
    r1 = await db_attendence['registered_data'].delete_many({
        "$or": [
            {"id": "STU-E2E-999"},
            {"person_id": "STU-E2E-999"},
            {"code": "STU-E2E-999"},
            {"name": {"$regex": "Frontend E2E", "$options": "i"}},
            {"name": {"$regex": "Test Student Verification", "$options": "i"}},
            {"person_id": "TEST_STU_001"}
        ]
    })
    print(f"Deleted from registered_data: {r1.deleted_count} records")

    # Delete corresponding records from attendance_scan
    r2 = await db_attendence['attendance_scan'].delete_many({
        "$or": [
            {"person_id": "STU-E2E-999"},
            {"name": {"$regex": "Frontend E2E", "$options": "i"}},
            {"name": {"$regex": "Test Student Verification", "$options": "i"}},
            {"person_id": "TEST_STU_001"}
        ]
    })
    print(f"Deleted from attendance_scan: {r2.deleted_count} records")

    # Delete corresponding records from students_info_PA
    r3 = await db_attendence['students_info_PA'].delete_many({
        "$or": [
            {"person_id": "STU-E2E-999"},
            {"name": {"$regex": "Frontend E2E", "$options": "i"}},
            {"name": {"$regex": "Test Student Verification", "$options": "i"}},
            {"person_id": "TEST_STU_001"}
        ]
    })
    print(f"Deleted from students_info_PA: {r3.deleted_count} records")

    # Delete test alerts
    r4 = await db_attendence['alerts'].delete_many({
        "$or": [
            {"person_id": "STU-E2E-999"},
            {"person_id": "TEST_STU_001"},
            {"title": {"$regex": "Test", "$options": "i"}}
        ]
    })
    print(f"Deleted from alerts: {r4.deleted_count} records")

    # Delete test reports
    r5 = await db_attendence['reports'].delete_many({
        "title": {"$regex": "Test", "$options": "i"}
    })
    print(f"Deleted from reports: {r5.deleted_count} records")

    print("\n--- Remaining Records in Attendence.registered_data ---")
    async for doc in db_attendence['registered_data'].find():
        print(doc)

asyncio.run(clear_dummy_records())
