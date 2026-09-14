"""
Project Chakravyuh - Criminal Tracking Router (Auto-Saving CRUD API Engine)
Module Database: Criminal_traking (db_criminal)
Prefix: /api/criminal

Collections Managed:
- alerts
- camera_network
- criminal_detections
- locations_map
- registered_data
- reports
- system_settings
- user_account
- watchlist
"""

from fastapi import APIRouter, HTTPException, Body, status, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from database import db_criminal, check_database_health
from utils.crud_helper import (
    get_authenticated_admin_id,
    get_server_time,
    serialize_doc,
    serialize_docs,
    generic_get_all,
    generic_get_one,
    generic_create,
    generic_update,
    generic_delete
)
from utils.notifier import send_criminal_alert, find_nearest_police_station, calculate_haversine_distance, send_officer_welcome_email

router = APIRouter(tags=["Criminal Tracking System"])

# ---------------------------------------------------------
# Dynamic Generic Collection CRUD Endpoints
# ---------------------------------------------------------
@router.get("/collection/{collection_name}")
async def get_any_collection_docs(collection_name: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch all documents from any specified collection in Criminal Tracking database"""
    return await generic_get_all(db_criminal[collection_name], admin_id=admin_id)

@router.post("/collection/{collection_name}", status_code=status.HTTP_201_CREATED)
async def create_any_collection_doc(collection_name: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Insert a new document directly into specified MongoDB collection"""
    return await generic_create(db_criminal[collection_name], payload, admin_id=admin_id)

@router.get("/collection/{collection_name}/{doc_id}")
async def get_any_collection_doc_by_id(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch a document by ID from specified collection"""
    return await generic_get_one(db_criminal[collection_name], doc_id, admin_id=admin_id)

@router.put("/collection/{collection_name}/{doc_id}")
async def update_any_collection_doc(collection_name: str, doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Update a document by ID in specified collection"""
    return await generic_update(db_criminal[collection_name], doc_id, payload, admin_id=admin_id)

@router.delete("/collection/{collection_name}/{doc_id}")
async def delete_any_collection_doc(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Delete a document by ID from specified collection"""
    return await generic_delete(db_criminal[collection_name], doc_id, admin_id=admin_id)


# ---------------------------------------------------------
# Dedicated Collection Routes for Criminal Tracking DB
# ---------------------------------------------------------

# 1. ALERTS COLLECTION
@router.get("/alerts")
async def get_all_alerts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["alerts"], admin_id=admin_id)

@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_alert(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["alerts"], payload, admin_id=admin_id)

@router.get("/alerts/{doc_id}")
async def get_alert_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["alerts"], doc_id, admin_id=admin_id)

@router.put("/alerts/{doc_id}")
async def update_alert(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["alerts"], doc_id, payload, admin_id=admin_id)

@router.delete("/alerts/{doc_id}")
async def delete_alert(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["alerts"], doc_id, admin_id=admin_id)


# 2. CAMERA NETWORK COLLECTION
@router.get("/camera-network")
@router.get("/camera_network")
async def get_camera_network(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["camera_network"], admin_id=admin_id)

@router.post("/camera-network", status_code=status.HTTP_201_CREATED)
@router.post("/camera_network", status_code=status.HTTP_201_CREATED)
async def create_camera_node(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["camera_network"], payload, admin_id=admin_id)

@router.get("/camera-network/{doc_id}")
@router.get("/camera_network/{doc_id}")
async def get_camera_node_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["camera_network"], doc_id, admin_id=admin_id)

@router.put("/camera-network/{doc_id}")
@router.put("/camera_network/{doc_id}")
async def update_camera_node(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["camera_network"], doc_id, payload, admin_id=admin_id)

@router.delete("/camera-network/{doc_id}")
@router.delete("/camera_network/{doc_id}")
async def delete_camera_node(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["camera_network"], doc_id, admin_id=admin_id)


# 3. CRIMINAL DETECTIONS COLLECTION
@router.get("/criminal-detections")
@router.get("/criminal_detections")
async def get_criminal_detections(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["criminal_detections"], admin_id=admin_id)

@router.post("/criminal-detections", status_code=status.HTTP_201_CREATED)
@router.post("/criminal_detections", status_code=status.HTTP_201_CREATED)
async def create_criminal_detection(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["criminal_detections"], payload, admin_id=admin_id)

@router.get("/criminal-detections/{doc_id}")
@router.get("/criminal_detections/{doc_id}")
async def get_criminal_detection_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["criminal_detections"], doc_id, admin_id=admin_id)

@router.put("/criminal-detections/{doc_id}")
@router.put("/criminal_detections/{doc_id}")
async def update_criminal_detection(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["criminal_detections"], doc_id, payload, admin_id=admin_id)

@router.delete("/criminal-detections/{doc_id}")
@router.delete("/criminal_detections/{doc_id}")
async def delete_criminal_detection(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["criminal_detections"], doc_id, admin_id=admin_id)


# 4. LOCATIONS MAP COLLECTION
@router.get("/locations-map")
@router.get("/locations_map")
async def get_locations_map(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["locations_map"], admin_id=admin_id)

@router.post("/locations-map", status_code=status.HTTP_201_CREATED)
@router.post("/locations_map", status_code=status.HTTP_201_CREATED)
async def create_location(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["locations_map"], payload, admin_id=admin_id)

@router.get("/locations-map/{doc_id}")
@router.get("/locations_map/{doc_id}")
async def get_location_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["locations_map"], doc_id, admin_id=admin_id)

@router.put("/locations-map/{doc_id}")
@router.put("/locations_map/{doc_id}")
async def update_location(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["locations_map"], doc_id, payload, admin_id=admin_id)

@router.delete("/locations-map/{doc_id}")
@router.delete("/locations_map/{doc_id}")
async def delete_location(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["locations_map"], doc_id, admin_id=admin_id)


# 5. REGISTERED DATA COLLECTION
@router.get("/registered-data")
@router.get("/registered_data")
async def get_registered_data(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["registered_data"], admin_id=admin_id)

@router.post("/registered-data", status_code=status.HTTP_201_CREATED)
@router.post("/registered_data", status_code=status.HTTP_201_CREATED)
async def create_registered_data(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["registered_data"], payload, admin_id=admin_id)

@router.get("/registered-data/{doc_id}")
@router.get("/registered_data/{doc_id}")
async def get_registered_data_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["registered_data"], doc_id, admin_id=admin_id)

@router.put("/registered-data/{doc_id}")
@router.put("/registered_data/{doc_id}")
async def update_registered_data(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["registered_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/registered-data/{doc_id}")
@router.delete("/registered_data/{doc_id}")
async def delete_registered_data(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["registered_data"], doc_id, admin_id=admin_id)


# 6. REPORTS COLLECTION
@router.get("/reports")
async def get_reports(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["reports"], admin_id=admin_id)

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["reports"], payload, admin_id=admin_id)

@router.get("/reports/{doc_id}")
async def get_report_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["reports"], doc_id, admin_id=admin_id)

@router.put("/reports/{doc_id}")
async def update_report(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["reports"], doc_id, payload, admin_id=admin_id)

@router.delete("/reports/{doc_id}")
async def delete_report(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["reports"], doc_id, admin_id=admin_id)


# 7. SYSTEM SETTINGS COLLECTION
@router.get("/system-settings")
@router.get("/system_settings")
async def get_system_settings(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["system_settings"], admin_id=admin_id)

@router.post("/system-settings", status_code=status.HTTP_201_CREATED)
@router.post("/system_settings", status_code=status.HTTP_201_CREATED)
async def create_system_setting(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["system_settings"], payload, admin_id=admin_id)

@router.get("/system-settings/{doc_id}")
@router.get("/system_settings/{doc_id}")
async def get_system_setting_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["system_settings"], doc_id, admin_id=admin_id)

@router.put("/system-settings/{doc_id}")
@router.put("/system_settings/{doc_id}")
async def update_system_setting(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["system_settings"], doc_id, payload, admin_id=admin_id)

@router.delete("/system-settings/{doc_id}")
@router.delete("/system_settings/{doc_id}")
async def delete_system_setting(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["system_settings"], doc_id, admin_id=admin_id)


# 8. USER ACCOUNT COLLECTION
@router.get("/user-account")
@router.get("/user_account")
@router.get("/user_account.criminal")
async def get_user_accounts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["user_account.criminal"], admin_id=admin_id)

@router.post("/user-account", status_code=status.HTTP_201_CREATED)
@router.post("/user_account", status_code=status.HTTP_201_CREATED)
@router.post("/user_account.criminal", status_code=status.HTTP_201_CREATED)
async def create_user_account(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_criminal["user_account.criminal"], payload, admin_id=admin_id)

@router.get("/user-account/{doc_id}")
@router.get("/user_account/{doc_id}")
@router.get("/user_account.criminal/{doc_id}")
async def get_user_account_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["user_account.criminal"], doc_id, admin_id=admin_id)

@router.put("/user-account/{doc_id}")
@router.put("/user_account/{doc_id}")
@router.put("/user_account.criminal/{doc_id}")
async def update_user_account(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["user_account.criminal"], doc_id, payload, admin_id=admin_id)

@router.delete("/user-account/{doc_id}")
@router.delete("/user_account/{doc_id}")
@router.delete("/user_account.criminal/{doc_id}")
async def delete_user_account(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["user_account.criminal"], doc_id, admin_id=admin_id)


# 9. WATCHLIST ROUTE ALIAS (Internal Redirect to Official registered_data Collection)
@router.get("/watchlist")
async def get_watchlist(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["registered_data"], admin_id=admin_id)

@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    import time
    target_id = payload.get("id") or f"W-{int(time.time())}"
    payload["id"] = str(target_id)
    return await generic_create(db_criminal["registered_data"], payload, admin_id=admin_id)

@router.get("/watchlist/{doc_id}")
async def get_watchlist_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["registered_data"], doc_id, admin_id=admin_id)

@router.put("/watchlist/{doc_id}")
async def update_watchlist_suspect(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_criminal["registered_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/watchlist/{doc_id}")
async def delete_watchlist_suspect(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["registered_data"], doc_id, admin_id=admin_id)


# 10. OFFICER INFORMATION COLLECTION (Criminal_traking.officer_information)
@router.get("/officer-information")
@router.get("/officer_information")
async def get_officer_information(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_criminal["officer_information"], admin_id=admin_id)

@router.post("/officer-information", status_code=status.HTTP_201_CREATED)
@router.post("/officer_information", status_code=status.HTTP_201_CREATED)
async def create_officer_information(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    admin_id: str = Depends(get_authenticated_admin_id)
):
    created_doc = await generic_create(db_criminal["officer_information"], payload, admin_id=admin_id)
    # Trigger non-blocking registration email dispatch to officer's registered email
    background_tasks.add_task(send_officer_welcome_email, payload, admin_id)
    return created_doc

@router.get("/officer-information/{doc_id}")
@router.get("/officer_information/{doc_id}")
async def get_officer_information_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_criminal["officer_information"], doc_id, admin_id=admin_id)

@router.put("/officer-information/{doc_id}")
@router.put("/officer_information/{doc_id}")
async def update_officer_information(
    doc_id: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    admin_id: str = Depends(get_authenticated_admin_id)
):
    updated_doc = await generic_update(db_criminal["officer_information"], doc_id, payload, admin_id=admin_id)
    # Trigger non-blocking update email dispatch to officer's email
    background_tasks.add_task(send_officer_welcome_email, payload, admin_id)
    return updated_doc

@router.delete("/officer-information/{doc_id}")
@router.delete("/officer_information/{doc_id}")
async def delete_officer_information(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_criminal["officer_information"], doc_id, admin_id=admin_id)

@router.post("/officers/send-test-email")
async def send_test_officer_email(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    admin_id: str = Depends(get_authenticated_admin_id)
):
    officer_email = payload.get("email") or payload.get("officer_email")
    if not officer_email:
        raise HTTPException(status_code=400, detail="Officer email is required")
    background_tasks.add_task(send_officer_welcome_email, payload, admin_id)
    return {"status": "success", "message": f"Test registration email dispatch initiated for {officer_email}"}


# 11. CAMERA ↔ POLICE STATION DISTANCE & ALERT ROUTING ENDPOINT
import time

RECENT_ALERT_DISPATCHES: Dict[str, float] = {}
ALERT_COOLDOWN_SECONDS = 60.0

def check_and_register_duplicate(criminal_id: str, cam_id: str, force: bool = False) -> bool:
    """
    Duplicate alert prevention: Suppresses repeated emails for same criminal + camera within 60s window.
    """
    if force:
        return False
    now = time.time()
    key = f"{(criminal_id or 'UNKNOWN').strip().lower()}:{(cam_id or 'UNKNOWN').strip().lower()}"
    last_ts = RECENT_ALERT_DISPATCHES.get(key, 0.0)
    if now - last_ts < ALERT_COOLDOWN_SECONDS:
        return True
    RECENT_ALERT_DISPATCHES[key] = now
    return False

@router.post("/test-distance-routing")
@router.post("/test_distance_routing")
@router.post("/dispatch-alert")
@router.post("/dispatch_alert")
async def test_camera_police_distance_routing(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """
    Calculates distance between Camera coordinates (Criminal_traking.camera_network)
    and Police Station coordinates (Criminal_traking.officer_information).
    Identifies nearest police station, officer_email, and dispatches full alert.
    Includes 60s duplicate alert suppression per suspect+camera node.
    """
    cam_id = payload.get("camera_id") or payload.get("cam_id") or "CAM-NEMAWAR-01"
    criminal_name = payload.get("criminal_name") or payload.get("name") or payload.get("targetName") or "Ramesh Kumar"
    criminal_id = payload.get("criminal_id") or payload.get("id") or payload.get("targetId") or "CRIM-8841"
    force_send = payload.get("force") or payload.get("is_test") or False

    # Duplicate Prevention Check
    if check_and_register_duplicate(criminal_id, cam_id, force=force_send):
        return {
            "status": "suppressed",
            "message": f"Duplicate alert suppressed for suspect '{criminal_name}' ({criminal_id}) at camera {cam_id} within 60s cooldown.",
            "cooldown_remaining_sec": int(ALERT_COOLDOWN_SECONDS - (time.time() - RECENT_ALERT_DISPATCHES.get(f"{criminal_id.lower()}:{cam_id.lower()}", 0.0)))
        }

    # 1. Lookup Camera in Criminal_traking.camera_network
    cam_doc = await db_criminal["camera_network"].find_one({
        "$or": [
            {"camera_id": cam_id},
            {"id": cam_id},
            {"camera_name": cam_id},
            {"name": cam_id}
        ]
    })

    if cam_doc:
        cam_name = cam_doc.get("camera_name") or cam_doc.get("name") or cam_id
        cam_address = cam_doc.get("location") or cam_doc.get("address") or "Nemawar Location"
        lat = float(cam_doc.get("latitude") if cam_doc.get("latitude") is not None else cam_doc.get("lat", 22.4632))
        lng = float(cam_doc.get("longitude") if cam_doc.get("longitude") is not None else cam_doc.get("lng", 76.9381))
    else:
        cam_name = payload.get("camera_name") or "Nemawar CCTV Camera Node"
        cam_address = payload.get("location") or payload.get("address") or "Nemawar Bypass, MP"
        lat = float(payload.get("latitude") or payload.get("lat") or 22.4632)
        lng = float(payload.get("longitude") or payload.get("lng") or 76.9381)

    # 2. Find Nearest Police Station from Criminal_traking.officer_information
    nearest = await find_nearest_police_station(lat, lng, admin_id=admin_id)

    # 3. Dispatch alert email directly to officer_email of nearest station
    alert_payload = {
        "name": criminal_name,
        "id": criminal_id,
        "photo_url": payload.get("photo_url") or payload.get("photoUrl") or payload.get("photo"),
        "risk_level": payload.get("risk_level") or payload.get("riskLevel") or "Critical Risk",
        "crime_details": payload.get("crime_details") or payload.get("crimeType") or payload.get("description") or "Under Active Watchlist Surveillance",
        "ipc_charges": payload.get("ipc_charges") or payload.get("charges") or "IPC 302 / 395 - Armed Robbery & Homicide",
        "age": payload.get("age") or "34"
    }
    location_payload = {
        "cam_id": cam_id,
        "camera_location": cam_address,
        "lat": lat,
        "lng": lng
    }

    dispatch_res = await send_criminal_alert(alert_payload, location_payload, admin_id=admin_id)

    return {
        "status": dispatch_res.get("status", "success"),
        "message": dispatch_res.get("message", "Alert processing completed"),
        "camera_detected": {
            "camera_id": cam_id,
            "camera_name": cam_name,
            "location": cam_address,
            "latitude": lat,
            "longitude": lng
        },
        "nearest_police_station": nearest,
        "distance_calculated_km": nearest.get("distance_km") if nearest else None,
        "dispatched_officers": dispatch_res.get("dispatched_officers") or dispatch_res.get("target_officers"),
        "email_dispatch_result": dispatch_res
    }



# ---------------------------------------------------------
# Module Status & Health Check
# ---------------------------------------------------------
from fastapi import Header

@router.get("/")
async def get_criminal_module_status(authorization: Optional[str] = Header(None)):
    """Overview status of Criminal Tracking system and collection counts"""
    try:
        admin_id = None
        if authorization:
            try:
                admin_id = get_authenticated_admin_id(authorization)
            except Exception:
                pass
        filter_q = {"admin_id": admin_id} if admin_id else {}
        collections = ["alerts", "camera_network", "criminal_detections", "locations_map", "officer_information", "registered_data", "reports", "system_settings", "user_account"]
        stats = {}
        for coll in collections:
            stats[coll] = await db_criminal[coll].count_documents(filter_q)
        return {
            "status": "online",
            "module": "Criminal Tracking & Watchlist System",
            "database": "Criminal_traking",
            "collection_counts": stats,
            "server_time": get_server_time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def criminal_health_check():
    db_health = await check_database_health()
    return {
        "module": "Criminal Tracking System",
        "database": "Criminal_traking",
        "db_health": db_health
    }
