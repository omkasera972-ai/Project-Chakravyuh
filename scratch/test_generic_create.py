import asyncio
import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_dir)

try:
    from backend.database import LocalCollection, db_criminal  # type: ignore # pyright: ignore
    from backend.utils.crud_helper import generic_create  # type: ignore # pyright: ignore
except ImportError:
    from database import LocalCollection, db_criminal  # type: ignore # pyright: ignore
    from utils.crud_helper import generic_create  # type: ignore # pyright: ignore

async def test():
    print("Testing generic_create with LocalCollection...")
    local_coll = LocalCollection("chakravyuh_criminal", "registered_data")
    result = await generic_create(local_coll, {"name": "Test Suspect", "riskLevel": "High Risk"}, admin_id="admin_test_123")
    print("LocalCollection generic_create result:", result)
    
    print("\nTesting generic_create with SmartProxyCollection...")
    proxy_coll = db_criminal["registered_data"]
    result2 = await generic_create(proxy_coll, {"name": "Test Suspect 2", "riskLevel": "Low Risk"}, admin_id="admin_test_123")
    print("SmartProxyCollection generic_create result:", result2)

if __name__ == "__main__":
    asyncio.run(test())
