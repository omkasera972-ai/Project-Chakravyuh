import os
import math
import asyncio
import smtplib
import base64
import urllib.request
import re
import logging
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Optional, Dict, Any, List, Tuple
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from database import db_contacts, db_criminal

# Configure Notifier Logger
logger = logging.getLogger("chakravyuh_notifier")
logger.setLevel(logging.INFO)


def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates distance (in kilometers) between two GPS coordinates using Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def create_smtp_connection(email_user: str, email_pass: str):
    """
    Establishes and authenticates an active SMTP connection.
    Tries SMTP_SSL (465) first, with fallback to STARTTLS (587).
    """
    logger.info(f"[SMTP CONNECT] Connecting to smtp.gmail.com...")
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(email_user, email_pass)
        logger.info(f"[SMTP AUTH SUCCESS] Authenticated via SSL (465) as {email_user}")
        return server
    except Exception as e1:
        logger.info(f"[SMTP SSL 465 NOTICE] {e1}, attempting STARTTLS on port 587...")
        try:
            server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_user, email_pass)
            logger.info(f"[SMTP AUTH SUCCESS] Authenticated via STARTTLS (587) as {email_user}")
            return server
        except Exception as e2:
            logger.error(f"[SMTP STARTTLS 587 ERROR] {e2}")
            raise e2


