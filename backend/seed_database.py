import asyncio
import logging
from database import (
    verify_db_connection,
    db_attendance,
    db_anpr,
    db_criminal,
    db_missing,
    db_defence,
    db_users
)

logger = logging.getLogger("chakravyuh_seed")
logging.basicConfig(level=logging.INFO)

INITIAL_PERSONNEL = []
INITIAL_VEHICLES = []
INITIAL_WATCHLIST = []
INITIAL_MISSING_CHILDREN = []
INITIAL_INVENTORY = []

INITIAL_ADMINS = [
    {
        "username": "admin",
        "email": "admin@chakravyuh.gov.in",
        "password": "admin123",
        "name": "System Super Admin",
        "role": "admin",
        "is_admin": True,
        "badge": "BADGE-SUPER-ADMIN-2026",
        "clearance": "Level 5 - Super Admin Clearance"
    },
    {
        "username": "Officer_Admin",
        "email": "officer.admin@chakravyuh.gov.in",
        "password": "admin123",
        "name": "Command Officer Admin",
        "role": "admin",
        "is_admin": True,
        "badge": "BADGE-CMD-ADMIN-2026",
        "clearance": "Level 5 - Command Admin Clearance"
    }
]

async def seed_all_databases():
    """Verify 5 MongoDB Atlas databases connection"""
    connected, msg = await verify_db_connection()
    if not connected:
        logger.error(f"Cannot verify databases: {msg}")
        return False

    logger.info("[COMPLETE] All 5 MongoDB Atlas databases verified!")
    return True

if __name__ == "__main__":
    asyncio.run(seed_all_databases())
