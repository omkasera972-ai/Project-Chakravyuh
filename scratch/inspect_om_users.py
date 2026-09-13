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

async def inspect_users():
    colls = {
        "Attendance": db_attendance["user_account.attendance"],
        "Criminal": db_criminal["user_account.criminal"],
        "ANPR": db_anpr["user_account.anpr"],
        "Missing": db_missing["user_account.missing_children"],
        "Defence": db_defence["user_account.defence"]
    }

    print("--- INSPECTING USER ACCOUNTS IN ALL 5 AUTH COLLECTIONS ---")
    for mod_name, coll in colls.items():
        if coll is None:
            continue
        print(f"\nModule: {mod_name}")
        cursor = coll.find({})
        docs = await cursor.to_list(length=50)
        for d in docs:
            print(f"  User: username={d.get('username')}, admin_id={d.get('admin_id')}, _id={d.get('_id')}")

if __name__ == "__main__":
    asyncio.run(inspect_users())