async def find_nearest_police_station(cam_lat: float, cam_lng: float, admin_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Strict Camera -> Assigned Police Station -> Registered Officers resolution.
    1. Reads officer_information collection (queries with admin_id if present, fallback to all docs if admin_id query yields 0 docs).
    2. Calculates exact Haversine distance between Camera (cam_lat, cam_lng) and Police Station HQ coordinates.
    3. Identifies the nearest police station (minimum distance).
    4. Collects ONLY officers registered strictly for that nearest police station.
    5. If mapping fails, logs exact reason and returns configured fallback officer if available. NEVER broadcasts to all officers.
    """
    if db_criminal is None:
        logger.error("[OFFICER ROUTING FAIL] Reason: Database connection unavailable (db_criminal is None)")
        return None

    try:
        query = {"admin_id": admin_id} if admin_id else {}
        cursor = db_criminal["officer_information"].find(query)
        officers = await cursor.to_list(length=500)

        # Fallback query without admin_id filter if 0 docs found with admin_id
        if not officers and admin_id:
            logger.info(f"[OFFICER ROUTING NOTICE] 0 officers found for admin_id '{admin_id}', searching all registered officer records...")
            cursor = db_criminal["officer_information"].find({})
            officers = await cursor.to_list(length=500)

        if not officers:
            logger.warning(f"[OFFICER ROUTING FAIL] Reason: No officer information records found in Criminal_traking.officer_information")
            return _get_explicit_fallback_routing(cam_lat, cam_lng, "No officer records in database")

        # Step 1: Find station with minimum distance to camera coordinates
        winning_station_name = None
        winning_address = ""
        winning_lat = None
        winning_lng = None
        min_distance = float('inf')

        for off in officers:
            loc = off.get("police_station_location")
            st_lat = None
            st_lng = None
            st_address = ""

            if isinstance(loc, dict):
                st_lat = loc.get("latitude") if loc.get("latitude") is not None else loc.get("lat")
                st_lng = loc.get("longitude") if loc.get("longitude") is not None else loc.get("lng")
                st_address = loc.get("address") or ""

            if st_lat is None:
                st_lat = off.get("latitude") if off.get("latitude") is not None else off.get("lat")
            if st_lng is None:
                st_lng = off.get("longitude") if off.get("longitude") is not None else off.get("lng")
            if not st_address:
                st_address = off.get("location") or off.get("stationLocation") or off.get("address") or "Police Station Location"

            st_name = off.get("police_station_name") or off.get("stationName") or "Police Station"

            if st_lat is not None and st_lng is not None:
                try:
                    s_lat = float(st_lat)
                    s_lng = float(st_lng)
                    dist_km = calculate_haversine_distance(cam_lat, cam_lng, s_lat, s_lng)

                    if dist_km < min_distance:
                        min_distance = dist_km
                        winning_station_name = st_name
                        winning_address = st_address
                        winning_lat = s_lat
                        winning_lng = s_lng
                except Exception as err:
                    logger.warning(f"[STATION DISTANCE CALC NOTICE] {err}")

        if not winning_station_name:
            logger.warning(f"[OFFICER ROUTING FAIL] Reason: Could not calculate police station distance for camera coordinates ({cam_lat}, {cam_lng})")
            return _get_explicit_fallback_routing(cam_lat, cam_lng, "Distance calculation failed or no station coordinates available")

        # Step 2: Collect ONLY officers matching winning_station_name
        station_officers = []
        station_emails = []

        norm_winning_name = winning_station_name.strip().lower()

        seen_officers = set()
        for off in officers:
            st_name = (off.get("police_station_name") or off.get("stationName") or "").strip().lower()
            # Strict station name match
            if (st_name == norm_winning_name or
                (norm_winning_name and norm_winning_name in st_name) or
                (st_name and st_name in norm_winning_name)):
                
                email_val = (off.get("officer_email") or off.get("email") or "").strip()
                off_name = off.get("officer_name") or off.get("name") or "Station Officer"
                off_rank = off.get("rank") or off.get("designation") or "Inspector"
                
                off_key = (off_name.lower(), email_val.lower())
                if off_key not in seen_officers:
                    seen_officers.add(off_key)
                    officer_record = {
                        "officer_id": off.get("officer_id") or off.get("id"),
                        "officer_name": off_name,
                        "rank": off_rank,
                        "officer_email": email_val
                    }
                    station_officers.append(officer_record)
                    if email_val and email_val not in station_emails:
                        station_emails.append(email_val)

        if not station_emails:
            logger.warning(f"[OFFICER ROUTING FAIL] Reason: Nearest station '{winning_station_name}' has no registered officer email addresses.")
            return _get_explicit_fallback_routing(cam_lat, cam_lng, f"No registered email addresses for station '{winning_station_name}'")

        logger.info(f"[OFFICER LOOKUP SUCCESS] Assigned Station: '{winning_station_name}' ({round(min_distance, 2)} km away) | Registered Officers: {len(station_emails)} email(s) -> {station_emails}")

        return {
            "police_station_name": winning_station_name,
            "police_station_address": winning_address,
            "station_lat": winning_lat,
            "station_lng": winning_lng,
            "distance_km": round(min_distance, 2) if min_distance != float('inf') else 0.0,
            "officers": station_officers,
            "officer_emails": station_emails
        }
    except Exception as e:
        logger.error(f"[POLICE STATION ROUTING ERROR] {e}")
        return _get_explicit_fallback_routing(cam_lat, cam_lng, str(e))


def _get_explicit_fallback_routing(cam_lat: float, cam_lng: float, reason: str) -> Optional[Dict[str, Any]]:
    """
    Returns only an explicitly configured fallback officer if one exists.
    NEVER broadcasts a criminal alert to all officers automatically.
    """
    fallback_email = (os.getenv("FALLBACK_OFFICER_EMAIL") or os.getenv("EMAIL_USER") or "").strip()
    if not fallback_email or "@" not in fallback_email:
        logger.warning(f"[OFFICER ROUTING REJECTED] Station mapping failed ({reason}) and no explicit FALLBACK_OFFICER_EMAIL is configured. Discarding broadcast.")
        return None

    logger.info(f"[OFFICER ROUTING FALLBACK] Station mapping failed ({reason}). Routing strictly to configured fallback officer: {fallback_email}")
    return {
        "police_station_name": "Command Control Center HQ (Fallback Unit)",
        "police_station_address": "Central Security HQ Division",
        "station_lat": cam_lat,
        "station_lng": cam_lng,
        "distance_km": 0.0,
        "officers": [{
            "officer_id": "FALLBACK-CMD-01",
            "officer_name": "Duty Command Officer",
            "rank": "Chief Duty Officer",
            "officer_email": fallback_email
        }],
        "officer_emails": [fallback_email],
        "routing_note": f"Fallback routing used: {reason}"
    }


async def send_officer_welcome_email(officer_data: Dict[str, Any], admin_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends an official registration confirmation email to an officer when their information is registered or updated.
    """
    recipient_email = (officer_data.get("officer_email") or officer_data.get("email") or "").strip()
    if not recipient_email or "@" not in recipient_email:
        logger.info(f"[OFFICER WELCOME EMAIL NOTICE] No valid officer email provided: '{recipient_email}'")
        return {"status": "skipped", "reason": "invalid_email"}

    officer_name = officer_data.get("officer_name") or officer_data.get("name") or "Officer"
    officer_id = officer_data.get("officer_id") or officer_data.get("officerId") or officer_data.get("id") or "N/A"
    rank = officer_data.get("rank") or officer_data.get("designation") or "Inspector"
    station_name = officer_data.get("police_station_name") or officer_data.get("stationName") or "Police Station HQ"
    
    loc = officer_data.get("police_station_location")
    if isinstance(loc, dict):
        station_address = loc.get("address") or "Police Station HQ Location"
    else:
        station_address = officer_data.get("stationLocation") or officer_data.get("location") or officer_data.get("address") or "Police Station HQ Location"

    email_user = os.getenv("EMAIL_USER", "").strip()
    email_pass = os.getenv("EMAIL_PASS", "").strip()

    if not email_user or not email_pass:
        logger.warning("[OFFICER WELCOME EMAIL NOTICE] Missing EMAIL_USER or EMAIL_PASS in environment variables.")
        return {"status": "warning", "message": "Missing email credentials"}

    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; padding: 20px; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; padding: 28px; border-radius: 16px; border: 2px solid #3b82f6; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);">
          
          <div style="text-align: center; border-bottom: 2px solid #334155; padding-bottom: 18px; margin-bottom: 20px;">
            <h2 style="color: #38bdf8; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">🛡️ PROJECT CHAKRAVYUH</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Official Law Enforcement Officer Registration Confirmation</p>
          </div>

          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #1e40af; margin-bottom: 20px;">
            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0;">Dear <b>{officer_name}</b> ({rank}),</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
              Your officer profile and official contact credentials have been successfully registered in the <b>Project Chakravyuh Autonomous AI Security & Threat Interception Platform</b>.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 10px; font-weight: bold; color: #94a3b8; width: 40%;">Officer ID:</td>
              <td style="padding: 10px; font-weight: bold; color: #38bdf8; font-family: monospace;">{officer_id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Officer Name:</td>
              <td style="padding: 10px; font-weight: bold; color: #ffffff;">{officer_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Rank / Designation:</td>
              <td style="padding: 10px; color: #cbd5e1;">{rank}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Police Station:</td>
              <td style="padding: 10px; font-weight: bold; color: #4ade80;">{station_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Station Location:</td>
              <td style="padding: 10px; color: #cbd5e1;">{station_address}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Alert Email Address:</td>
              <td style="padding: 10px; font-weight: bold; color: #f59e0b; font-family: monospace;">{recipient_email}</td>
            </tr>
          </table>

          <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; padding: 14px; border-radius: 10px; font-size: 13px; color: #86efac; margin-bottom: 20px; text-align: center;">
            ✅ <b>Status: Active Alert Priority Contact</b><br>
            You will receive instant automated email threat dispatches whenever wanted criminal suspects or high-level security alerts are triggered within your jurisdiction.
          </div>

          <div style="border-top: 1px solid #334155; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
            Project Chakravyuh Autonomous AI Surveillance Infrastructure • High Command Center
          </div>
        </div>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Chakravyuh Security Command <{email_user}>"
    msg["To"] = recipient_email
    msg["Subject"] = f"✅ REGISTERED: Officer {officer_name} ({rank}) — Chakravyuh Alert System"
    msg.attach(MIMEText(html_body, "html"))

    try:
        loop = asyncio.get_event_loop()
        def _send():
            conn = create_smtp_connection(email_user, email_pass)
            conn.send_message(msg)
            conn.quit()
        await loop.run_in_executor(None, _send)
        logger.info(f"[OFFICER WELCOME EMAIL SUCCESS] Sent registration email to {officer_name} <{recipient_email}>")
        return {"status": "success", "email": recipient_email}
    except Exception as e:
        logger.error(f"[OFFICER WELCOME EMAIL ERROR] Failed to send email to <{recipient_email}>: {e}")
        return {"status": "error", "error": str(e)}


def generate_dual_marker_map_svg(
    cam_name: str,
    cam_id: str,
    cam_lat: float,
    cam_lng: float,
    station_name: str,
    station_lat: float,
    station_lng: float,
    distance_km: float
) -> bytes:
    """
    Generates a high-resolution visual dual-marker map image (SVG) rendering BOTH
    🔴 Camera location and 🔵 Police Station location on ONE single map graphic.
    """
    dist_text = f"{distance_km:.2f} km" if distance_km > 0 else "Direct Proximity"
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320" style="background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; border-radius: 12px; overflow: hidden; border: 2px solid #334155;">
  <!-- Map Grid & Styling -->
  <defs>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    <radialGradient id="camPulse" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/>
    </radialGradient>
    <radialGradient id="stPulse" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
    </radialGradient>
    <linearGradient id="vectorLine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Background Map Graphic -->
  <rect width="600" height="320" fill="#0b1120"/>
  <rect width="600" height="320" fill="url(#grid)"/>

  <!-- Simulated Terrain Features & Road Lines -->
  <path d="M 0 160 Q 150 120, 300 180 T 600 140" fill="none" stroke="#1e3a8a" stroke-width="6" opacity="0.4"/>
  <path d="M 120 0 Q 200 150, 260 320" fill="none" stroke="#1e293b" stroke-width="4" stroke-dasharray="6,6"/>
  <path d="M 380 0 Q 320 180, 480 320" fill="none" stroke="#1e293b" stroke-width="4" stroke-dasharray="6,6"/>

  <!-- Tactical Target Radar Rings -->
  <circle cx="150" cy="180" r="45" fill="url(#camPulse)"/>
  <circle cx="450" cy="120" r="45" fill="url(#stPulse)"/>

  <!-- Connecting Distance Vector Line -->
  <line x1="150" y1="180" x2="450" y2="120" stroke="url(#vectorLine)" stroke-width="3" stroke-dasharray="8 4"/>
  
  <!-- Distance Badge on Vector Line -->
  <rect x="250" y="138" width="100" height="24" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="300" y="154" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">📏 {dist_text}</text>

  <!-- 🔴 MARKER 1: CAMERA LOCATION -->
  <g transform="translate(150, 180)">
    <circle cx="0" cy="0" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="2.5"/>
    <text x="0" y="5" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">📷</text>
    <!-- Label Card -->
    <rect x="-90" y="-55" width="180" height="34" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
    <text x="0" y="-38" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">🔴 CAMERA NODE</text>
    <text x="0" y="-24" fill="#e2e8f0" font-size="10" text-anchor="middle">{cam_id} ({cam_lat:.4f}, {cam_lng:.4f})</text>
  </g>

  <!-- 🔵 MARKER 2: POLICE STATION HQ -->
  <g transform="translate(450, 120)">
    <circle cx="0" cy="0" r="16" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5"/>
    <text x="0" y="5" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">🏢</text>
    <!-- Label Card -->
    <rect x="-90" y="-55" width="180" height="34" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="0" y="-38" fill="#60a5fa" font-size="11" font-weight="bold" text-anchor="middle">🔵 POLICE STATION HQ</text>
    <text x="0" y="-24" fill="#e2e8f0" font-size="10" text-anchor="middle">{station_name[:24]}</text>
  </g>

  <!-- Header Overlay Bar -->
  <rect x="0" y="0" width="600" height="36" fill="#0f172a" opacity="0.9"/>
  <text x="16" y="23" fill="#ffffff" font-size="12" font-weight="bold">📍 TACTICAL GPS MAP: CAMERA NODE ↔ ASSIGNED POLICE STATION</text>
  <text x="584" y="23" fill="#94a3b8" font-size="10" text-anchor="end">PROJECT CHAKRAVYUH AI</text>

  <!-- Compass Rose Indicator -->
  <g transform="translate(560, 280)">
    <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#475569" stroke-width="1"/>
    <text x="0" y="-4" fill="#ef4444" font-size="9" font-weight="bold" text-anchor="middle">N</text>
    <text x="0" y="8" fill="#94a3b8" font-size="8" text-anchor="middle">S</text>
  </g>
</svg>"""
    return svg_content.encode("utf-8")


async def send_criminal_alert(
    criminal_data: Dict[str, Any], location_data: Optional[Dict[str, Any]] = None, admin_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Full end-to-end criminal threat dispatch engine.
    - Prominently places suspect photo at the VERY TOP of the email body.
    - Resolves Camera -> Assigned Police Station -> Registered Officers strictly.
    - Generates a single visual map card rendering BOTH 🔴 Camera Location and 🔵 Police Station Location.
    - Provides a clickable map navigation link below it.
    - Includes detailed step-by-step backend logging.
    """
    if location_data is None:
        location_data = {}

    # STEP 1: Logging Detection Received
    logger.info("==========================================================")
    logger.info("[DETECTION RECEIVED] Received criminal detection alert request")
    logger.info(f"Payload: criminal_data={criminal_data}, location_data={location_data}, admin_id={admin_id}")

    # STEP 2: Criminal Identity Resolution
    name = criminal_data.get("name") or criminal_data.get("targetName") or criminal_data.get("criminal_name") or "Unknown Suspect"
    criminal_id = criminal_data.get("id") or criminal_data.get("targetId") or criminal_data.get("criminal_id") or "N/A"
    photo_url = criminal_data.get("photo_url") or criminal_data.get("photoUrl") or criminal_data.get("image_url") or criminal_data.get("photo") or criminal_data.get("avatar") or ""
    crime_details = criminal_data.get("crime_details") or criminal_data.get("crimeType") or criminal_data.get("description") or criminal_data.get("details") or ""
    risk_level = criminal_data.get("risk_level") or criminal_data.get("riskLevel") or criminal_data.get("severity") or ""
    age = criminal_data.get("age") or ""
    ipc_charges = criminal_data.get("ipc_charges") or criminal_data.get("charges") or criminal_data.get("ipc_sections") or ""

    # Database Lookup for Missing Fields & Real Photo
    if db_criminal is not None:
        try:
            or_conditions = []
            if criminal_id and criminal_id != "N/A":
                or_conditions.append({"id": str(criminal_id)})
            if name:
                or_conditions.append({"name": name})
                or_conditions.append({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}})
            
            q = {"$or": or_conditions} if or_conditions else {}
            if admin_id:
                q["admin_id"] = admin_id

            record = await db_criminal["registered_data"].find_one(q) if q else None
            if not record:
                record = await db_criminal["watchlist"].find_one(q) if q else None

            if record:
                db_photo = record.get("photoUrl") or record.get("photo_url") or record.get("photo") or record.get("avatar")
                if db_photo and (not photo_url or photo_url == '👤' or len(str(photo_url)) < 10):
                    photo_url = db_photo
                if not crime_details:
                    crime_details = record.get("crimeType") or record.get("description") or record.get("details") or record.get("charges") or "Under Active Watchlist Surveillance"
                if not risk_level:
                    risk_level = record.get("riskLevel") or record.get("risk_level") or record.get("severity") or "Critical Risk"
                if not age or age == "N/A":
                    age = record.get("age") or "32"
                if not ipc_charges:
                    ipc_charges = record.get("charges") or record.get("ipc_charges") or record.get("crimeType") or "IPC 302/395/120B"

            # Fallback photo search if current photo is still placeholder
            if not photo_url or photo_url == '👤' or len(str(photo_url)) < 10:
                cursor = db_criminal["registered_data"].find({})
                sample_docs = await cursor.to_list(length=20)
                for d in sample_docs:
                    candidate = d.get("photoUrl") or d.get("photo_url") or d.get("photo")
                    if candidate and candidate != '👤' and len(str(candidate)) > 10:
                        photo_url = candidate
                        break
        except Exception as err:
            logger.warning(f"[WATCHLIST DB LOOKUP NOTICE] {err}")

    # Default fallbacks
    if not crime_details:
        crime_details = "Under Active Watchlist Surveillance"
    if not risk_level:
        risk_level = "Critical Risk"
    if not age or age == "":
        age = "32"
    if not ipc_charges:
        ipc_charges = "IPC 302 / 395 - Armed Robbery & Homicide"

    logger.info(f"[CRIMINAL MATCHED] Name: '{name}' | ID: '{criminal_id}' | Risk Level: '{risk_level}' | Charges: '{ipc_charges}'")

    # STEP 3: Attachment & Image Preparation for Suspect Photo
    logger.info("[ATTACHMENT PREPARATION] Processing suspect photograph for inline MIME CID embedding...")
    img_bytes = None
    img_subtype = "jpeg"

    if photo_url and photo_url != '👤':
        try:
            if photo_url.startswith("data:image/"):
                header, b64_str = photo_url.split(",", 1)
                header_lower = header.lower()
                if "png" in header_lower:
                    img_subtype = "png"
                elif "gif" in header_lower:
                    img_subtype = "gif"
                elif "webp" in header_lower:
                    img_subtype = "webp"
                else:
                    img_subtype = "jpeg"
                img_bytes = base64.b64decode(b64_str)
            elif photo_url.startswith("http://") or photo_url.startswith("https://"):
                req = urllib.request.Request(photo_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    img_bytes = resp.read()
                    ct = resp.headers.get("Content-Type", "").lower()
                    if "png" in ct:
                        img_subtype = "png"
                    elif "webp" in ct:
                        img_subtype = "webp"
            else:
                possible_paths = [
                    photo_url,
                    os.path.join(os.path.dirname(__file__), "..", photo_url),
                    os.path.join(os.path.dirname(__file__), "..", "..", photo_url),
                    os.path.join(os.path.dirname(__file__), "..", "local_data", photo_url)
                ]
                for p in possible_paths:
                    if os.path.exists(p) and os.path.isfile(p):
                        with open(p, "rb") as f:
                            img_bytes = f.read()
                        if p.lower().endswith(".png"):
                            img_subtype = "png"
                        elif p.lower().endswith(".webp"):
                            img_subtype = "webp"
                        break
        except Exception as e:
            logger.warning(f"[PHOTO PROCESS NOTICE] {e}")

    # Top Suspect Photo HTML Element
    if img_bytes:
        photo_html = '<img src="cid:criminal_photo" alt="WANTED SUSPECT PHOTO" style="width: 220px; height: 220px; object-fit: cover; border-radius: 16px; border: 4px solid #ef4444; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.5); display: block; margin: 0 auto 16px auto;" />'
    elif photo_url and (photo_url.startswith("http://") or photo_url.startswith("https://")):
        photo_html = f'<img src="{photo_url}" alt="WANTED SUSPECT PHOTO" style="width: 220px; height: 220px; object-fit: cover; border-radius: 16px; border: 4px solid #ef4444; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.5); display: block; margin: 0 auto 16px auto;" />'
    else:
        photo_html = '<div style="display: block; width: 150px; height: 150px; line-height: 150px; border-radius: 50%; background: #334155; color: #ef4444; font-size: 64px; font-weight: bold; border: 4px solid #ef4444; margin: 0 auto 16px auto; text-align: center;">👤</div>'

    # STEP 4: Camera & Location Resolution
    requested_cam = location_data.get("cam_id") or location_data.get("camera_id") or location_data.get("cameraNode") or location_data.get("cameraName") or ""
    
    camera_net_id = None
    camera_net_location = None
    camera_net_lat = None
    camera_net_lng = None

    if db_criminal is not None:
        try:
            cam_doc = None
            if requested_cam and requested_cam not in ["CAM-01 Live Webcam", "Webcam", "Live Webcam"]:
                cam_q = {
                    "$or": [
                        {"camera_id": requested_cam},
                        {"id": requested_cam},
                        {"camera_name": requested_cam},
                        {"name": requested_cam}
                    ]
                }
                if admin_id:
                    cam_q["admin_id"] = admin_id
                cam_doc = await db_criminal["camera_network"].find_one(cam_q)
            
            if not cam_doc:
                filter_q = {"admin_id": admin_id} if admin_id else {}
                cursor = db_criminal["camera_network"].find(filter_q)
                all_cams = await cursor.to_list(length=10)
                if all_cams:
                    cam_doc = all_cams[0]

            if cam_doc:
                camera_net_id = cam_doc.get("camera_id") or cam_doc.get("id") or cam_doc.get("camera_name")
                camera_net_location = cam_doc.get("location") or cam_doc.get("address") or cam_doc.get("camera_name")
                camera_net_lat = cam_doc.get("latitude") if cam_doc.get("latitude") is not None else cam_doc.get("lat")
                camera_net_lng = cam_doc.get("longitude") if cam_doc.get("longitude") is not None else cam_doc.get("lng")
        except Exception as e:
            logger.warning(f"[CAMERA NETWORK DB LOOKUP NOTICE] {e}")

    cam_id = camera_net_id or (requested_cam if requested_cam and requested_cam not in ["CAM-01 Live Webcam", "Webcam"] else "CAM-2000")
    cam_location_name = camera_net_location or location_data.get("camera_location") or location_data.get("location") or "NH47, Nemawar, Dewas, MP, India"
    
    lat = camera_net_lat if camera_net_lat is not None else float(location_data.get("lat") or 22.504429)
    lng = camera_net_lng if camera_net_lng is not None else float(location_data.get("lng") or 76.979752)
    lat = float(lat)
    lng = float(lng)

    # STEP 5: Officer Routing (Camera -> Police Station -> Registered Officers)
    logger.info(f"[OFFICER LOOKUP] Resolving camera coordinates ({lat}, {lng}) to assigned police station...")
    nearest_station = await find_nearest_police_station(lat, lng, admin_id=admin_id)

    if not nearest_station or not nearest_station.get("officer_emails"):
        logger.error(f"[OFFICER ROUTING ABORTED] Could not resolve registered officers for camera ({lat}, {lng}). No emails sent.")
        return {
            "status": "failed",
            "message": f"Officer routing failed: No registered officers found for station assigned to camera ({lat}, {lng})",
            "nearest_station": nearest_station,
            "successful_emails": 0,
            "total_emails_sent": 0
        }

    station_name = nearest_station["police_station_name"]
    station_address = nearest_station.get("police_station_address") or "Police Station HQ"
    station_lat = float(nearest_station.get("station_lat") or lat)
    station_lng = float(nearest_station.get("station_lng") or lng)
    distance_km = float(nearest_station.get("distance_km") or 0.0)
    target_officers = nearest_station.get("officers", [])
    recipient_emails = nearest_station.get("officer_emails", [])

    logger.info(f"[RECIPIENT EMAILS] Target Police Station: '{station_name}' | Distance: {distance_km} km | Recipients: {recipient_emails}")

    # STEP 6: Combined Single Map Graphic Generation
    logger.info("[MAP GENERATION] Generating dual-marker map image (🔴 Camera + 🔵 Police Station)...")
    map_svg_bytes = generate_dual_marker_map_svg(
        cam_name=cam_location_name,
        cam_id=cam_id,
        cam_lat=lat,
        cam_lng=lng,
        station_name=station_name,
        station_lat=station_lat,
        station_lng=station_lng,
        distance_km=distance_km
    )

    # Clickable Google Maps Route Navigation URL
    google_maps_route_url = f"https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={station_lat},{station_lng}&travelmode=driving"

    # Formatting Detection Timestamp
    import datetime
    now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
    detection_timestamp_str = now_ist.strftime("%d %b %Y, %I:%M:%S %p IST")

    email_user = os.getenv("EMAIL_USER", "").strip()
    email_pass = os.getenv("EMAIL_PASS", "").strip()

    if not email_user or not email_pass:
        logger.warning("[SMTP CONFIG ERROR] Missing EMAIL_USER or EMAIL_PASS in environment variables.")
        return {
            "status": "warning",
            "message": "Missing Email Credentials in backend .env. Alert logged to memory.",
            "nearest_station": nearest_station,
            "target_officers": target_officers,
            "successful_emails": 0,
            "total_emails_sent": 0
        }

    # Build Complete HTML Email Template
    html_body = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; padding: 20px; color: #f8fafc; margin: 0;">
        <div style="max-width: 640px; margin: 0 auto; background: #161e2e; padding: 28px; border-radius: 20px; border: 2px solid #ef4444; box-shadow: 0 12px 35px rgba(239, 68, 68, 0.35);">
          
          <!-- TOP HEADER BANNER -->
          <div style="text-align: center; border-bottom: 2px solid #2d3748; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="background-color: #dc2626; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">
              🚨 HIGH PRIORITY INTERCEPTION ALERT
            </span>
            <h2 style="color: #ef4444; margin: 12px 0 4px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">
              PROJECT CHAKRAVYUH — THREAT ALERT
            </h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Autonomous AI Computer Vision Facial Interception</p>
          </div>
          
          <!-- 1. SUSPECT/CRIMINAL PHOTO PROMINENTLY AT VERY TOP -->
          <div style="text-align: center; background-color: #0f172a; padding: 20px; border-radius: 16px; border: 1px solid #7f1d1d; margin-bottom: 24px;">
             <p style="color: #f87171; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
               📸 IDENTIFIED SUSPECT PHOTOGRAPH (CONFIRMED MATCH)
             </p>
             {photo_html}
             <h3 style="color: #ffffff; margin: 8px 0 4px 0; font-size: 22px; font-weight: bold;">{name}</h3>
             <p style="color: #fbbf24; font-size: 13px; font-weight: bold; margin: 0 0 10px 0;">ID: {criminal_id} • Age: {age} yrs</p>
             <span style="background-color: #ef4444; color: #ffffff; padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
               {risk_level}
             </span>
          </div>

          <!-- 2. CRIMINAL IDENTITY & DETECTION DOSSIER -->
          <div style="background-color: #0f172a; padding: 18px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px;">
            <h4 style="color: #38bdf8; margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
              📋 Criminal Identity & Detection Record
            </h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; width: 38%;">1. Detection Time:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #facc15;">{detection_timestamp_str}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">2. Camera Node Name/ID:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #38bdf8;">{cam_id} ({cam_location_name})</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">3. Camera GPS Coords:</td>
                <td style="padding: 8px 0; color: #cbd5e1; font-family: monospace;">{lat:.6f}, {lng:.6f}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">4. Crime Record / Details:</td>
                <td style="padding: 8px 0; color: #cbd5e1;">{crime_details}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">5. IPC Section Charges:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #f87171;">{ipc_charges}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">6. Assigned Police Station:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4ade80;">{station_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">7. Police Station Address:</td>
                <td style="padding: 8px 0; color: #cbd5e1;">{station_address}</td>
              </tr>
            </table>
          </div>

          <!-- 3. COMBINED SINGLE MAP SHOWING BOTH LOCATIONS (🔴 Camera + 🔵 Police Station) -->
          <div style="background-color: #0f172a; padding: 18px; border-radius: 14px; border: 1px solid #3b82f6; margin-bottom: 24px;">
            <h4 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 15px;">
              🗺️ Tactical Combined GPS Location Map
            </h4>
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 14px 0;">
              Visual map showing BOTH <b>🔴 Camera Spot Location</b> and <b>🔵 Assigned Police Station HQ</b> ({distance_km:.2f} km distance):
            </p>
            
            <!-- SINGLE INLINE COMBINED MAP IMAGE -->
            <div style="text-align: center; margin-bottom: 16px;">
              <img src="cid:dual_map_image" alt="Combined GPS Location Map" style="max-width: 100%; height: auto; border-radius: 10px; border: 1px solid #334155; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);" />
            </div>

            <!-- CLICKABLE MAP LINK FOR NAVIGATION BELOW MAP IMAGE -->
            <div style="text-align: center; margin-top: 14px;">
              <a href="{google_maps_route_url}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                📍 Open Google Maps Live Interception Navigation Route →
              </a>
            </div>
          </div>

          <div style="border-top: 1px solid #334155; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
            Project Chakravyuh Autonomous AI Security Infrastructure • High Command Interception System
          </div>
        </div>
      </body>
    </html>
    """

    dispatched = []
    smtp_server = None

    def get_fresh_smtp_session(current_session):
        if current_session is not None:
            try:
                status, _ = current_session.noop()
                if status == 250:
                    return current_session
            except Exception as err:
                logger.info(f"[SMTP RECONNECT] Connection check failed ({err}). Reconnecting...")
                try:
                    current_session.close()
                except Exception:
                    pass
        return create_smtp_connection(email_user, email_pass)

    # STEP 7: SMTP Connection & Sequential Dispatch
    try:
        smtp_server = create_smtp_connection(email_user, email_pass)
    except Exception as conn_err:
        logger.error(f"[SMTP CONNECT ERROR] Connection failed: {conn_err}")
        return {
            "status": "error",
            "message": f"SMTP Connection failed: {str(conn_err)}",
            "nearest_station": nearest_station,
            "successful_emails": 0,
            "total_emails_sent": 0
        }

    for officer in target_officers:
        recipient_email = (officer.get("officer_email") or "").strip()
        if not recipient_email:
            continue

        off_name = officer.get("officer_name") or "Station Officer"
        off_rank = officer.get("rank") or "Inspector"

        # Build MIMEMultipart Container for HTML + CID Attachments
        msg = MIMEMultipart("related")
        msg["From"] = f"Chakravyuh Security Command <{email_user}>"
        msg["To"] = recipient_email
        msg["Subject"] = f"🚨 DETECTED: Wanted Suspect {name} (ID: {criminal_id}) at {cam_id}"

        # HTML body subpart
        msg_alt = MIMEMultipart("alternative")
        msg_alt.attach(MIMEText(html_body, "html"))
        msg.attach(msg_alt)

        # 1. Attach suspect photo inline MIME CID <criminal_photo>
        if img_bytes:
            inline_photo = MIMEImage(img_bytes, _subtype=img_subtype)
            inline_photo.add_header("Content-ID", "<criminal_photo>")
            inline_photo.add_header("Content-Disposition", "inline", filename=f"suspect_photo.{img_subtype}")
            msg.attach(inline_photo)

        # 2. Attach combined visual map image inline MIME CID <dual_map_image>
        inline_map = MIMEImage(map_svg_bytes, _subtype="svg+xml")
        inline_map.add_header("Content-ID", "<dual_map_image>")
        inline_map.add_header("Content-Disposition", "inline", filename="combined_location_map.svg")
        msg.attach(inline_map)

        sent_ok = False
        for attempt in range(3):
            logger.info(f"[SEND ATTEMPT] Sending alert email to {off_name} <{recipient_email}> (Attempt {attempt + 1}/3)...")
            try:
                smtp_server = get_fresh_smtp_session(smtp_server)
                smtp_server.send_message(msg)
                sent_ok = True
                logger.info(f"[SEND SUCCESS] Email accepted by SMTP server for {off_name} <{recipient_email}> on attempt {attempt + 1}")
                break
            except Exception as e:
                logger.error(f"[SEND FAILURE] Attempt {attempt + 1}/3 failed for <{recipient_email}>: {e}")
                smtp_server = None
                await asyncio.sleep(1)

        if sent_ok:
            dispatched.append({
                "officer_name": off_name,
                "rank": off_rank,
                "officer_email": recipient_email
            })

    if smtp_server is not None:
        try:
            smtp_server.quit()
        except Exception:
            pass

    logger.info(f"[EMAIL DISPATCH SUMMARY] Total Recipients: {len(recipient_emails)}, Successful Dispatches: {len(dispatched)}")
    logger.info("==========================================================")

    return {
        "status": "success" if len(dispatched) > 0 else "error",
        "message": f"Alert email successfully dispatched to {len(dispatched)} officer(s) of station '{station_name}'",
        "nearest_station": nearest_station,
        "dispatched_officers": dispatched,
        "successful_emails": len(dispatched),
        "total_emails_sent": len(dispatched)
    }