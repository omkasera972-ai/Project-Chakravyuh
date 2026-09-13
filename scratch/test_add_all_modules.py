import asyncio
import sys
import os
import json

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from database import db_attendance, db_criminal, db_anpr, db_missing, db_defence, verify_db_connection  # type: ignore
from utils.crud_helper import generic_create, generic_get_all  # type: ignore

async def test_add():
    print("Verifying MongoDB Connection...")
    connected, msg = await verify_db_connection()
    print(f"Connected: {connected}, Message: {msg}")

    test_admin_id = "ADM-ATTENDANCE-khal-123456"

    # 1. Test Attendance
    res_att = await generic_create(db_attendance["registered_data"], {"id": "TEST-ATT-001", "name": "Test Student"}, admin_id=test_admin_id)
    print("Attendance Add Result:", res_att)

    # 2. Test Criminal Watchlist
    res_crim = await generic_create(db_criminal["registered_data"], {"id": "TEST-W-001", "name": "Test Criminal"}, admin_id=test_admin_id)
    print("Criminal Add Result:", res_crim)

    # 3. Test ANPR Vehicles
    res_anpr = await generic_create(db_anpr["registered_data"], {"id": "TEST-VEH-001", "plate": "MH12AB1234"}, admin_id=test_admin_id)
    print("ANPR Add Result:", res_anpr)

    # 4. Test Missing Children
    res_miss = await generic_create(db_missing["registered_data"], {"id": "TEST-MC-001", "name": "Test Child"}, admin_id=test_admin_id)
    print("Missing Child Add Result:", res_miss)

    # 5. Test Defence Inventory
    res_def = await generic_create(db_defence["registered_data"], {"id": "TEST-DEF-001", "name": "Test Rifle"}, admin_id=test_admin_id)
    print("Defence Add Result:", res_def)

if __name__ == "__main__":
    asyncio.run(test_add())
