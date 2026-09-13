import asyncio
import sys
import os

# Ensure backend directory is in python path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_dir)

try:
    from backend.database import (  # type: ignore # pyright: ignore
        db_attendance,
        db_criminal,
        db_anpr,
        db_missing,
        db_defence,
        verify_db_connection
    )
except ImportError:
    from database import (  # type: ignore # pyright: ignore
        db_attendance,
        db_criminal,
        db_anpr,
        db_missing,
        db_defence,
        verify_db_connection
    )

REQUIRED_STRUCTURE = {
    "Attendence": {
        "db": db_attendance,
        "collections": [
            "alerts",
            "attendance_scan",
            "camera_network",
            "map",
            "registered_data",
            "students_info_PA",
            "reports",
            "system_settings",
            "user_account.attendance"
        ]
    },
    "Criminal_traking": {
        "db": db_criminal,
        "collections": [
            "alerts",
            "camera_network",
            "criminal_detections",
            "locations_map",
            "officer_information",
            "registered_data",
            "reports",
            "system_settings",
            "user_account.criminal"
        ]
    },
    "ANPR_vehicle_system": {
        "db": db_anpr,
        "collections": [
            "alerts",
            "anpr_scan",
            "camera_network",
            "map",
            "registered_data",
            "reports",
            "system_setting",
            "user_account.anpr"
        ]
    },
    "Missing_children": {
        "db": db_missing,
        "collections": [
            "add_data",
            "alerts",
            "camera_network",
            "children_detection",
            "map",
            "registered_data",
            "reports",
            "system_setting",
            "user_account.missing_children"
        ]
    },
    "Defence_tactical_system": {
        "db": db_defence,
        "collections": [
            "add_data",
            "alerts",
            "camera_network",
            "defence_scan",
            "map",
            "registered_data",
            "reports",
            "system_setting",
            "user_account.defence"
        ]
    }
}

async def run_tests():
    print("Verifying MongoDB Atlas Database Connection...", flush=True)
    connected, msg = await verify_db_connection()
    print(f"Connection Status: {connected} ({msg})\n", flush=True)

    test_admin_id = "test_admin_verifier_2026"
    total_passed = 0
    total_failed = 0

    for db_name, config in REQUIRED_STRUCTURE.items():
        db = config["db"]
        collections = config["collections"]
        print(f"=== Testing Database: {db_name} ===", flush=True)

        for coll_name in collections:
            try:
                coll = db[coll_name]

                # 1. POST (Insert)
                doc = {
                    "test_key": f"test_val_{coll_name}",
                    "admin_id": test_admin_id,
                    "timestamp": "2026-09-13T17:00:00Z"
                }
                res = await coll.insert_one(doc)
                if isinstance(res, dict) and "_id" in res:
                    doc_id = str(res["_id"])
                elif hasattr(res, "inserted_id"):
                    doc_id = str(res.inserted_id)
                else:
                    doc_id = str(res)

                # 2. GET (Read One)
                found = await coll.find_one({"admin_id": test_admin_id, "test_key": f"test_val_{coll_name}"})
                if not found:
                    print(f"  [FAIL] [{coll_name}] GET failed - document not found", flush=True)
                    total_failed += 1
                    continue

                # 3. PUT (Update)
                await coll.update_one(
                    {"admin_id": test_admin_id, "test_key": f"test_val_{coll_name}"},
                    {"$set": {"test_key": f"updated_val_{coll_name}"}}
                )
                updated = await coll.find_one({"admin_id": test_admin_id, "test_key": f"updated_val_{coll_name}"})
                if not updated:
                    print(f"  [FAIL] [{coll_name}] PUT failed - update not reflected", flush=True)
                    total_failed += 1
                    continue

                # 4. DELETE (Clean up)
                await coll.delete_many({"admin_id": test_admin_id})
                deleted = await coll.find_one({"admin_id": test_admin_id})
                if deleted:
                    print(f"  [FAIL] [{coll_name}] DELETE failed - document still exists", flush=True)
                    total_failed += 1
                    continue

                print(f"  [PASS] [{coll_name}] GET/POST/PUT/DELETE Passed successfully!", flush=True)
                total_passed += 1

            except Exception as e:
                print(f"  [FAIL] [{coll_name}] Error: {e}", flush=True)
                total_failed += 1

        print("", flush=True)

    print(f"SUMMARY: {total_passed} Passed, {total_failed} Failed out of {total_passed + total_failed} collections tested.", flush=True)

if __name__ == "__main__":
    asyncio.run(run_tests())
