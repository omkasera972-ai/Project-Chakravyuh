"""
Project Chakravyuh - Senior Backend Database Layer
FastAPI + PyMongo / Motor MongoDB Atlas Integration
"""

import os
import time
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from pymongo.errors import (
    PyMongoError,
    ConnectionFailure,
    ServerSelectionTimeoutError,
    ConfigurationError,
    OperationFailure
)

# Configure dnspython to use public DNS servers (8.8.8.8, 1.1.1.1) for reliable Atlas SRV resolution
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1', '8.8.4.4']
except Exception:
    pass

# Load environment variables (.env in backend directory or current working directory)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
load_dotenv()

# Configure Logger
logger = logging.getLogger("chakravyuh_database")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Fetch MongoDB Connection String from environment variables or fallback to Atlas connection
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URL") or "mongodb+srv://omkasera972_db_user:mongo_db_userom123@cluster0.xy8twbt.mongodb.net/"

LOCAL_DATA_DIR = os.path.join(os.path.dirname(__file__), "local_data")

# Fallback classes for local storage when cluster is offline
class LocalCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self._data = data

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return self._data[:length]
        return self._data

class LocalDeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count

class LocalCollection:
    def __init__(self, db_name: str, coll_name: str):
        self.db_name = db_name
        self.coll_name = coll_name
        self.dir_path = os.path.join(LOCAL_DATA_DIR, db_name)
        os.makedirs(self.dir_path, exist_ok=True)
        self.file_path = os.path.join(self.dir_path, f"{coll_name}.json")
        self.docs = []
        self._load()

    def _load(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.docs = json.load(f)
            except Exception:
                self.docs = []
        else:
            self.docs = []
        return self.docs

    def _save(self):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(self.docs, f, indent=2, ensure_ascii=False)

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        if "$or" in query:
            sub_queries = query["$or"]
            if not any(self._matches(doc, q) for q in sub_queries):
                return False
        for k, v in query.items():
            if k == "$or":
                continue
            if isinstance(v, dict):
                if "$in" in v and doc.get(k) not in v["$in"]:
                    return False
                if "$regex" in v:
                    import re
                    opts = v.get("$options", "")
                    flags = re.IGNORECASE if "i" in opts else 0
                    val = str(doc.get(k, "") or "")
                    if not re.search(v["$regex"], val, flags):
                        return False
            elif doc.get(k) != v:
                return False
        return True

    async def count_documents(self, filter_query: Dict[str, Any]) -> int:
        self._load()
        return len([d for d in self.docs if self._matches(d, filter_query or {})])

    def find(self, filter_query: Dict[str, Any] = None) -> LocalCursor:
        self._load()
        query = filter_query or {}
        matched = [dict(d) for d in self.docs if self._matches(d, query)]
        return LocalCursor(matched)

    async def find_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._load()
        for d in self.docs:
            if self._matches(d, filter_query or {}):
                return dict(d)
        return None

    async def insert_one(self, document: Dict[str, Any]):
        self._load()
        c = dict(document)
        self.docs.append(c)
        self._save()
        return c

    async def insert_many(self, documents: List[Dict[str, Any]]):
        self._load()
        for doc in documents:
            self.docs.append(dict(doc))
        self._save()

    async def update_one(self, filter_query: Dict[str, Any], update_cmd: Dict[str, Any], upsert: bool = False):
        self._load()
        set_fields = update_cmd.get("$set", {})
        target = None
        for d in self.docs:
            if self._matches(d, filter_query):
                target = d
                break
        if target:
            target.update(set_fields)
        elif upsert:
            new_doc = dict(filter_query)
            new_doc.update(set_fields)
            self.docs.append(new_doc)
        self._save()

    async def delete_one(self, filter_query: Dict[str, Any]) -> LocalDeleteResult:
        self._load()
        for i, d in enumerate(self.docs):
            if self._matches(d, filter_query):
                self.docs.pop(i)
                self._save()
                return LocalDeleteResult(1)
        return LocalDeleteResult(0)

    async def delete_many(self, filter_query: Dict[str, Any]) -> LocalDeleteResult:
        self._load()
        initial_len = len(self.docs)
        self.docs = [d for d in self.docs if not self._matches(d, filter_query)]
        deleted_count = initial_len - len(self.docs)
        self._save()
        return LocalDeleteResult(deleted_count)

class SmartProxyCollection:
    def __init__(self, db_name: str, coll_name: str):
        self.db_name = db_name
        self.coll_name = coll_name
        self.local_coll = LocalCollection(db_name, coll_name)

    def _get_coll(self):
        global use_local
        if use_local or client is None:
            return self.local_coll
        return client[self.db_name][self.coll_name]

    async def count_documents(self, filter_query: Dict[str, Any]) -> int:
        global use_local
        if use_local or client is None:
            return await self.local_coll.count_documents(filter_query)
        try:
            return await self._get_coll().count_documents(filter_query)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas count_documents failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.count_documents(filter_query)

    def find(self, filter_query: Dict[str, Any] = None):
        global use_local
        if use_local or client is None:
            return self.local_coll.find(filter_query)
        try:
            return self._get_coll().find(filter_query)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas find failed ({e}), switching to local storage.")
            use_local = True
            return self.local_coll.find(filter_query)

    async def find_one(self, filter_query: Dict[str, Any]):
        global use_local
        if use_local or client is None:
            return await self.local_coll.find_one(filter_query)
        try:
            return await self._get_coll().find_one(filter_query)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas find_one failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.find_one(filter_query)

    async def insert_one(self, document: Dict[str, Any]):
        global use_local
        if use_local or client is None:
            return await self.local_coll.insert_one(document)
        try:
            return await self._get_coll().insert_one(document)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas insert_one failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.insert_one(document)

    async def insert_many(self, documents: List[Dict[str, Any]]):
        global use_local
        if use_local or client is None:
            return await self.local_coll.insert_many(documents)
        try:
            return await self._get_coll().insert_many(documents)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas insert_many failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.insert_many(documents)

    async def update_one(self, filter_query: Dict[str, Any], update_cmd: Dict[str, Any], upsert: bool = False):
        global use_local
        if use_local or client is None:
            return await self.local_coll.update_one(filter_query, update_cmd, upsert=upsert)
        try:
            return await self._get_coll().update_one(filter_query, update_cmd, upsert=upsert)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas update_one failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.update_one(filter_query, update_cmd, upsert=upsert)

    async def delete_one(self, filter_query: Dict[str, Any]):
        global use_local
        if use_local or client is None:
            return await self.local_coll.delete_one(filter_query)
        try:
            return await self._get_coll().delete_one(filter_query)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas delete_one failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.delete_one(filter_query)

    async def delete_many(self, filter_query: Dict[str, Any]):
        global use_local
        if use_local or client is None:
            return await self.local_coll.delete_many(filter_query)
        try:
            return await self._get_coll().delete_many(filter_query)
        except Exception as e:
            logger.warning(f"[DB FALLBACK] Atlas delete_many failed ({e}), switching to local storage.")
            use_local = True
            return await self.local_coll.delete_many(filter_query)

class SmartProxyDatabase:
    def __init__(self, db_name: str):
        self.db_name = db_name
        self._colls: Dict[str, SmartProxyCollection] = {}

    def __getitem__(self, coll_name: str) -> SmartProxyCollection:
        if coll_name not in self._colls:
            self._colls[coll_name] = SmartProxyCollection(self.db_name, coll_name)
        return self._colls[coll_name]

# Initialize Motor Async Client for MongoDB Atlas
use_local: bool = False
client: Optional[AsyncIOMotorClient] = None

try:
    logger.info("Connecting to MongoDB Atlas Cluster with Motor Async Client...")
    client = AsyncIOMotorClient(
        MONGO_URI,
        serverSelectionTimeoutMS=2000,
        connectTimeoutMS=2000,
        socketTimeoutMS=2000,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsCAFile=certifi.where() if certifi else None,
        retryWrites=True,
        w="majority"
    )
except ConfigurationError as ce:
    logger.error(f"MongoDB Configuration Error: {ce}")
    use_local = True
except PyMongoError as pe:
    logger.error(f"PyMongo Client Error: {pe}")
    use_local = True
except Exception as e:
    logger.error(f"Unexpected Client Error: {e}")
    use_local = True

# ---------------------------------------------------------
# Export 5 Distinct Databases (Smart Proxy Enabled for Atlas + Local Fallback)
# ---------------------------------------------------------
db_attendance = SmartProxyDatabase('Attendence')
db_criminal = SmartProxyDatabase('Criminal_traking')
db_anpr = SmartProxyDatabase('ANPR_vehicle_system')
db_missing = SmartProxyDatabase('Missing_children')
db_defence = SmartProxyDatabase('Defence_tactical_system')

# Auxiliary database exports for application system compatibility
db_contacts = SmartProxyDatabase('chakravyuh_contacts')
db_users = SmartProxyDatabase('chakravyuh_users')

async def ensure_mongodb_indexes():
    """
    Ensures single/compound indexes on admin_id across all collections for <10ms query execution.
    """
    if client is None:
        return
    dbs = [db_attendance, db_criminal, db_anpr, db_missing, db_defence]
    for db in dbs:
        try:
            colls = await db.list_collection_names()
            for c in colls:
                if not c.startswith("system."):
                    await db[c].create_index([("admin_id", 1)], background=True)
        except Exception as e:
            logger.warning(f"[INDEX CREATION NOTICE] {e}")


def get_sync_client() -> pymongo.MongoClient:
    """
    Returns a synchronous PyMongo MongoClient instance.
    Useful for synchronous background scripts or seeding tasks.
    """
    return pymongo.MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsCAFile=certifi.where() if certifi else None
    )


