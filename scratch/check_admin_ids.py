import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import asyncio
try:
    from backend.database import (
        db_attendance,
        db_criminal,
        db_anpr,
        db_missing,
        db_defence
    )
except ImportError:
    from database import (  # type: ignore
        db_attendance,
        db_criminal,
        db_anpr,
        db_missing,
        db_defence
    )

async def check_all_admin_ids():
    dbs = {
        "Attendence": db_attendance,
        "Criminal_traking": db_criminal,
        "ANPR_vehicle_system": db_anpr,
        "Missing_children": db_missing,
        "Defence_tactical_system": db_defence
    }

    print("--- CHECKING EXISTING ADMIN_ID VALUES IN MONGODB ATLAS ---")
    for db_name, db in dbs.items():
        if db is None:
            continue
        print(f"\nDatabase: {db_name}")
        for coll_name in ["registered_data", "officer_information", "camera_network", "alerts", "reports", "children_detection", "personnel"]:
            try:
                coll = db[coll_name]
                cursor = coll.find({})
                docs = await cursor.to_list(length=100)
                if docs:
                    admin_ids = set(str(d.get("admin_id")) for d in docs)
                    print(f"  - Collection '{coll_name}': {len(docs)} docs | admin_ids: {admin_ids}")
            except Exception as e:
                pass

if __name__ == "__main__":
    asyncio.run(check_all_admin_ids())
