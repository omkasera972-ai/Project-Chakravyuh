import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://omkasera972_db_user:mongo_db_userom123@cluster0.xy8twbt.mongodb.net/"

async def run_verification():
    print("Starting MongoDB Atlas Direct Persistence & Schema Verification...")
    client = AsyncIOMotorClient(MONGO_URI)
    
    # 1. Attendance System -> Attendence
    db_attendence = client['Attendence']
    
    # Register test student
    reg_doc = {
        "person_id": "TEST_STU_001",
        "name": "Test Student Verification",
        "father_name": "Father Name",
        "class": "10-A",
        "year": "2026",
        "mobile": "9876543210",
        "photo": "data:image/png;base64,test",
        "face_information": "encoded_features",
        "status": "Present",
        "created_at": "2026-09-11T01:45:00Z"
    }
    await db_attendence['registered_data'].delete_many({"person_id": "TEST_STU_001"})
    res_reg = await db_attendence['registered_data'].insert_one(reg_doc)
    
    # Attendance scan
    scan_doc = {
        "person_id": "TEST_STU_001",
        "name": "Test Student Verification",
        "date": "2026-09-11",
        "exact_time": "01:45:00",
        "timestamp": 1789067100,
        "status": "Present",
        "camera": "CAM_01_GATE",
        "confidence": 0.98,
        "created_at": "2026-09-11T01:45:00Z"
    }
    await db_attendence['attendance_scan'].insert_one(scan_doc)
    
    # Students Info PA
    pa_doc = {
        "person_id": "TEST_STU_001",
        "name": "Test Student Verification",
        "status": "Present",
        "date": "2026-09-11",
        "time": "01:45:00",
        "timestamp": 1789067100
    }
    await db_attendence['students_info_PA'].update_one(
        {"person_id": "TEST_STU_001"},
        {"$set": pa_doc},
        upsert=True
    )
    
    # Alerts
    alert_att = {
        "person_id": "TEST_STU_001",
        "title": "Attendance Alert Test",
        "message": "Student marked present",
        "timestamp": "2026-09-11T01:45:00Z"
    }
    await db_attendence['alerts'].insert_one(alert_att)
    
    # Reports
    report_att = {
        "title": "Attendance Daily Verification Report",
        "module": "Attendance",
        "generated_at": "2026-09-11T01:45:00Z"
    }
    await db_attendence['reports'].insert_one(report_att)
    
    # System settings
    setting_att = {
        "key": "attendance_config",
        "autoAlertSound": True,
        "updated_at": "2026-09-11T01:45:00Z"
    }
    await db_attendence['system_settings'].update_one({"key": "attendance_config"}, {"$set": setting_att}, upsert=True)
    
    # Camera network
    cam_att = {"cam_id": "CAM_01", "name": "Gate Camera", "status": "Active"}
    await db_attendence['camera_network'].update_one({"cam_id": "CAM_01"}, {"$set": cam_att}, upsert=True)
    
    # Map
    map_att = {"location_id": "LOC_01", "name": "Main Entrance", "coords": [28.6139, 77.2090]}
    await db_attendence['map'].update_one({"location_id": "LOC_01"}, {"$set": map_att}, upsert=True)


    # 2. Criminal Tracking System -> Criminal_traking
    db_criminal = client['Criminal_traking']
    await db_criminal['registered_data'].update_one({"criminal_id": "CRIM_001"}, {"$set": {"name": "Test Criminal", "status": "Wanted"}}, upsert=True)
    await db_criminal['criminal_detections'].insert_one({"criminal_id": "CRIM_001", "name": "Test Criminal", "location": "Zone 4", "confidence": 0.95, "detection_date": "2026-09-11"})
    await db_criminal['alerts'].insert_one({"alert_id": "ALT_CRIM_1", "type": "High Risk Match", "timestamp": "2026-09-11T01:45:00Z"})
    await db_criminal['reports'].insert_one({"title": "Criminal Audit Report", "type": "Criminal Tracking", "timestamp": "2026-09-11T01:45:00Z"})
    await db_criminal['system_settings'].update_one({"key": "criminal_config"}, {"$set": {"auto_alert": True}}, upsert=True)
    await db_criminal['camera_network'].update_one({"cam_id": "CAM_CRIM_1"}, {"$set": {"name": "Sector 12 Cam"}}, upsert=True)
    await db_criminal['locations_map'].update_one({"loc_id": "LOC_CRIM_1"}, {"$set": {"name": "Hotspot Alpha"}}, upsert=True)


    # 3. ANPR Vehicle System -> ANPR_vehicle_system
    db_anpr = client['ANPR_vehicle_system']
    await db_anpr['registered_data'].update_one({"plate_number": "DL01AB1234"}, {"$set": {"owner": "Test Owner", "category": "Flagged"}}, upsert=True)
    await db_anpr['anpr_scan'].insert_one({"plate_number": "DL01AB1234", "camera": "ANPR_CAM_1", "confidence": 0.97, "exact_time": "01:45:00", "date": "2026-09-11"})
    await db_anpr['alerts'].insert_one({"plate_number": "DL01AB1234", "alert_type": "Blacklisted Vehicle Intercept", "timestamp": "2026-09-11T01:45:00Z"})
    await db_anpr['reports'].insert_one({"title": "ANPR Traffic Analytics", "timestamp": "2026-09-11T01:45:00Z"})
    await db_anpr['system_setting'].update_one({"key": "anpr_config"}, {"$set": {"anprLiveIntercepts": True}}, upsert=True)
    await db_anpr['camera_network'].update_one({"cam_id": "CAM_ANPR_1"}, {"$set": {"name": "Highway Toll Cam"}}, upsert=True)
    await db_anpr['map'].update_one({"map_id": "MAP_ANPR_1"}, {"$set": {"zone": "Toll Plaza A"}}, upsert=True)


    # 4. Missing Children System -> Missing_children
    db_missing = client['Missing_children']
    await db_missing['registered_data'].update_one({"case_id": "CHILD_001"}, {"$set": {"child_name": "Test Child", "status": "Active Search"}}, upsert=True)
    await db_missing['children_detection'].insert_one({"case_id": "CHILD_001", "name": "Test Child", "location": "Bus Station", "confidence": 0.92, "timestamp": "2026-09-11T01:45:00Z"})
    await db_missing['alerts'].insert_one({"case_id": "CHILD_001", "alert": "Positive Facial Match Detected"})
    await db_missing['reports'].insert_one({"title": "Missing Child Case Summary", "timestamp": "2026-09-11T01:45:00Z"})
    await db_missing['system_setting'].update_one({"key": "missing_config"}, {"$set": {"auto_broadcast": True}}, upsert=True)
    await db_missing['camera_network'].update_one({"cam_id": "CAM_CHILD_1"}, {"$set": {"name": "Station Cam 3"}}, upsert=True)
    await db_missing['map'].update_one({"map_id": "MAP_CHILD_1"}, {"$set": {"area": "Central Station"}}, upsert=True)
    await db_missing['add_data'].insert_one({"case_id": "CHILD_001", "note": "Additional DNA and clothing info"})


    # 5. Defence Tactical System -> Defence_tactical_system
    db_defence = client['Defence_tactical_system']
    await db_defence['registered_data'].update_one({"unit_id": "UNIT_99"}, {"$set": {"unit_name": "Alpha Recon", "status": "Deployed"}}, upsert=True)
    await db_defence['defence_scan'].insert_one({"unit_id": "UNIT_99", "location": "Sector 4-B", "status": "Active Trace", "timestamp": "2026-09-11T01:45:00Z"})
    await db_defence['alerts'].insert_one({"unit_id": "UNIT_99", "alert": "Perimeter Breach Alert"})
    await db_defence['reports'].insert_one({"title": "Tactical Operations Report", "timestamp": "2026-09-11T01:45:00Z"})
    await db_defence['system_setting'].update_one({"key": "defence_config"}, {"$set": {"encryption_level": "AES-256"}}, upsert=True)
    await db_defence['camera_network'].update_one({"cam_id": "CAM_DEF_1"}, {"$set": {"name": "Border Drone Cam"}}, upsert=True)
    await db_defence['map'].update_one({"map_id": "MAP_DEF_1"}, {"$set": {"grid": "Grid 44-X"}}, upsert=True)
    await db_defence['add_data'].insert_one({"unit_id": "UNIT_99", "inventory": "Tactical Drones & Sensors"})

    print("ALL MONGODB ATLAS INSERTIONS AND UPDATES COMPLETED SUCCESSFULLY!")

asyncio.run(run_verification())
