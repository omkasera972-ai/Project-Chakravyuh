"""
Project Chakravyuh - Generic Async CRUD Helper Utility
FastAPI + Motor / PyMongo MongoDB Integration
"""

from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

IST_TZ = timezone(timedelta(hours=5, minutes=30))

def get_server_time():
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc.astimezone(IST_TZ)
    return {
        "timestamp": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "formatted_date": now_ist.strftime("%d %b %Y"),
        "formatted_time": now_ist.strftime("%I:%M:%S %p IST"),
        "full_datetime": now_ist.strftime("%d %b %Y, %I:%M:%S %p IST")
    }

from datetime import datetime, date, timezone, timedelta

def serialize_doc(doc: Any) -> Any:
    """Recursively convert MongoDB ObjectId, datetime, date, and non-serializable objects to standard JSON serializable values."""
    if doc is None:
        return None
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "_id":
                cleaned["_id"] = str(v)
            else:
                cleaned[k] = serialize_doc(v)
        return cleaned
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc

def serialize_docs(docs: List[Any]) -> List[Any]:
    return [serialize_doc(d) for d in docs if d is not None]

from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException, Header

IST_TZ = timezone(timedelta(hours=5, minutes=30))

def get_server_time():
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc.astimezone(IST_TZ)
    return {
        "timestamp": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "formatted_date": now_ist.strftime("%d %b %Y"),
        "formatted_time": now_ist.strftime("%I:%M:%S %p IST"),
        "full_datetime": now_ist.strftime("%d %b %Y, %I:%M:%S %p IST")
    }

from datetime import datetime, date, timezone, timedelta

def serialize_doc(doc: Any) -> Any:
    """Recursively convert MongoDB ObjectId, datetime, date, and non-serializable objects to standard JSON serializable values."""
    if doc is None:
        return None
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "_id":
                cleaned["_id"] = str(v)
            else:
                cleaned[k] = serialize_doc(v)
        return cleaned
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc

def serialize_docs(docs: List[Any]) -> List[Any]:
    return [serialize_doc(d) for d in docs if d is not None]

def get_authenticated_admin_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate authenticated admin_id solely from the Bearer token.
    NEVER trust admin_id passed by frontend in request payload or query string.
    """
    from routers.auth import verify_admin_token
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token missing in Authorization header")
    payload = verify_admin_token(authorization)
    if not payload or not payload.get("admin_id"):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired admin authentication token")
    return payload["admin_id"]

async def find_doc_by_id(collection, doc_id: str, admin_id: Optional[str] = None) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """Helper to query MongoDB collection by ObjectId or string id, scoped strictly to admin_id if provided."""
    id_conds = []
    if ObjectId.is_valid(doc_id):
        id_conds.append({"_id": ObjectId(doc_id)})
    id_conds.extend([{"_id": doc_id}, {"id": doc_id}, {"camera_id": doc_id}, {"officer_id": doc_id}])

    if admin_id:
        query = {"admin_id": admin_id, "$or": id_conds}
    else:
        query = {"$or": id_conds}

    doc = await collection.find_one(query)
    return doc, query

async def generic_get_all(collection, limit: int = 500, query_filter: Optional[Dict[str, Any]] = None, admin_id: Optional[str] = None) -> Dict[str, Any]:
    try:
        if collection is None:
            return {"status": "success", "count": 0, "data": []}
        filter_q = dict(query_filter) if query_filter is not None else {}
        if admin_id:
            if "$or" not in filter_q:
                filter_q["$or"] = [
                    {"admin_id": admin_id},
                    {"admin_id": None},
                    {"admin_id": "None"},
                    {"admin_id": ""},
                    {"admin_id": {"$exists": False}}
                ]
            else:
                filter_q["admin_id"] = admin_id
        cursor = collection.find(filter_q)
        docs = await cursor.to_list(length=limit)
        serialized = serialize_docs(docs)
        return {"status": "success", "count": len(serialized), "data": serialized}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

async def generic_get_one(collection, doc_id: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
    try:
        doc, _ = await find_doc_by_id(collection, doc_id, admin_id=admin_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID '{doc_id}' not found")
        return {"status": "success", "data": serialize_doc(doc)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fetch error: {str(e)}")

async def generic_create(collection, payload: Dict[str, Any], admin_id: str) -> Dict[str, Any]:
    if not payload:
        raise HTTPException(status_code=400, detail="Insert payload cannot be empty")
    if not admin_id:
        raise HTTPException(status_code=401, detail="Unauthorized: admin_id required for data creation")
    try:
        doc_data = dict(payload)
        server_time = get_server_time()
        # ALWAYS enforce admin_id from token
        doc_data["admin_id"] = admin_id
        doc_data["created_at"] = doc_data.get("created_at") or server_time["full_datetime"]
        doc_data["updated_at"] = server_time["full_datetime"]
        doc_data["timestamp"] = doc_data.get("timestamp") or server_time["timestamp"]

        res = await collection.insert_one(doc_data)
        doc_data["_id"] = str(res.inserted_id)
        return {"status": "success", "message": "Document created successfully", "data": serialize_doc(doc_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")

async def generic_update(collection, doc_id: str, payload: Dict[str, Any], admin_id: Optional[str] = None) -> Dict[str, Any]:
    if not payload:
        raise HTTPException(status_code=400, detail="Update payload cannot be empty")
    try:
        server_time = get_server_time()
        update_data = dict(payload)
        update_data["updated_at"] = server_time["full_datetime"]
        # Protect admin_id from being overwritten by payload
        if "admin_id" in update_data and admin_id:
            update_data["admin_id"] = admin_id

        doc, query = await find_doc_by_id(collection, doc_id, admin_id=admin_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID '{doc_id}' not found")

        await collection.update_one(query, {"$set": update_data})
        updated_doc, _ = await find_doc_by_id(collection, doc_id, admin_id=admin_id)
        return {"status": "success", "message": "Document updated successfully", "data": serialize_doc(updated_doc)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database update error: {str(e)}")

async def generic_delete(collection, doc_id: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
    try:
        doc, query = await find_doc_by_id(collection, doc_id, admin_id=admin_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document with ID '{doc_id}' not found")

        res = await collection.delete_one(query)
        return {"status": "success", "message": f"Deleted {res.deleted_count} document(s)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database delete error: {str(e)}")

