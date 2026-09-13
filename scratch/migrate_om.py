import asyncio
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend and project root directory are in sys.path for IDE linter & runtime
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.database import db_attendance, db_criminal, db_anpr, db_missing, db_defence
except ImportError:
    from database import db_attendance, db_criminal, db_anpr, db_missing, db_defence  # type: ignore # noqa: E402

async def run_migration():
    om_admin_id = "ADM-CRIM-1789132093"
    om_doc = await db_criminal["user_account.criminal"].find_one({"username": {"$regex": "^om$", "$options": "i"}})
    if not om_doc:
        print("CRITICAL: OM account not found in user_account.criminal!")
        return

    dbs = {
        "attendance": (db_attendance, "user_account.attendance"),
        "criminal": (db_criminal, "user_account.criminal"),
        "anpr": (db_anpr, "user_account.anpr"),
        "missing": (db_missing, "user_account.missing_children"),
        "defence": (db_defence, "user_account.defence")
    }

    # 1. Ensure OM account exists in all module auth collections with the exact same admin_id
    for mod, (db, coll_name) in dbs.items():
        existing = await db[coll_name].find_one({"username": {"$regex": "^om$", "$options": "i"}})
        if not existing:
            new_om = dict(om_doc)
            new_om.pop("_id", None)
            new_om["moduleId"] = mod
            new_om["admin_id"] = om_admin_id
            await db[coll_name].insert_one(new_om)
            print(f"Created OM account in {coll_name}")
        else:
            await db[coll_name].update_one({"username": {"$regex": "^om$", "$options": "i"}}, {"$set": {"admin_id": om_admin_id}})
            print(f"Updated OM account admin_id in {coll_name}")

    # 2. Tag all unassigned data documents with OM's admin_id across all collections
    for mod, (db, _) in dbs.items():
        colls = await db.list_collection_names()
        for c in colls:
            if not c.startswith("system.") and not c.startswith("user_account"):
                # Update documents without admin_id or with admin_id equal to None
                res = await db[c].update_many(
                    {"$or": [{"admin_id": None}, {"admin_id": {"$exists": False}}]},
                    {"$set": {"admin_id": om_admin_id}}
                )
                print(f"Updated {res.modified_count} docs in {mod}.{c} to admin_id {om_admin_id}")

if __name__ == "__main__":
    asyncio.run(run_migration())
