import os
import re

app_context_path = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\src\context\AppContext.jsx"

with open(app_context_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Define authFetch and clearAllAccountState near top of AppProvider
auth_fetch_def = """  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('sda_token');
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      console.warn('[authFetch] 401 Unauthorized encountered, purging stale session token');
      localStorage.removeItem('sda_token');
      localStorage.removeItem('sda_user');
      localStorage.removeItem('sda_auth');
    }
    return res;
  };

  const clearAllAccountState = () => {
    setPersonnel([]);
    setWatchlist([]);
    setVehicles([]);
    setMissingChildren([]);
    setDepotInventory([]);
    setOfficers([]);
    setCameras([]);
    setAlerts([]);
    setReports([]);
    setAttendanceLogs([]);
    setHistoryLogs([]);
    if (deletedPersonnelIdsRef.current) {
      deletedPersonnelIdsRef.current.clear();
    }
  };
"""

# Insert authFetch and clearAllAccountState after isFetchingOfficersRef declaration if not present
if "const authFetch =" not in content:
    content = content.replace("const isFetchingOfficersRef = React.useRef(false);", "const isFetchingOfficersRef = React.useRef(false);\n" + auth_fetch_def)

# 2. Replace all fetch( in AppContext with authFetch( (except inside authFetch definition itself)
# We can temporarily hide authFetch definition or replace fetch( in lines that don't define authFetch.
lines = content.split('\n')
new_lines = []

for line in lines:
    if "const res = await fetch(" in line:
        line = line.replace("const res = await fetch(", "const res = await authFetch(")
    elif "await fetch(" in line and "const authFetch =" not in line:
        line = line.replace("await fetch(", "await authFetch(")
    elif "fetch(" in line and "const authFetch =" not in line and "const res = await fetch" not in line and "headers: reqHeaders" not in line:
        # For simple fetch(...) calls like fetch('...').then(...)
        line = line.replace("fetch(", "authFetch(")

    new_lines.append(line)

content = '\n'.join(new_lines)

# 3. Update logout and loginModule to invoke clearAllAccountState()
if "clearAllAccountState();" not in content:
    content = content.replace(
        "const loginModule = (moduleId, userData) => {",
        "const loginModule = (moduleId, userData) => {\n    clearAllAccountState();"
    )
    content = content.replace(
        "const logout = () => {",
        "const logout = () => {\n    clearAllAccountState();"
    )

with open(app_context_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated AppContext.jsx with authFetch and clearAllAccountState!")
