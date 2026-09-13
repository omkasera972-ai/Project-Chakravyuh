# FastAPI Python Server for Smart Detection App (Bharat 2.0 Tech Stack)
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database Health Check & Connection Verifier
from database import check_database_health, verify_db_connection, ensure_mongodb_indexes
from seed_database import seed_all_databases

# 5 Dedicated Router Modules for Project Chakravyuh
from routers.attendance import router as attendance_router
from routers.criminal_tracking import router as criminal_router
from routers.anpr_system import router as anpr_router
from routers.missing_children import router as missing_children_router
from routers.defence_tracker import router as defence_router

# Auxiliary System Routers
from routers.auth import router as auth_router
from routers.ai_engine import router as ai_engine_router
from routers.modules import router as modules_router

logger = logging.getLogger("chakravyuh_main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(
    title="Project Chakravyuh - Bharat 2.0 AI Backend",
    description="Production-Ready FastAPI Architecture powered by PyMongo/Motor, OpenCV, YOLO, EasyOCR & MongoDB Atlas (5 Dedicated Cloud Databases)",
    version="2.0.0"
)

# Explicit CORS Middleware Setup (Fixes Vercel Cross-Origin Preflight Issues)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://project-chakravyuh.vercel.app",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Startup Event: Import and execute database health check on startup
@app.on_event("startup")
async def startup_db_event():
    logger.info("[STARTUP] Initializing Project Chakravyuh Backend Services...")
    logger.info("[STARTUP] Checking MongoDB Atlas cluster connectivity...")
    
    is_connected, message = await verify_db_connection(max_retries=1)
    logger.info(f"[STARTUP] MongoDB Atlas Connection Status: {message}")

    # Build background MongoDB Atlas indexes on admin_id for <10ms queries
    import asyncio
    asyncio.create_task(ensure_mongodb_indexes())

    # Run Database Health Check report
    health_status = await check_database_health()
    logger.info(f"[STARTUP] Database Health Report: {health_status}")

    # Verify and seed initial database state
    await seed_all_databases()

# Register all 5 dedicated router modules with proper API prefixes
app.include_router(attendance_router, prefix="/api/attendance", tags=["Attendance Module"])
app.include_router(criminal_router, prefix="/api/criminal", tags=["Criminal Tracking Module"])
app.include_router(anpr_router, prefix="/api/anpr", tags=["ANPR System Module"])
app.include_router(missing_children_router, prefix="/api/missing-children", tags=["Missing Children Module"])
app.include_router(defence_router, prefix="/api/defence", tags=["Defence Tracker Module"])

# Register auxiliary system routers (their prefixes are already defined in the router files)
app.include_router(auth_router)
app.include_router(ai_engine_router)
app.include_router(modules_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "Project Chakravyuh - Multi-Module AI Gateway",
        "tech_stack": [
            "Python 3.10+",
            "FastAPI Async ASGI Framework",
            "PyMongo / Motor Async MongoDB Driver",
            "MongoDB Atlas (5 Dedicated Databases)",
            "OpenCV & YOLO AI Inference Engine",
            "EasyOCR ANPR Scanner"
        ],
        "version": "2.0.0",
        "endpoints": {
            "attendance": "/api/attendance",
            "criminal_tracking": "/api/criminal",
            "anpr_system": "/api/anpr",
            "missing_children": "/api/missing-children",
            "defence_tracker": "/api/defence",
            "auth": "/api/auth",
            "system_health": "/api/health"
        }
    }

@app.get("/api/health")
async def system_health_check():
    """System-wide health check endpoint returning status of all 5 MongoDB databases"""
    db_health = await check_database_health()
    return {
        "app": "Project Chakravyuh",
        "status": "online",
        "database_health": db_health
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)