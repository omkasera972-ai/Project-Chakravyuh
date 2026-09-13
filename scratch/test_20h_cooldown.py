import asyncio
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

import os
MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://omkasera972_db_user:mongo_db_userom123@cluster0.xy8twbt.mongodb.net/"
BASE_URL = "http://127.0.0.1:8000/api/attendance"

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

async def test_20h_cooldown_engine():
    print("==================================================")
    print("PROJECT CHAKRAVYUH — 20-HOUR COOLDOWN TEST SUITE")
    print("==================================================")

    client = AsyncIOMotorClient(MONGO_URI)
    db = client['Attendence']

    student_a_id = "STU-20H-A"
    student_b_id = "STU-20H-B"

    # 1. Clean previous test records
    await db['registered_data'].delete_many({"id": {"$in": [student_a_id, student_b_id]}})
    await db['attendance_scan'].delete_many({"$or": [{"person_id": {"$in": [student_a_id, student_b_id]}}, {"personId": {"$in": [student_a_id, student_b_id]}}, {"id": {"$in": [student_a_id, student_b_id]}}]})
    await db['students_info_PA'].delete_many({"id": {"$in": [student_a_id, student_b_id]}})

    # Register test students
    await db['registered_data'].insert_one({
        "id": student_a_id,
        "name": "Student A Cooldown Test",
        "role": "Student",
        "department": "Computer Science",
        "status": "Registered"
    })
    await db['registered_data'].insert_one({
        "id": student_b_id,
        "name": "Student B Cooldown Test",
        "role": "Student",
        "department": "Electrical Engineering",
        "status": "Registered"
    })

    # TEST 1: First scan for Student A -> MUST BE ACCEPTED
    print("\n--- TEST 1: First Scan Student A ---")
    json1 = post_json(f"{BASE_URL}/mark", {
        "id": student_a_id,
        "name": "Student A Cooldown Test",
        "status": "Present"
    })
    print("Response 1:", json1)
    assert json1.get("success") == True, f"Expected success=True, got {json1}"
    assert json1.get("status") == "accepted", f"Expected status='accepted', got {json1}"

    # Verify MongoDB Atlas attendance_scan count = 1
    scan_count_a = await db['attendance_scan'].count_documents({"$or": [{"person_id": student_a_id}, {"personId": student_a_id}]})
    print(f"Student A attendance_scan count in MongoDB: {scan_count_a}")
    assert scan_count_a == 1, f"Expected 1 scan document, got {scan_count_a}"

    # TEST 2: Immediate duplicate scan for Student A -> MUST BE REJECTED (COOLDOWN)
    print("\n--- TEST 2: Immediate Duplicate Scan Student A ---")
    json2 = post_json(f"{BASE_URL}/mark", {
        "id": student_a_id,
        "name": "Student A Cooldown Test",
        "status": "Present"
    })
    print("Response 2:", json2)
    assert json2.get("success") == False, f"Expected success=False, got {json2}"
    assert json2.get("status") == "cooldown", f"Expected status='cooldown', got {json2}"
    assert "next_allowed_at" in json2, "Expected next_allowed_at in response"

    next_allowed_at_first_reject = json2.get("next_allowed_at")

    # Verify MongoDB Atlas attendance_scan count DID NOT INCREASE
    scan_count_a_after = await db['attendance_scan'].count_documents({"$or": [{"person_id": student_a_id}, {"personId": student_a_id}]})
    print(f"Student A attendance_scan count after rejected attempt: {scan_count_a_after}")
    assert scan_count_a_after == 1, f"Expected scan count to remain 1, got {scan_count_a_after}"

    # TEST 3: Third scan attempt for Student A -> MUST BE REJECTED & TIMER NOT RESET
    print("\n--- TEST 3: Third Attempt Student A (Verify timer not reset) ---")
    json3 = post_json(f"{BASE_URL}/mark", {
        "id": student_a_id,
        "name": "Student A Cooldown Test",
        "status": "Present"
    })
    print("Response 3:", json3)
    assert json3.get("status") == "cooldown"
    assert json3.get("next_allowed_at") == next_allowed_at_first_reject, "Timer was reset by rejected attempt!"
    print("Confirmed: Timer was NOT reset by rejected attempt!")

    # TEST 4: Student B Scan -> MUST BE ACCEPTED (Cooldown is PER PERSON)
    print("\n--- TEST 4: Student B Scan (Per-person cooldown check) ---")
    json4 = post_json(f"{BASE_URL}/mark", {
        "id": student_b_id,
        "name": "Student B Cooldown Test",
        "status": "Present"
    })
    print("Response 4:", json4)
    assert json4.get("success") == True, f"Expected Student B accepted, got {json4}"
    assert json4.get("status") == "accepted"
    print("Confirmed: Student B scan accepted while Student A is in cooldown!")

    # TEST 5: Simulate older scan for Student A (>20 hours ago)
    print("\n--- TEST 5: Simulate Scan > 20 Hours Ago for Student A ---")
    now_ts = datetime.now(timezone.utc).timestamp()
    old_ts = now_ts - (21 * 3600)  # 21 hours ago

    await db['attendance_scan'].update_many(
        {"$or": [{"person_id": student_a_id}, {"personId": student_a_id}]},
        {"$set": {"timestamp_num": old_ts}}
    )

    # Now scan Student A again -> MUST BE ACCEPTED!
    print("\n--- TEST 6: Student A Scan After 21 Hours -> MUST BE ACCEPTED ---")
    json6 = post_json(f"{BASE_URL}/mark", {
        "id": student_a_id,
        "name": "Student A Cooldown Test",
        "status": "Present"
    })
    print("Response 6:", json6)
    assert json6.get("success") == True, f"Expected scan accepted after 21 hours, got {json6}"
    assert json6.get("status") == "accepted"

    # Verify MongoDB Atlas attendance_scan count for Student A is now 2!
    final_scan_count_a = await db['attendance_scan'].count_documents({"$or": [{"person_id": student_a_id}, {"personId": student_a_id}]})
    print(f"Student A final attendance_scan count in MongoDB: {final_scan_count_a}")
    assert final_scan_count_a == 2, f"Expected 2 accepted scan documents, got {final_scan_count_a}"

    # Cleanup test records
    await db['registered_data'].delete_many({"id": {"$in": [student_a_id, student_b_id]}})
    await db['attendance_scan'].delete_many({"$or": [{"person_id": {"$in": [student_a_id, student_b_id]}}, {"personId": {"$in": [student_a_id, student_b_id]}}, {"id": {"$in": [student_a_id, student_b_id]}}]})
    await db['students_info_PA'].delete_many({"id": {"$in": [student_a_id, student_b_id]}})

    print("\n==================================================")
    print("ALL 20-HOUR COOLDOWN TESTS PASSED SUCCESSFULLY! [SUCCESS]")
    print("==================================================")

asyncio.run(test_20h_cooldown_engine())