# ---------------------------------------------------------
# Connection Health-Check Functions & Exception Handling
# ---------------------------------------------------------
async def check_database_health() -> Dict[str, Any]:
    """
    Asynchronously checks the connection status, cluster ping, and latency
    for MongoDB Atlas and all 5 distinct databases.
    """
    if client is None:
        return {
            "status": "unhealthy",
            "message": "MongoDB client is uninitialized",
            "latency_ms": None,
            "databases": {}
        }

    start_time = time.time()
    try:
        # Send ping to cluster admin database
        ping_res = await client.admin.command('ping')
        latency_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "status": "healthy",
            "message": "Successfully connected and pinged MongoDB Atlas Cluster",
            "ping": ping_res,
            "latency_ms": latency_ms,
            "databases": {
                "db_attendance": "Attendence",
                "db_criminal": "Criminal_traking",
                "db_anpr": "ANPR_vehicle_system",
                "db_missing": "Missing_children",
                "db_defence": "Defence_tactical_system"
            }
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as err:
        logger.error(f"[HEALTH-CHECK FAILED] Timeout / Network Failure: {err}")
        return {
            "status": "unhealthy",
            "message": f"Connection failure: {str(err)}",
            "latency_ms": None,
            "databases": {}
        }
    except PyMongoError as err:
        logger.error(f"[HEALTH-CHECK FAILED] PyMongo Exception: {err}")
        return {
            "status": "unhealthy",
            "message": f"Database exception: {str(err)}",
            "latency_ms": None,
            "databases": {}
        }
    except Exception as err:
        logger.error(f"[HEALTH-CHECK FAILED] Unexpected error: {err}")
        return {
            "status": "unhealthy",
            "message": f"Unexpected error: {str(err)}",
            "latency_ms": None,
            "databases": {}
        }


