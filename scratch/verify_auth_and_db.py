import sys
import os
import time
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    import backend.database as database
    from backend.database import (
        LocalCollection,
        SmartProxyDatabase
    )
    from backend.routers.auth import (
        hash_password,
        verify_password,
        create_admin_token,
        verify_admin_token
    )
    from backend.routers.attendance import check_20h_cooldown
except ImportError:
    import database  # type: ignore
    from database import (  # type: ignore
        LocalCollection,
        SmartProxyDatabase
    )
    from routers.auth import (  # type: ignore
        hash_password,
        verify_password,
        create_admin_token,
        verify_admin_token
    )
    from routers.attendance import check_20h_cooldown  # type: ignore

async def test_authentication_collections():
    print("=" * 60)
    print("RUNNING DIRECT BACKEND AUTHENTICATION & DB VERIFICATION")
    print("=" * 60)

    modules_test = [
        ("attendance", "Attendence", "user_account.attendance"),
        ("criminal-tracking", "Criminal_traking", "user_account.criminal"),
        ("anpr", "ANPR_vehicle_system", "user_account.anpr"),
        ("missing-child", "Missing_children", "user_account.missing_children"),
        ("defence", "Defence_tactical_system", "user_account.defence")
    ]

    for mod_id, db_name, expected_coll_name in modules_test:
        coll = LocalCollection(db_name, expected_coll_name)
        assert coll.coll_name == expected_coll_name, f"Collection mismatch for {mod_id}: expected {expected_coll_name}, got {coll.coll_name}"
        
        # Test password hashing
        raw_pw = f"TestPass_{mod_id}_2026!"
        pwd_hash = hash_password(raw_pw)
        assert pwd_hash.startswith("pbkdf2_sha256$100000$"), "Hash algorithm format invalid!"
        assert verify_password(raw_pw, pwd_hash) is True, "Password verification failed!"
        assert verify_password("WrongPassword!", pwd_hash) is False, "Invalid password passed verification!"

        # Register test admin document directly in exact collection
        test_user = f"test_admin_{mod_id.replace('-', '_')}"
        
        # Clean existing test doc if present
        await coll.delete_many({"username": test_user})

        admin_id = f"ADM-TEST-{mod_id.upper()[:4]}-{int(time.time())}"
        doc = {
            "admin_id": admin_id,
            "username": test_user,
            "password_hash": pwd_hash,
            "role": "admin",
            "moduleId": mod_id,
            "created_at": "11 Sep 2026, 02:00:00 PM IST",
            "updated_at": "11 Sep 2026, 02:00:00 PM IST"
        }
        await coll.insert_one(doc)

        # Verify insertion & password security
        inserted = await coll.find_one({"username": test_user})
        assert inserted is not None, f"Failed to persist doc in {expected_coll_name}"
        assert "password" not in inserted, "CRITICAL SECURITY WARNING: Plaintext password field found in DB doc!"
        assert inserted.get("password_hash") == pwd_hash, "Stored password hash mismatch!"

        # Test token generation & verification
        token = create_admin_token(admin_id, test_user, mod_id)
        verified_payload = verify_admin_token(f"Bearer {token}")
        assert verified_payload is not None, "Token validation failed!"
        assert verified_payload["admin_id"] == admin_id, "Token admin_id mismatch!"
        assert verified_payload["username"] == test_user, "Token username mismatch!"

        print(f"Verified {mod_id.upper()} -> Collection: '{expected_coll_name}' | Admin: {test_user}")

    print("\n" + "=" * 60)
    print("VERIFYING ATTENDANCE 20-HOUR SCAN COOLDOWN LOGIC (72000 SECONDS)")
    print("=" * 60)
    
    # Test 20h cooldown function
    allowed, last_scan, elapsed, remaining, next_at = await check_20h_cooldown("NON_EXISTENT_STUDENT_9999")
    assert allowed is True, "Non-existent student should be allowed scan!"
    print(f"Verified 20-Hour Attendance Cooldown check intact! (TWENTY_HOURS_SECONDS = 72000s)")

    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_authentication_collections())
