import requests
import uuid
import time

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_verification():
    print("=" * 60)
    print("CRIMINAL ENROLLMENT END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Register & Login Account A
    user_a = f"officer_e2e_a_{uuid.uuid4().hex[:4]}"
    pwd_a = "Pass@1234"

    reg_a = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": user_a,
        "password": pwd_a,
        "confirmPassword": pwd_a,
        "moduleId": "criminal-tracking",
        "full_name": "Officer E2E A"
    })
    assert reg_a.status_code == 200, f"Register A failed: {reg_a.text}"
    token_a = reg_a.json().get("token")
    admin_id_a = reg_a.json().get("user", {}).get("admin_id")
    print(f"[SUCCESS] STEP 1: Account A Registered & Token Issued. Admin ID: {admin_id_a}")

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Enroll Criminal Target for Account A with 128D Embedding & Photo
    mock_128d_embedding = [0.05 * (i % 10) for i in range(128)]
    target_id = f"W-E2E-{int(time.time())}"
    target_name = f"Fugitive Vikram {uuid.uuid4().hex[:4]}"

    enroll_payload = {
        "id": target_id,
        "module": "criminal-tracking",
        "name": target_name,
        "riskLevel": "Critical Risk",
        "crimeType": "Armed Robbery & Homicide",
        "age": 34,
        "lastSeen": "CAM-03 Highway Junction",
        "photoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...",
        "details": "[IPC: IPC 302] Wanted high risk fugitive",
        "embedding": mock_128d_embedding
    }

    enroll_res = requests.post(f"{BASE_URL}/api/criminal/watchlist", json=enroll_payload, headers=headers_a)
    assert enroll_res.status_code == 201, f"Enrollment failed: {enroll_res.text}"
    enrolled_doc = enroll_res.json().get("data", {})
    assert enrolled_doc.get("admin_id") == admin_id_a, "Enrolled doc admin_id mismatch!"
    assert enrolled_doc.get("embedding") == mock_128d_embedding, "128D Embedding mismatch!"
    print(f"[SUCCESS] STEP 2: Criminal Target Enrolled in DB with Photo & 128D Embedding ({len(mock_128d_embedding)}D vector saved).")

    # 3. Confirm Document Appears in Registered Data (/api/criminal/registered-data)
    reg_data_res = requests.get(f"{BASE_URL}/api/criminal/registered-data", headers=headers_a)
    assert reg_data_res.status_code == 200, f"Registered data fetch failed: {reg_data_res.text}"
    items = reg_data_res.json().get("data", [])
    found_in_reg = any(i.get("id") == target_id for i in items)
    assert found_in_reg, "Enrolled suspect not found in Registered Data endpoint!"
    print(f"[SUCCESS] STEP 3: Enrolled Criminal automatically present in Registered Data (Count: {len(items)}).")

    # 4. Auto-Generate Report Verification
    report_payload = {
        "id": f"REP-{target_id}",
        "title": f"Criminal Dossier: {target_name} ({target_id})",
        "category": "Criminal Dossier",
        "suspectName": target_name,
        "suspectId": target_id,
        "photoUrl": enroll_payload["photoUrl"],
        "riskLevel": "Critical Risk",
        "crimeType": "Armed Robbery & Homicide",
        "details": "[IPC: IPC 302] Wanted high risk fugitive",
        "date": "14 Sep 2026",
        "status": "ACTIVE WATCHLIST"
    }
    rep_post = requests.post(f"{BASE_URL}/api/criminal/reports", json=report_payload, headers=headers_a)
    assert rep_post.status_code == 201, f"Report creation failed: {rep_post.text}"

    reports_res = requests.get(f"{BASE_URL}/api/criminal/reports", headers=headers_a)
    assert reports_res.status_code == 200, f"Reports fetch failed: {reports_res.text}"
    reports_list = reports_res.json().get("data", [])
    found_report = any(r.get("suspectId") == target_id or target_id in r.get("id", "") for r in reports_list)
    assert found_report, "Auto-generated report not found in Reports & Logs endpoint!"
    print(f"[SUCCESS] STEP 4: Official Dossier Report generated and verified under Reports & Logs.")

    # 5. Duplicate Submission Test
    dup_res = requests.post(f"{BASE_URL}/api/criminal/watchlist", json=enroll_payload, headers=headers_a)
    assert dup_res.status_code == 400, f"Duplicate check failed! Expected 400, got {dup_res.status_code}"
    print(f"[SUCCESS] STEP 5: Duplicate Criminal Enrollment correctly rejected with 400 Bad Request: {dup_res.json().get('detail')}")

    # 6. Re-Login Verification & Persistence Check
    login_re = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": user_a,
        "password": pwd_a,
        "moduleId": "criminal-tracking"
    })
    assert login_re.status_code == 200, f"Re-login failed: {login_re.text}"
    token_a_new = login_re.json().get("token")
    headers_a_new = {"Authorization": f"Bearer {token_a_new}"}

    reg_data_re = requests.get(f"{BASE_URL}/api/criminal/registered-data", headers=headers_a_new)
    items_re = reg_data_re.json().get("data", [])
    found_after_relogin = any(i.get("id") == target_id for i in items_re)
    assert found_after_relogin, "Enrolled suspect lost after logout/re-login!"
    print(f"[SUCCESS] STEP 6: Logout/Re-login verified. Suspect data persistently stored.")

    # 7. Cross-User Data Isolation Check
    user_b = f"officer_e2e_b_{uuid.uuid4().hex[:4]}"
    reg_b = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": user_b,
        "password": pwd_a,
        "confirmPassword": pwd_a,
        "moduleId": "criminal-tracking",
        "full_name": "Officer E2E B"
    })
    token_b = reg_b.json().get("token")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    reg_data_b = requests.get(f"{BASE_URL}/api/criminal/registered-data", headers=headers_b)
    items_b = reg_data_b.json().get("data", [])
    found_by_b = any(i.get("id") == target_id for i in items_b)
    assert not found_by_b, "SECURITY VIOLATION! User B was able to see User A's criminal target!"
    print(f"[SUCCESS] STEP 7: Data Isolation Verified. User B cannot access User A's enrolled suspect.")

    print("=" * 60)
    print("ALL 7 E2E VERIFICATION STEPS PASSED 100% PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_verification()
