import os

routers_dir = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\backend\routers"
files = ["attendance.py", "criminal_tracking.py", "anpr_system.py", "missing_children.py", "defence_tracker.py", "modules.py"]

for f in files:
    path = os.path.join(routers_dir, f)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()
        
        # Fix invalid syntax "(,"
        fixed = content.replace("(, admin_id:", "(admin_id:")
        fixed = fixed.replace("( , admin_id:", "(admin_id:")

        with open(path, "w", encoding="utf-8") as file:
            file.write(fixed)
        print(f"Fixed syntax in {f}")
