"""
Project Chakravyuh - ANPR System Router (Auto-Saving CRUD API Engine)
Module Database: ANPR_vehicle_system (db_anpr)
Prefix: /api/anpr

Collections Managed:
- alerts
- anpr_scan
- camera_network
- map
- registered_data
- reports
- system_setting
- user_account
- vehicles
- scan_logs
"""

from fastapi import APIRouter, HTTPException, Body, status, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from database import db_anpr, check_database_health
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

router = APIRouter(tags=["ANPR Vehicle System"])

# ---------------------------------------------------------
# Dynamic Generic Collection CRUD Endpoints
# ---------------------------------------------------------
@router.get("/collection/{collection_name}")
async def get_any_collection_docs(collection_name: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch all documents from specified collection in ANPR database"""
    return await generic_get_all(db_anpr[collection_name], admin_id=admin_id)

@router.post("/collection/{collection_name}", status_code=status.HTTP_201_CREATED)
async def create_any_collection_doc(collection_name: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Insert a document directly into specified MongoDB collection in ANPR DB"""
    return await generic_create(db_anpr[collection_name], payload, admin_id=admin_id)

@router.get("/collection/{collection_name}/{doc_id}")
async def get_any_collection_doc_by_id(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch a document by ID from specified collection"""
    return await generic_get_one(db_anpr[collection_name], doc_id, admin_id=admin_id)

@router.put("/collection/{collection_name}/{doc_id}")
async def update_any_collection_doc(collection_name: str, doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Update a document by ID in specified collection"""
    return await generic_update(db_anpr[collection_name], doc_id, payload, admin_id=admin_id)

@router.delete("/collection/{collection_name}/{doc_id}")
async def delete_any_collection_doc(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Delete a document by ID from specified collection"""
    return await generic_delete(db_anpr[collection_name], doc_id, admin_id=admin_id)


# ---------------------------------------------------------
# Dedicated Collection Routes for ANPR DB
# ---------------------------------------------------------

# 1. ALERTS COLLECTION
@router.get("/alerts")
async def get_all_alerts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["alerts"], admin_id=admin_id)

@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_alert(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["alerts"], payload, admin_id=admin_id)

@router.get("/alerts/{doc_id}")
async def get_alert_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["alerts"], doc_id, admin_id=admin_id)

@router.put("/alerts/{doc_id}")
async def update_alert(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["alerts"], doc_id, payload, admin_id=admin_id)

@router.delete("/alerts/{doc_id}")
async def delete_alert(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["alerts"], doc_id, admin_id=admin_id)


# 2. ANPR SCAN COLLECTION
@router.get("/anpr-scan")
@router.get("/anpr_scan")
async def get_anpr_scans(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["anpr_scan"], admin_id=admin_id)

@router.post("/anpr-scan", status_code=status.HTTP_201_CREATED)
@router.post("/anpr_scan", status_code=status.HTTP_201_CREATED)
async def create_anpr_scan(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["anpr_scan"], payload, admin_id=admin_id)

@router.get("/anpr-scan/{doc_id}")
@router.get("/anpr_scan/{doc_id}")
async def get_anpr_scan_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["anpr_scan"], doc_id, admin_id=admin_id)

@router.put("/anpr-scan/{doc_id}")
@router.put("/anpr_scan/{doc_id}")
async def update_anpr_scan(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["anpr_scan"], doc_id, payload, admin_id=admin_id)

@router.delete("/anpr-scan/{doc_id}")
@router.delete("/anpr_scan/{doc_id}")
async def delete_anpr_scan(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["anpr_scan"], doc_id, admin_id=admin_id)


# 3. CAMERA NETWORK COLLECTION
@router.get("/camera-network")
@router.get("/camera_network")
async def get_camera_network(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["camera_network"], admin_id=admin_id)

@router.post("/camera-network", status_code=status.HTTP_201_CREATED)
@router.post("/camera_network", status_code=status.HTTP_201_CREATED)
async def create_camera_node(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["camera_network"], payload, admin_id=admin_id)

@router.get("/camera-network/{doc_id}")
@router.get("/camera_network/{doc_id}")
async def get_camera_node_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["camera_network"], doc_id, admin_id=admin_id)

@router.put("/camera-network/{doc_id}")
@router.put("/camera_network/{doc_id}")
async def update_camera_node(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["camera_network"], doc_id, payload, admin_id=admin_id)

@router.delete("/camera-network/{doc_id}")
@router.delete("/camera_network/{doc_id}")
async def delete_camera_node(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["camera_network"], doc_id, admin_id=admin_id)


# 4. MAP COLLECTION
@router.get("/map")
async def get_map_nodes(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["map"], admin_id=admin_id)

@router.post("/map", status_code=status.HTTP_201_CREATED)
async def create_map_node(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["map"], payload, admin_id=admin_id)

@router.get("/map/{doc_id}")
async def get_map_node_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["map"], doc_id, admin_id=admin_id)

@router.put("/map/{doc_id}")
async def update_map_node(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["map"], doc_id, payload, admin_id=admin_id)

@router.delete("/map/{doc_id}")
async def delete_map_node(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["map"], doc_id, admin_id=admin_id)


# 5. REGISTERED DATA COLLECTION
@router.get("/registered-data")
@router.get("/registered_data")
async def get_registered_data(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["registered_data"], admin_id=admin_id)

@router.post("/registered-data", status_code=status.HTTP_201_CREATED)
@router.post("/registered_data", status_code=status.HTTP_201_CREATED)
async def create_registered_data(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["registered_data"], payload, admin_id=admin_id)

@router.get("/registered-data/{doc_id}")
@router.get("/registered_data/{doc_id}")
async def get_registered_data_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["registered_data"], doc_id, admin_id=admin_id)

@router.put("/registered-data/{doc_id}")
@router.put("/registered_data/{doc_id}")
async def update_registered_data(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["registered_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/registered-data/{doc_id}")
@router.delete("/registered_data/{doc_id}")
async def delete_registered_data(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["registered_data"], doc_id, admin_id=admin_id)


# 6. REPORTS COLLECTION
@router.get("/reports")
async def get_reports(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["reports"], admin_id=admin_id)

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["reports"], payload, admin_id=admin_id)

@router.get("/reports/{doc_id}")
async def get_report_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["reports"], doc_id, admin_id=admin_id)

@router.put("/reports/{doc_id}")
async def update_report(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["reports"], doc_id, payload, admin_id=admin_id)

@router.delete("/reports/{doc_id}")
async def delete_report(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["reports"], doc_id, admin_id=admin_id)


# 7. SYSTEM SETTING COLLECTION
@router.get("/system-setting")
@router.get("/system_setting")
async def get_system_setting(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["system_setting"], admin_id=admin_id)

@router.post("/system-setting", status_code=status.HTTP_201_CREATED)
@router.post("/system_setting", status_code=status.HTTP_201_CREATED)
async def create_system_setting(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["system_setting"], payload, admin_id=admin_id)

@router.get("/system-setting/{doc_id}")
@router.get("/system_setting/{doc_id}")
async def get_system_setting_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["system_setting"], doc_id, admin_id=admin_id)

@router.put("/system-setting/{doc_id}")
@router.put("/system_setting/{doc_id}")
async def update_system_setting(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["system_setting"], doc_id, payload, admin_id=admin_id)

@router.delete("/system-setting/{doc_id}")
@router.delete("/system_setting/{doc_id}")
async def delete_system_setting(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["system_setting"], doc_id, admin_id=admin_id)


# 8. USER ACCOUNT COLLECTION
@router.get("/user-account")
@router.get("/user_account")
async def get_user_accounts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["user_account"], admin_id=admin_id)

@router.post("/user-account", status_code=status.HTTP_201_CREATED)
@router.post("/user_account", status_code=status.HTTP_201_CREATED)
async def create_user_account(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_anpr["user_account"], payload, admin_id=admin_id)

@router.get("/user-account/{doc_id}")
@router.get("/user_account/{doc_id}")
async def get_user_account_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["user_account"], doc_id, admin_id=admin_id)

@router.put("/user-account/{doc_id}")
@router.put("/user_account/{doc_id}")
async def update_user_account(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["user_account"], doc_id, payload, admin_id=admin_id)

@router.delete("/user-account/{doc_id}")
@router.delete("/user_account/{doc_id}")
async def delete_user_account(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["user_account"], doc_id, admin_id=admin_id)


# 9. VEHICLES ROUTE ALIAS (Internal Redirect to Official registered_data Collection)
@router.get("/vehicles")
async def get_all_vehicles(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_anpr["registered_data"], admin_id=admin_id)

@router.post("/vehicles", status_code=status.HTTP_201_CREATED)
async def register_vehicle(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    plate = payload.get("plateNumber") or payload.get("plate_number")
    if plate:
        payload["plateNumber"] = str(plate).upper().strip()
    return await generic_create(db_anpr["registered_data"], payload, admin_id=admin_id)

@router.get("/vehicles/{doc_id}")
async def get_vehicle_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_anpr["registered_data"], doc_id, admin_id=admin_id)

@router.put("/vehicles/{doc_id}")
async def update_vehicle(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_anpr["registered_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/vehicles/{plate_number}")
async def delete_vehicle(plate_number: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_anpr["registered_data"], plate_number, admin_id=admin_id)


# ---------------------------------------------------------
# Overview & Health Endpoints
# ---------------------------------------------------------
from fastapi import Header

@router.get("/")
async def get_anpr_module_status(authorization: Optional[str] = Header(None)):
    """Overview status of ANPR Vehicle system and collection counts"""
    try:
        admin_id = None
        if authorization:
            try:
                admin_id = get_authenticated_admin_id(authorization)
            except Exception:
                pass
        filter_q = {"admin_id": admin_id} if admin_id else {}
        collections = ["alerts", "anpr_scan", "camera_network", "map", "registered_data", "reports", "system_setting", "user_account"]
        stats = {}
        for coll in collections:
            stats[coll] = await db_anpr[coll].count_documents(filter_q)
        return {
            "status": "online",
            "module": "ANPR Automatic License Plate Recognition System",
            "database": "ANPR_vehicle_system",
            "collection_counts": stats,
            "server_time": get_server_time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def anpr_health_check():
    db_health = await check_database_health()
    return {
        "module": "ANPR Vehicle System",
        "database": "ANPR_vehicle_system",
        "db_health": db_health
    }
