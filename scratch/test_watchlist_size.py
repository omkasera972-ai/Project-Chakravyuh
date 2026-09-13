import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import asyncio
import time
from database import db_criminal

async def test_watchlist_query():
    t0 = time.perf_counter()
    cursor = db_criminal["registered_data"].find({})
    t1 = time.perf_counter()
    docs = await cursor.to_list(length=500)
    t2 = time.perf_counter()
    print(f"Find cursor created: {(t1-t0)*1000:.2f} ms")
    print(f"To list fetched ({len(docs)} docs): {(t2-t1)*1000:.2f} ms")
    total_photo_bytes = 0
    for i, d in enumerate(docs):
        photo_len = len(d.get("photoUrl") or "")
        total_photo_bytes += photo_len
        print(f"Doc {i+1}: {d.get('name')} | ID: {d.get('id')} | photoUrl length: {photo_len} chars")
    print(f"Total photo payload size: {total_photo_bytes / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    asyncio.run(test_watchlist_query())
