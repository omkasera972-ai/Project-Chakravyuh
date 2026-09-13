import re

def update_router_content(content: str) -> str:
    # 1. Update imports
    if "get_authenticated_admin_id" not in content:
        content = re.sub(
            r'from utils\.crud_helper import \(',
            'from utils.crud_helper import (\n    get_authenticated_admin_id,',
            content
        )
    if "Depends" not in content:
        content = content.replace("from fastapi import APIRouter, HTTPException, Body, status", "from fastapi import APIRouter, HTTPException, Body, status, Depends")

    # 2. Update generic collection routes
    content = content.replace(
        "async def get_any_collection_docs(collection_name: str):",
        "async def get_any_collection_docs(collection_name: str, admin_id: str = Depends(get_authenticated_admin_id)):"
    )
    content = content.replace(
        "return await generic_get_all(db_",
        "return await generic_get_all(db_"
    ) # handled via replacement of call signatures below

    # Update generic_* call sites to pass admin_id=admin_id
    # We can replace generic calls in route bodies:
    # generic_get_all(X) -> generic_get_all(X, admin_id=admin_id)
    # generic_get_one(X, Y) -> generic_get_one(X, Y, admin_id=admin_id)
    # generic_create(X, Y) -> generic_create(X, Y, admin_id=admin_id)
    # generic_update(X, Y, Z) -> generic_update(X, Y, Z, admin_id=admin_id)
    # generic_delete(X, Y) -> generic_delete(X, Y, admin_id=admin_id)

    lines = content.split('\n')
    new_lines = []
    in_route = False

    for line in lines:
        # If line defines async def endpoint (except get_*_module_status and health_check)
        if line.startswith("async def ") and not any(x in line for x in ["get_attendance_module_status", "attendance_health_check", "get_criminal_module_status", "criminal_health_check", "get_anpr_module_status", "anpr_health_check", "get_missing_module_status", "missing_health_check", "get_defence_module_status", "defence_health_check"]):
            if "admin_id: str = Depends(get_authenticated_admin_id)" not in line:
                if line.endswith("):"):
                    line = line[:-2] + ", admin_id: str = Depends(get_authenticated_admin_id)):"
                elif "():" in line:
                    line = line.replace("():", "(admin_id: str = Depends(get_authenticated_admin_id)):")
        
        # Replace generic helper calls inside endpoints
        if "generic_get_all(" in line and "admin_id=" not in line:
            line = re.sub(r'generic_get_all\(([^)]+)\)', r'generic_get_all(\1, admin_id=admin_id)', line)
        elif "generic_get_one(" in line and "admin_id=" not in line:
            line = re.sub(r'generic_get_one\(([^)]+)\)', r'generic_get_one(\1, admin_id=admin_id)', line)
        elif "generic_create(" in line and "admin_id=" not in line:
            line = re.sub(r'generic_create\(([^)]+)\)', r'generic_create(\1, admin_id=admin_id)', line)
        elif "generic_update(" in line and "admin_id=" not in line:
            line = re.sub(r'generic_update\(([^)]+)\)', r'generic_update(\1, admin_id=admin_id)', line)
        elif "generic_delete(" in line and "admin_id=" not in line:
            line = re.sub(r'generic_delete\(([^)]+)\)', r'generic_delete(\1, admin_id=admin_id)', line)

        new_lines.append(line)

    return '\n'.join(new_lines)

if __name__ == "__main__":
    import os
    routers_dir = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\backend\routers"
    files = ["attendance.py", "criminal_tracking.py", "anpr_system.py", "missing_children.py", "defence_tracker.py"]
    for f in files:
        path = os.path.join(routers_dir, f)
        with open(path, "r", encoding="utf-8") as file:
            c = file.read()
        updated = update_router_content(c)
        with open(path, "w", encoding="utf-8") as file:
            file.write(updated)
        print(f"Updated {f}")
