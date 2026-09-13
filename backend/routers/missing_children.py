"""
Project Chakravyuh - Missing Children Router (Auto-Saving CRUD API Engine)
Module Database: Missing_children (db_missing)
Prefix: /api/missing-children

Collections Managed:
- add_data
- alerts
- camera_network
- children_detection
- map
- registered_data
- reports
- system_setting
- user_account
- missing_children
"""

from fastapi import APIRouter, HTTPException, Body, status, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from database import db_missing, check_database_health
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

router = APIRouter(tags=["Missing Children System"])

# ---------------------------------------------------------
# Dynamic Generic Collection CRUD Endpoints
# ---------------------------------------------------------
@router.get("/collection/{collection_name}")
async def get_any_collection_docs(collection_name: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch all documents from specified collection in Missing Children database"""
    return await generic_get_all(db_missing[collection_name], admin_id=admin_id)

@router.post("/collection/{collection_name}", status_code=status.HTTP_201_CREATED)
async def create_any_collection_doc(collection_name: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Insert a document directly into specified MongoDB collection in Missing Children DB"""
    return await generic_create(db_missing[collection_name], payload, admin_id=admin_id)

@router.get("/collection/{collection_name}/{doc_id}")
async def get_any_collection_doc_by_id(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Fetch a document by ID from specified collection"""
    return await generic_get_one(db_missing[collection_name], doc_id, admin_id=admin_id)

@router.put("/collection/{collection_name}/{doc_id}")
async def update_any_collection_doc(collection_name: str, doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    """Update a document by ID in specified collection"""
    return await generic_update(db_missing[collection_name], doc_id, payload, admin_id=admin_id)

@router.delete("/collection/{collection_name}/{doc_id}")
async def delete_any_collection_doc(collection_name: str, doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    """Delete a document by ID from specified collection"""
    return await generic_delete(db_missing[collection_name], doc_id, admin_id=admin_id)


# ---------------------------------------------------------
# Dedicated Collection Routes for Missing Children DB
# ---------------------------------------------------------

# 1. ADD DATA COLLECTION
@router.get("/add-data")
@router.get("/add_data")
async def get_add_data(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["add_data"], admin_id=admin_id)

@router.post("/add-data", status_code=status.HTTP_201_CREATED)
@router.post("/add_data", status_code=status.HTTP_201_CREATED)
async def create_add_data(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["add_data"], payload, admin_id=admin_id)

@router.get("/add-data/{doc_id}")
@router.get("/add_data/{doc_id}")
async def get_add_data_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["add_data"], doc_id, admin_id=admin_id)

@router.put("/add-data/{doc_id}")
@router.put("/add_data/{doc_id}")
async def update_add_data(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["add_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/add-data/{doc_id}")
@router.delete("/add_data/{doc_id}")
async def delete_add_data(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["add_data"], doc_id, admin_id=admin_id)


# 2. ALERTS COLLECTION
@router.get("/alerts")
async def get_all_alerts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["alerts"], admin_id=admin_id)

@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_alert(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["alerts"], payload, admin_id=admin_id)

@router.get("/alerts/{doc_id}")
async def get_alert_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["alerts"], doc_id, admin_id=admin_id)

@router.put("/alerts/{doc_id}")
async def update_alert(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["alerts"], doc_id, payload, admin_id=admin_id)

@router.delete("/alerts/{doc_id}")
async def delete_alert(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["alerts"], doc_id, admin_id=admin_id)


# 3. CAMERA NETWORK COLLECTION
@router.get("/camera-network")
@router.get("/camera_network")
async def get_camera_network(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["camera_network"], admin_id=admin_id)

@router.post("/camera-network", status_code=status.HTTP_201_CREATED)
@router.post("/camera_network", status_code=status.HTTP_201_CREATED)
async def create_camera_node(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["camera_network"], payload, admin_id=admin_id)

@router.get("/camera-network/{doc_id}")
@router.get("/camera_network/{doc_id}")
async def get_camera_node_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["camera_network"], doc_id, admin_id=admin_id)

@router.put("/camera-network/{doc_id}")
@router.put("/camera_network/{doc_id}")
async def update_camera_node(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["camera_network"], doc_id, payload, admin_id=admin_id)

@router.delete("/camera-network/{doc_id}")
@router.delete("/camera_network/{doc_id}")
async def delete_camera_node(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["camera_network"], doc_id, admin_id=admin_id)


# 4. CHILDREN DETECTION COLLECTION
@router.get("/children-detection")
@router.get("/children_detection")
async def get_children_detections(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["children_detection"], admin_id=admin_id)

@router.post("/children-detection", status_code=status.HTTP_201_CREATED)
@router.post("/children_detection", status_code=status.HTTP_201_CREATED)
async def create_child_detection(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["children_detection"], payload, admin_id=admin_id)

@router.get("/children-detection/{doc_id}")
@router.get("/children_detection/{doc_id}")
async def get_child_detection_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["children_detection"], doc_id, admin_id=admin_id)

@router.put("/children-detection/{doc_id}")
@router.put("/children_detection/{doc_id}")
async def update_child_detection(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["children_detection"], doc_id, payload, admin_id=admin_id)

@router.delete("/children-detection/{doc_id}")
@router.delete("/children_detection/{doc_id}")
async def delete_child_detection(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["children_detection"], doc_id, admin_id=admin_id)


# 5. MAP COLLECTION
@router.get("/map")
async def get_map_nodes(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["map"], admin_id=admin_id)

@router.post("/map", status_code=status.HTTP_201_CREATED)
async def create_map_node(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["map"], payload, admin_id=admin_id)

@router.get("/map/{doc_id}")
async def get_map_node_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["map"], doc_id, admin_id=admin_id)

@router.put("/map/{doc_id}")
async def update_map_node(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["map"], doc_id, payload, admin_id=admin_id)

@router.delete("/map/{doc_id}")
async def delete_map_node(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["map"], doc_id, admin_id=admin_id)


# 6. REGISTERED DATA COLLECTION
@router.get("/registered-data")
@router.get("/registered_data")
async def get_registered_data(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["registered_data"], admin_id=admin_id)

@router.post("/registered-data", status_code=status.HTTP_201_CREATED)
@router.post("/registered_data", status_code=status.HTTP_201_CREATED)
async def create_registered_data(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["registered_data"], payload, admin_id=admin_id)

@router.get("/registered-data/{doc_id}")
@router.get("/registered_data/{doc_id}")
async def get_registered_data_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["registered_data"], doc_id, admin_id=admin_id)

@router.put("/registered-data/{doc_id}")
@router.put("/registered_data/{doc_id}")
async def update_registered_data(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["registered_data"], doc_id, payload, admin_id=admin_id)

@router.delete("/registered-data/{doc_id}")
@router.delete("/registered_data/{doc_id}")
async def delete_registered_data(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["registered_data"], doc_id, admin_id=admin_id)


# 7. REPORTS COLLECTION
@router.get("/reports")
async def get_reports(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["reports"], admin_id=admin_id)

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["reports"], payload, admin_id=admin_id)

@router.get("/reports/{doc_id}")
async def get_report_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["reports"], doc_id, admin_id=admin_id)

@router.put("/reports/{doc_id}")
async def update_report(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["reports"], doc_id, payload, admin_id=admin_id)

@router.delete("/reports/{doc_id}")
async def delete_report(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["reports"], doc_id, admin_id=admin_id)


# 8. SYSTEM SETTING COLLECTION
@router.get("/system-setting")
@router.get("/system_setting")
async def get_system_setting(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["system_setting"], admin_id=admin_id)

@router.post("/system-setting", status_code=status.HTTP_201_CREATED)
@router.post("/system_setting", status_code=status.HTTP_201_CREATED)
async def create_system_setting(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["system_setting"], payload, admin_id=admin_id)

@router.get("/system-setting/{doc_id}")
@router.get("/system_setting/{doc_id}")
async def get_system_setting_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["system_setting"], doc_id, admin_id=admin_id)

@router.put("/system-setting/{doc_id}")
@router.put("/system_setting/{doc_id}")
async def update_system_setting(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["system_setting"], doc_id, payload, admin_id=admin_id)

@router.delete("/system-setting/{doc_id}")
@router.delete("/system_setting/{doc_id}")
async def delete_system_setting(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["system_setting"], doc_id, admin_id=admin_id)


# 9. USER ACCOUNT COLLECTION
@router.get("/user-account")
@router.get("/user_account")
@router.get("/user_account.missing_children")
async def get_user_accounts(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["user_account.missing_children"], admin_id=admin_id)

@router.post("/user-account", status_code=status.HTTP_201_CREATED)
@router.post("/user_account", status_code=status.HTTP_201_CREATED)
@router.post("/user_account.missing_children", status_code=status.HTTP_201_CREATED)
async def create_user_account(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_create(db_missing["user_account.missing_children"], payload, admin_id=admin_id)

@router.get("/user-account/{doc_id}")
@router.get("/user_account/{doc_id}")
@router.get("/user_account.missing_children/{doc_id}")
async def get_user_account_by_id(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["user_account.missing_children"], doc_id, admin_id=admin_id)

@router.put("/user-account/{doc_id}")
@router.put("/user_account/{doc_id}")
@router.put("/user_account.missing_children/{doc_id}")
async def update_user_account(doc_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["user_account.missing_children"], doc_id, payload, admin_id=admin_id)

@router.delete("/user-account/{doc_id}")
@router.delete("/user_account/{doc_id}")
@router.delete("/user_account.missing_children/{doc_id}")
async def delete_user_account(doc_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["user_account.missing_children"], doc_id, admin_id=admin_id)


# 10. MISSING CHILDREN RECORDS ROUTE ALIAS (Internal Redirect to Official registered_data Collection)
@router.get("/records")
async def get_missing_children_records(admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_all(db_missing["registered_data"], admin_id=admin_id)

@router.post("/records", status_code=status.HTTP_201_CREATED)
async def report_missing_child(payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    case_id = payload.get("id") or f"MC-{int(get_server_time()['timestamp'].replace('-', '').replace(':', ''))}"
    payload["id"] = str(case_id)
    return await generic_create(db_missing["registered_data"], payload, admin_id=admin_id)

@router.get("/records/{child_id}")
async def get_missing_child_by_id(child_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_get_one(db_missing["registered_data"], child_id, admin_id=admin_id)

@router.put("/records/{child_id}")
async def update_missing_child_record(child_id: str, payload: Dict[str, Any] = Body(...), admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_update(db_missing["registered_data"], child_id, payload, admin_id=admin_id)

@router.delete("/records/{child_id}")
async def delete_missing_child_record(child_id: str, admin_id: str = Depends(get_authenticated_admin_id)):
    return await generic_delete(db_missing["registered_data"], child_id, admin_id=admin_id)


# ---------------------------------------------------------
# Overview & Health Endpoints
# ---------------------------------------------------------
@router.get("/")
async def get_missing_module_status(authorization: Optional[str] = Header(None)):
    """Overview status of Missing Children system and collection counts"""
    try:
        admin_id = None
        if authorization:
            try:
                admin_id = get_authenticated_admin_id(authorization)
            except Exception:
                pass
        filter_q = {"admin_id": admin_id} if admin_id else {}
        collections = ["add_data", "alerts", "camera_network", "children_detection", "map", "registered_data", "reports", "system_setting", "user_account", "missing_children"]
        stats = {}
        for coll in collections:
            stats[coll] = await db_missing[coll].count_documents(filter_q)
        return {
            "status": "online",
            "module": "Missing Children AI Tracking & Rescue System",
            "database": "Missing_children",
            "collection_counts": stats,
            "server_time": get_server_time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def missing_children_health_check(admin_id: str = Depends(get_authenticated_admin_id)):
    db_health = await check_database_health()
    return {
        "module": "Missing Children System",
        "database": "Missing_children",
        "db_health": db_health
    }