async def verify_db_connection(max_retries: int = 3, retry_delay: float = 1.0) -> Tuple[bool, str]:
    """
    Pings MongoDB Atlas with configurable retry logic and clean exception handling.
    """
    global use_local
    if client is None:
        use_local = True
        return False, "MongoDB client is uninitialized"

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to MongoDB Atlas (Attempt {attempt}/{max_retries})...")
            await client.admin.command('ping')
            use_local = False
            logger.info("✅ [SUCCESS] Successfully connected to MongoDB Atlas Cluster!")
            return True, "Connected to MongoDB Atlas Cloud Cluster"
        except (ConnectionFailure, ServerSelectionTimeoutError, ConfigurationError) as err:
            logger.warning(f"[ATTEMPT {attempt} FAILED] Ping failed due to network/timeout/DNS: {err}")
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
        except PyMongoError as err:
            logger.error(f"PyMongo Database Error: {err}")
            use_local = True
            return False, f"Database Error: {str(err)}"
        except Exception as err:
            logger.error(f"Unexpected Database Error: {err}")
            use_local = True
            return False, f"Unexpected Error: {str(err)}"

    logger.warning("MongoDB Atlas cluster unreachable after retries. Falling back to local storage proxy.")
    use_local = True
    return False, "Failed to connect to MongoDB Atlas Cluster after maximum retries"