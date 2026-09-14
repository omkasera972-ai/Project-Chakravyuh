import asyncio
import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://127.0.0.1:8000"

def post_json(path, data, token=None):
    url = f"{BASE_URL}{path}"
    raw = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=raw, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def get_json(path, token=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def run_tests():
    print("=================================================================")
    print("[TEST SUITE] RUNNING COMPREHENSIVE DATA ISOLATION & AUTHENTICATION TESTS")
    print("=================================================================")

    # 1. VERIFY REMOVAL OF ACCOUNT SUGGESTION ENDPOINT
    print("\n--- TEST 1: Check Removal of /api/auth/suggested-accounts ---")
    status, res = get_json("/api/auth/suggested-accounts/criminal-tracking")
    print(f"Status: {status}")
    assert status == 404, f"Expected 404 for removed endpoint, got {status}"
    print("[PASS] Suggested Accounts endpoint is completely removed (404 Not Found).")

    # 2. VERIFY REJECTION OF NONEXISTENT USER & WRONG PASSWORD
    print("\n--- TEST 2: Verify Login Rejection for Invalid Credentials ---")
    status, res = post_json("/api/auth/login", {"moduleId": "criminal-tracking", "username": "nonexistent_user_999", "password": "any_password"})
    print(f"Nonexistent user login status: {status} ({res.get('detail')})")
    assert status == 401, f"Expected 401, got {status}"

    import time
    ts = int(time.time())
    user_a_name = f"user_alpha_{ts}"
    user_b_name = f"user_beta_{ts}"
    pwd_a = "alpha_pass_123"
    pwd_b = "beta_pass_456"

    # 3. REGISTER ACCOUNT A
    print(f"\n--- TEST 3: Register New Account A ({user_a_name}) ---")
    status, res_reg_a = post_json("/api/auth/register", {"moduleId": "criminal-tracking", "username": user_a_name, "password": pwd_a})
    assert status == 200 and res_reg_a.get("status") == "success", f"Account A registration failed: {res_reg_a}"
    token_a = res_reg_a["token"]
    admin_id_a = res_reg_a["user"]["admin_id"]
    print(f"[PASS] Account A Registered! admin_id: {admin_id_a}")

    # 4. REGISTER ACCOUNT B
    print(f"\n--- TEST 4: Register New Account B ({user_b_name}) ---")
    status, res_reg_b = post_json("/api/auth/register", {"moduleId": "criminal-tracking", "username": user_b_name, "password": pwd_b})
    assert status == 200 and res_reg_b.get("status") == "success", f"Account B registration failed: {res_reg_b}"
    token_b = res_reg_b["token"]
    admin_id_b = res_reg_b["user"]["admin_id"]
    print(f"[PASS] Account B Registered! admin_id: {admin_id_b}")

    # 5. VERIFY WRONG PASSWORD FOR EXISTING ACCOUNT A
    print(f"\n--- TEST 5: Verify Wrong Password Rejection for Account A ---")
    status, res_wrong = post_json("/api/auth/login", {"moduleId": "criminal-tracking", "username": user_a_name, "password": "WRONG_PASSWORD"})
    assert status == 401, f"Expected 401 for wrong password, got {status}"
    print("[PASS] Wrong password correctly rejected with 401 Unauthorized.")

    # 6. VERIFY RE-LOGIN WITH CORRECT USERNAME & PASSWORD
    print(f"\n--- TEST 6: Verify Re-Login with Correct Credentials for Account A ---")
    status, res_login_a = post_json("/api/auth/login", {"moduleId": "criminal-tracking", "username": user_a_name, "password": pwd_a})
    assert status == 200 and res_login_a.get("token"), f"Re-login failed: {res_login_a}"
    rel_token_a = res_login_a["token"]
    assert res_login_a["user"]["admin_id"] == admin_id_a
    print("[PASS] Account A successfully logged back in with correct password.")

    # 7. CREATE PRIVATE DATA UNDER ACCOUNT A
    print(f"\n--- TEST 7: Create Private Data Under Account A ---")
    item_a_data = {
        "id": f"W-A-{ts}",
        "name": f"Private Suspect of Account A ({user_a_name})",
        "riskLevel": "Critical Risk",
        "crimeType": "Private Investigation Record A"
    }
    status, res_create_a = post_json("/api/criminal/registered-data", item_a_data, token=token_a)
    assert status == 201 or status == 200, f"Failed to create data under A: {res_create_a}"
    print(f"[PASS] Created private suspect record for Account A: {res_create_a['data']['name']}")

    # 8. CREATE PRIVATE DATA UNDER ACCOUNT B
    print(f"\n--- TEST 8: Create Private Data Under Account B ---")
    item_b_data = {
        "id": f"W-B-{ts}",
        "name": f"Private Suspect of Account B ({user_b_name})",
        "riskLevel": "High Risk",
        "crimeType": "Private Investigation Record B"
    }
    status, res_create_b = post_json("/api/criminal/registered-data", item_b_data, token=token_b)
    assert status == 201 or status == 200, f"Failed to create data under B: {res_create_b}"
    print(f"[PASS] Created private suspect record for Account B: {res_create_b['data']['name']}")

    # 9. VERIFY STRICT DATA ISOLATION (READ ISOLATION)
    print(f"\n--- TEST 9: Verify Strict User Data Isolation (Account A vs Account B) ---")
    status, res_fetch_a = get_json("/api/criminal/registered-data", token=token_a)
    docs_a = res_fetch_a.get("data", [])
    names_a = [d.get("name") for d in docs_a]
    print(f"Account A Visible Records Count: {len(docs_a)}")

    status, res_fetch_b = get_json("/api/criminal/registered-data", token=token_b)
    docs_b = res_fetch_b.get("data", [])
    names_b = [d.get("name") for d in docs_b]
    print(f"Account B Visible Records Count: {len(docs_b)}")

    # Check Account A ONLY sees Account A's record and NOT Account B's record
    assert item_a_data["name"] in names_a, "Account A record missing from A's fetch"
    assert item_b_data["name"] not in names_a, "SECURITY BREACH: Account B's record visible to Account A!"

    # Check Account B ONLY sees Account B's record and NOT Account A's record
    assert item_b_data["name"] in names_b, "Account B record missing from B's fetch"
    assert item_a_data["name"] not in names_b, "SECURITY BREACH: Account A's record visible to Account B!"

    print("[PASS] 100% User Data Isolation Confirmed! Account A cannot see Account B's data and vice-versa.")

    # 10. VERIFY MANIPULATION PREVENTION (OVERRIDE ATTEMPT)
    print(f"\n--- TEST 10: Verify Frontend Manipulation Prevention ---")
    manipulated_payload = {
        "id": f"W-MANIP-{ts}",
        "name": "Tampered Payload Record",
        "admin_id": admin_id_b  # Attempting to forge Account B's admin_id using Account A's token
    }
    status, res_manip = post_json("/api/criminal/registered-data", manipulated_payload, token=token_a)
    # The server MUST force admin_id = admin_id_a from token
    created_admin_id = res_manip["data"]["admin_id"]
    assert created_admin_id == admin_id_a, f"SECURITY BREACH: Server accepted forged admin_id! Got {created_admin_id}"
    assert created_admin_id != admin_id_b, "SECURITY BREACH: Payload was forged into Account B's scope!"
    print("[PASS] Server ignored forged payload admin_id and correctly enforced authenticated Token identity.")

    print("\n=================================================================")
    print("[SUCCESS] ALL 10 AUTHENTICATION & DATA ISOLATION TESTS PASSED 100%")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
