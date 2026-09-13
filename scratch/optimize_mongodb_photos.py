import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import asyncio
import time
import base64
import numpy as np
import cv2

try:
    from backend.database import db_criminal
except ImportError:
    from database import db_criminal  # type: ignore # noqa: E402

def compress_base64_image_cv2(base64_str, max_dim=400, quality=70):
    if not base64_str or not isinstance(base64_str, str) or not base64_str.startswith('data:image'):
        return base64_str
    try:
        header, encoded = base64_str.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return base64_str
            
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            
        _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        new_encoded = base64.b64encode(buf).decode('utf-8')
        return f"data:image/jpeg;base64,{new_encoded}"
    except Exception as e:
        print(f"Error compressing image: {e}")
        return base64_str

async def optimize_watchlist_photos():
    print("--- OPTIMIZING OVERSIZED PHOTOS IN MONGODB ATLAS WITH CV2 ---")
    cursor = db_criminal["registered_data"].find({})
    docs = await cursor.to_list(length=500)
    
    updated_count = 0
    for doc in docs:
        photo = doc.get("photoUrl") or ""
        if len(photo) > 100000:  # > 100 KB
            orig_len = len(photo)
            compressed_photo = compress_base64_image_cv2(photo, max_dim=350, quality=65)
            new_len = len(compressed_photo)
            print(f"Optimizing {doc.get('name')} ({doc.get('id')}): {orig_len/1024:.1f} KB -> {new_len/1024:.1f} KB")
            await db_criminal["registered_data"].update_one(
                {"_id": doc["_id"]},
                {"$set": {"photoUrl": compressed_photo}}
            )
            updated_count += 1
            
    print(f"[SUCCESS] Optimization complete! Updated {updated_count} documents in MongoDB Atlas.")

if __name__ == "__main__":
    asyncio.run(optimize_watchlist_photos())
