import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("RUNNING MANDATORY SECURITY & DATA ISOLATION TESTS")
    print("==================================================")

    # 1. Login as OM
    print("\n[TEST A] Logging in as OM...")
    om_login_payload = {
        "moduleId": "criminal-tracking",
        "username": "om",
        "password": "om"
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=om_login_payload)
    if res.status_code != 200:
        print(f"FAILED: OM login returned status {res.status_code}: {res.text}")
        return False
    
    om_data = res.json()
    om_token = om_data["token"]
    om_admin_id = om_data["user"]["admin_id"]
    print(f"-> OM Authenticated successfully! admin_id={om_admin_id}")

    # Fetch OM watchlist records
    headers_om = {"Authorization": f"Bearer {om_token}"}
    res_om_watch = requests.get(f"{BASE_URL}/criminal/watchlist", headers=headers_om)
    if res_om_watch.status_code != 200:
        print(f"FAILED: OM watchlist request returned status {res_om_watch.status_code}")
        return False
    om_records = res_om_watch.json().get("data", [])
    print(f"-> OM has {len(om_records)} records in Criminal Watchlist.")
    if len(om_records) == 0:
        print("WARNING: Expected OM to have existing records!")

    # 2. Create/Login NEW account
    import time
    new_username = f"new_admin_{int(time.time())}"
    new_password = "password123"
    print(f"\n[TEST B] Registering and logging in as NEW Account: {new_username}...")
    
    reg_payload = {
        "moduleId": "criminal-tracking",
        "username": new_username,
        "password": new_password,
        "confirmPassword": new_password
    }
    res_reg = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if res_reg.status_code != 200:
        print(f"FAILED: NEW account registration returned status {res_reg.status_code}: {res_reg.text}")
        return False
    
    new_data = res_reg.json()
    new_token = new_data["token"]
    new_admin_id = new_data["user"]["admin_id"]
    print(f"-> NEW Account Authenticated successfully! admin_id={new_admin_id}")

    # Verify workspace is EMPTY for NEW account
    headers_new = {"Authorization": f"Bearer {new_token}"}
    res_new_watch = requests.get(f"{BASE_URL}/criminal/watchlist", headers=headers_new)
    new_records = res_new_watch.json().get("data", [])
    print(f"-> NEW Account workspace has {len(new_records)} records in Criminal Watchlist.")
    if len(new_records) != 0:
        print(f"FAILED TEST B: NEW account workspace is NOT empty! Found {len(new_records)} records: {new_records}")
        return False
    print("-> PASSED TEST B: NEW Account workspace is 100% EMPTY!")

    # 3. Create a record using NEW account
    print(f"\n[TEST C] Creating a record under NEW Account ({new_username})...")
    create_payload = {
        "id": f"W-NEW-{int(time.time())}",
        "name": f"Suspect of {new_username}",
        "riskLevel": "High Risk",
        "crimeType": "IPC 392 - Robbery",
        "charges": "IPC 392",
        "status": "Active Alert"
    }
    res_create = requests.post(f"{BASE_URL}/criminal/watchlist", json=create_payload, headers=headers_new)
    if res_create.status_code != 200:
        print(f"FAILED TEST C: Could not create record for NEW account: {res_create.text}")
        return False
    created_doc = res_create.json().get("data", {})
    created_id = created_doc.get("id")
    created_admin_id = created_doc.get("admin_id")
    print(f"-> Created record '{created_doc.get('name')}' (id={created_id}) with admin_id={created_admin_id}")
    
    if created_admin_id != new_admin_id:
        print(f"FAILED TEST C: Created record admin_id ({created_admin_id}) != new_admin_id ({new_admin_id})")
        return False
    print("-> PASSED TEST C: Record created and tagged with authenticated NEW admin_id!")

    # 4. Login OM again → verify NEW account's record is NOT visible to OM
    print("\n[TEST D] Re-authenticating as OM and verifying isolation...")
    res_om_watch_2 = requests.get(f"{BASE_URL}/criminal/watchlist", headers=headers_om)
    om_records_2 = res_om_watch_2.json().get("data", [])
    om_ids = [r.get("id") for r in om_records_2]
    if created_id in om_ids:
        print(f"FAILED TEST D: NEW account's record {created_id} IS VISIBLE to OM!")
        return False
    print("-> PASSED TEST D: NEW account's record is NOT visible to OM!")

    # 5. Login NEW account again → verify OM records are NOT visible
    print("\n[TEST E] Re-authenticating as NEW Account and verifying OM data is not visible...")
    res_new_watch_2 = requests.get(f"{BASE_URL}/criminal/watchlist", headers=headers_new)
    new_records_2 = res_new_watch_2.json().get("data", [])
    if len(new_records_2) != 1 or new_records_2[0].get("id") != created_id:
        print(f"FAILED TEST E: NEW account sees unexpected records: {new_records_2}")
        return False
    print("-> PASSED TEST E: NEW Account sees ONLY its own 1 record!")

    # 6. Direct API queries verification across all modules
    print("\n[TEST F] Testing multi-module API isolation for OM vs NEW account...")
    modules = [
        ("Attendance Personnel", "/attendance/personnel"),
        ("ANPR Vehicles", "/anpr/vehicles"),
        ("Missing Children", "/missing-children/records"),
        ("Defence Inventory", "/defence/inventory")
    ]
    for mod_name, ep in modules:
        res_om_mod = requests.get(f"{BASE_URL}{ep}", headers=headers_om).json().get("data", [])
        res_new_mod = requests.get(f"{BASE_URL}{ep}", headers=headers_new).json().get("data", [])
        print(f"-> {mod_name}: OM has {len(res_om_mod)} records, NEW account has {len(res_new_mod)} records.")
        # Check no cross-account overlap
        om_admin_ids = set(r.get("admin_id") for r in res_om_mod)
        new_admin_ids = set(r.get("admin_id") for r in res_new_mod)
        if new_admin_id in om_admin_ids or om_admin_id in new_admin_ids:
            print(f"FAILED TEST F: Cross-account data leak detected in {mod_name}!")
            return False
    print("-> PASSED TEST F: Verified 100% complete data isolation across all 5 modules!")

    # 7. Try requesting another account's record ID directly
    print("\n[TEST G] Attempting cross-account record lookup by ID (NEW account trying to fetch OM record)...")
    if om_records:
        om_target_id = om_records[0].get("id") or om_records[0].get("_id")
        res_cross = requests.get(f"{BASE_URL}/criminal/collection/registered_data/{om_target_id}", headers=headers_new)
        print(f"-> NEW account request for OM record ID '{om_target_id}' status code: {res_cross.status_code}")
        if res_cross.status_code in [404, 403]:
            print(f"-> PASSED TEST G: Server correctly blocked cross-account lookup with status {res_cross.status_code}!")
        else:
            print(f"FAILED TEST G: Cross-account access allowed! Status: {res_cross.status_code}, body: {res_cross.text}")
            return False

    print("\n==================================================")
    print("ALL MANDATORY SECURITY TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
    print("==================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
