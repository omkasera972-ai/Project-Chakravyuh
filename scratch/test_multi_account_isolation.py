import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING COMPREHENSIVE MULTI-ACCOUNT ISOLATION TEST ===")
    
    timestamp = int(time.time())
    user_a = f"test_admin_a_{timestamp}"
    pass_a = "SecretPass123!"
    
    user_b = f"test_admin_b_{timestamp}"
    pass_b = "SecretPass456!"

    # 1. Register ACCOUNT_A
    res_a = requests.post(f"{BASE_URL}/api/auth/register", json={
        "moduleId": "criminal-tracking",
        "username": user_a,
        "password": pass_a
    })
    assert res_a.status_code == 200, f"Account A registration failed: {res_a.text}"
    token_a = res_a.json()["token"]
    admin_id_a = res_a.json()["user"]["admin_id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"[OK] Account A created: username={user_a}, admin_id={admin_id_a}")

    # 2. Register ACCOUNT_B
    res_b = requests.post(f"{BASE_URL}/api/auth/register", json={
        "moduleId": "criminal-tracking",
        "username": user_b,
        "password": pass_b
    })
    assert res_b.status_code == 200, f"Account B registration failed: {res_b.text}"
    token_b = res_b.json()["token"]
    admin_id_b = res_b.json()["user"]["admin_id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"[OK] Account B created: username={user_b}, admin_id={admin_id_b}")

    # 3. ACCOUNT_A creates data across modules
    # A. Criminal Watchlist
    c_data_a = {
        "id": f"CRIM-A-{timestamp}",
        "name": "Suspect Alpha",
        "crimeType": "Cyber Intrusion",
        "riskLevel": "Critical Risk"
    }
    r = requests.post(f"{BASE_URL}/api/criminal/watchlist", json=c_data_a, headers=headers_a)
    assert r.status_code == 201, f"Account A create criminal record failed: {r.text}"
    doc_id_a = r.json()["data"]["_id"]
    print(f"[OK] Account A created criminal record: {doc_id_a}")

    # B. Attendance Personnel
    p_data_a = {
        "id": f"EMP-A-{timestamp}",
        "name": "Officer Alpha",
        "department": "Cyber Command",
        "role": "Lead Specialist"
    }
    r = requests.post(f"{BASE_URL}/api/attendance/personnel", json=p_data_a, headers=headers_a)
    assert r.status_code in (200, 201), f"Account A create personnel failed: {r.text}"
    print(f"[OK] Account A created attendance personnel record")

    # C. Emergency Contact
    cont_a = {
        "name": "Emergency Officer A",
        "email": "officer_a@domain.com",
        "phone": "+919999900001"
    }
    r = requests.post(f"{BASE_URL}/api/settings/contacts", json=cont_a, headers=headers_a)
    assert r.status_code in (200, 201), f"Account A create contact failed: {r.text}"
    print(f"[OK] Account A created emergency contact")

    # 4. ACCOUNT_B fetches data -> Must return ZERO of Account A's items
    r = requests.get(f"{BASE_URL}/api/criminal/watchlist", headers=headers_b)
    data_b_watchlist = r.json().get("data", [])
    assert not any(item["name"] == "Suspect Alpha" for item in data_b_watchlist), "SECURITY BREACH: Account B saw Account A's criminal suspect!"
    print(f"[OK] Account B watchlist query returned 0 items of Account A")

    r = requests.get(f"{BASE_URL}/api/attendance/personnel", headers=headers_b)
    data_b_personnel = r.json().get("data", [])
    assert not any(item["name"] == "Officer Alpha" for item in data_b_personnel), "SECURITY BREACH: Account B saw Account A's personnel!"
    print(f"[OK] Account B personnel query returned 0 items of Account A")

    r = requests.get(f"{BASE_URL}/api/settings/contacts", headers=headers_b)
    data_b_contacts = r.json().get("data", [])
    assert not any(item["email"] == "officer_a@domain.com" for item in data_b_contacts), "SECURITY BREACH: Account B saw Account A's emergency contact!"
    print(f"[OK] Account B contacts query returned 0 items of Account A")

    # 5. SECURITY TEST — DIRECT API CROSS-ACCOUNT ACCESS BY ID ENUMERATION
    # Account B attempts GET of Account A's record ID
    r_get = requests.get(f"{BASE_URL}/api/criminal/watchlist/{doc_id_a}", headers=headers_b)
    assert r_get.status_code == 404, f"SECURITY BREACH: Account B GET Account A record returned {r_get.status_code} instead of 404!"
    print(f"[OK] Security Test GET: Account B GET on Account A's ObjectId returned 404 Not Found")

    # Account B attempts PUT of Account A's record ID
    r_put = requests.put(f"{BASE_URL}/api/criminal/watchlist/{doc_id_a}", json={"name": "Hacked By B"}, headers=headers_b)
    assert r_put.status_code == 404, f"SECURITY BREACH: Account B PUT Account A record returned {r_put.status_code} instead of 404!"
    print(f"[OK] Security Test PUT: Account B PUT on Account A's ObjectId returned 404 Not Found")

    # Account B attempts DELETE of Account A's record ID
    r_del = requests.delete(f"{BASE_URL}/api/criminal/watchlist/{doc_id_a}", headers=headers_b)
    assert r_del.status_code == 404, f"SECURITY BREACH: Account B DELETE Account A record returned {r_del.status_code} instead of 404!"
    print(f"[OK] Security Test DELETE: Account B DELETE on Account A's ObjectId returned 404 Not Found")

    # 6. ACCOUNT_B creates own data
    c_data_b = {
        "id": f"CRIM-B-{timestamp}",
        "name": "Suspect Beta",
        "crimeType": "Financial Fraud",
        "riskLevel": "High Risk"
    }
    r = requests.post(f"{BASE_URL}/api/criminal/watchlist", json=c_data_b, headers=headers_b)
    assert r.status_code == 201
    doc_id_b = r.json()["data"]["_id"]
    print(f"[OK] Account B created criminal record: {doc_id_b}")

    # 7. ACCOUNT_A fetches data -> Must return ONLY Account A's data (0 of Account B's items)
    r = requests.get(f"{BASE_URL}/api/criminal/watchlist", headers=headers_a)
    data_a_watchlist = r.json().get("data", [])
    assert any(item["name"] == "Suspect Alpha" for item in data_a_watchlist), "Account A missing its own criminal suspect!"
    assert not any(item["name"] == "Suspect Beta" for item in data_a_watchlist), "SECURITY BREACH: Account A saw Account B's criminal suspect!"
    print(f"[OK] Account A query returned ONLY Account A data (0 items of Account B)")

    # 8. ACCOUNT_A direct cross-account attempts on ACCOUNT_B record
    r_get = requests.get(f"{BASE_URL}/api/criminal/watchlist/{doc_id_b}", headers=headers_a)
    assert r_get.status_code == 404
    print(f"[OK] Security Test Reverse GET: Account A GET on Account B's ObjectId returned 404 Not Found")

    r_put = requests.put(f"{BASE_URL}/api/criminal/watchlist/{doc_id_b}", json={"name": "Hacked By A"}, headers=headers_a)
    assert r_put.status_code == 404
    print(f"[OK] Security Test Reverse PUT: Account A PUT on Account B's ObjectId returned 404 Not Found")

    r_del = requests.delete(f"{BASE_URL}/api/criminal/watchlist/{doc_id_b}", headers=headers_a)
    assert r_del.status_code == 404
    print(f"[OK] Security Test Reverse DELETE: Account A DELETE on Account B's ObjectId returned 404 Not Found")

    print("\n🎉 ALL MULTI-ACCOUNT AUTHORIZATION & ISOLATION TESTS PASSED 100% PERFECTLY! 🎉")

if __name__ == "__main__":
    run_tests()
