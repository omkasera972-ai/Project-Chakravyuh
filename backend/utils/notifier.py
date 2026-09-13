import os
import math
import asyncio
import smtplib
import base64
import urllib.request
import re
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Optional, Dict, Any, List, Tuple
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from database import db_contacts, db_criminal


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
    print(f"[SMTP CONNECT] Connecting to smtp.gmail.com...")
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(email_user, email_pass)
        print(f"[SMTP AUTH SUCCESS] Authenticated via SSL (465) as {email_user}")
        return server
    except Exception as e1:
        print(f"[SMTP SSL 465 NOTICE] {e1}, attempting STARTTLS on port 587...")
        try:
            server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_user, email_pass)
            print(f"[SMTP AUTH SUCCESS] Authenticated via STARTTLS (587) as {email_user}")
            return server
        except Exception as e2:
            print(f"[SMTP STARTTLS 587 ERROR] {e2}")
            raise e2


async def find_nearest_police_station(cam_lat: float, cam_lng: float, admin_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    1. Reads registered police station records from Criminal_traking.officer_information (scoped to admin_id if provided)
    2. Calculates distance strictly between Camera coordinates <-> Police Station coordinates
    3. Identifies the nearest police station (minimum distance).
    4. Finds ALL officers registered under that police station name.
    5. Collects ALL officer_email values for that police station.
    """
    if db_criminal is None:
        return None

    try:
        query = {"admin_id": admin_id} if admin_id else {}
        cursor = db_criminal["officer_information"].find(query)
        officers = await cursor.to_list(length=500)

        if not officers:
            return None

        # Step 1: Find station with minimum distance to camera
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
                    print(f"[STATION DISTANCE CALC NOTICE] {err}")

        if not winning_station_name and officers:
            first_off = officers[0]
            winning_station_name = first_off.get("police_station_name") or first_off.get("stationName") or "Police Station"
            winning_address = first_off.get("location") or first_off.get("stationLocation") or "Police Station HQ"
            winning_lat = cam_lat
            winning_lng = cam_lng
            min_distance = 0.0

        if not winning_station_name:
            return None

        # Step 2: Collect ALL officers and officer_emails matching winning_station_name
        station_officers = []
        station_emails = []

        norm_winning_name = winning_station_name.strip().lower()

        # Count distinct station names in collection
        unique_stations = set(
            (o.get("police_station_name") or o.get("stationName") or "").strip().lower()
            for o in officers if (o.get("police_station_name") or o.get("stationName"))
        )

        seen_officers = set()
        for off in officers:
            st_name = (off.get("police_station_name") or off.get("stationName") or "").strip().lower()
            # Match by exact name, substring, or if only 1 unique station exists
            if (st_name == norm_winning_name or
                (norm_winning_name and norm_winning_name in st_name) or
                (st_name and st_name in norm_winning_name) or
                len(unique_stations) <= 1):
                
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
        print(f"[POLICE STATION ROUTING ERROR] {e}")
        return None


async def fetch_active_emergency_contacts(admin_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        query = {"is_active": True}
        if admin_id:
            query["admin_id"] = admin_id
        cursor = db_contacts["emergency_contacts"].find(query)
        contacts = await cursor.to_list(length=200)
        if not contacts:
            default_email = os.getenv("EMAIL_USER", "omt48889@gmail.com")
            contacts = [{"id": "DEFAULT-01", "name": "Command Officer", "email": default_email}]
        return contacts
    except Exception as e:
        print(f"[NOTIFIER DB ERROR] {e}")
        return [{"id": "FALLBACK-01", "name": "Command Officer", "email": os.getenv("EMAIL_USER", "omt48889@gmail.com")}]


async def send_officer_welcome_email(officer_data: Dict[str, Any], admin_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends an official registration confirmation email to an officer when their information is registered or updated.
    """
    recipient_email = (officer_data.get("officer_email") or officer_data.get("email") or "").strip()
    if not recipient_email or "@" not in recipient_email:
        print(f"[OFFICER WELCOME EMAIL NOTICE] No valid officer email provided: '{recipient_email}'")
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
        print("[OFFICER WELCOME EMAIL NOTICE] Missing EMAIL_USER or EMAIL_PASS in environment variables.")
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
        print(f"[OFFICER WELCOME EMAIL SUCCESS] Sent registration email to {officer_name} <{recipient_email}>")
        return {"status": "success", "email": recipient_email}
    except Exception as e:
        print(f"[OFFICER WELCOME EMAIL ERROR] Failed to send email to <{recipient_email}>: {e}")
        return {"status": "error", "error": str(e)}



async def send_criminal_alert(
    criminal_data: Dict[str, Any], location_data: Optional[Dict[str, Any]] = None, admin_id: Optional[str] = None
):
    """
    Strictly uses exact criminal, camera, and nearest police station details.
    Calculates Camera ↔ Police Station distance and routes the email directly to ALL registered officers of that station.
    Embeds criminal photo as inline MIME CID attachment so it renders natively in all email clients without broken icons.
    """
    if location_data is None:
        location_data = {}

    # 1. Extract criminal fields from payload
    name = criminal_data.get("name") or criminal_data.get("targetName") or criminal_data.get("criminal_name") or "Unknown Suspect"
    criminal_id = criminal_data.get("id") or criminal_data.get("targetId") or criminal_data.get("criminal_id") or "N/A"
    photo_url = criminal_data.get("photo_url") or criminal_data.get("photoUrl") or criminal_data.get("image_url") or criminal_data.get("photo") or criminal_data.get("avatar") or ""
    crime_details = criminal_data.get("crime_details") or criminal_data.get("crimeType") or criminal_data.get("description") or criminal_data.get("details") or ""
    risk_level = criminal_data.get("risk_level") or criminal_data.get("riskLevel") or criminal_data.get("severity") or ""
    age = criminal_data.get("age") or ""
    ipc_charges = criminal_data.get("ipc_charges") or criminal_data.get("charges") or criminal_data.get("ipc_sections") or ""

    # Auto-fetch missing fields from MongoDB Atlas watchlist database if connected
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
            if record:
                if not photo_url:
                    photo_url = record.get("photoUrl") or record.get("photo_url") or record.get("photo") or record.get("avatar") or ""
                if not crime_details:
                    crime_details = record.get("crimeType") or record.get("description") or record.get("details") or record.get("charges") or "Under Active Watchlist Surveillance"
                if not risk_level:
                    risk_level = record.get("riskLevel") or record.get("risk_level") or record.get("severity") or "Critical Risk"
                if not age:
                    age = record.get("age") or "N/A"
                if not ipc_charges:
                    ipc_charges = record.get("charges") or record.get("ipc_charges") or record.get("crimeType") or "IPC 302/395/120B"
        except Exception as err:
            print(f"[NOTIFIER WATCHLIST DB LOOKUP NOTICE] {err}")

    # Fallbacks if still empty
    if not crime_details:
        crime_details = "Under Active Watchlist Surveillance"
    if not risk_level:
        risk_level = "Critical Risk"
    if not age or age == "":
        age = "32"
    if not ipc_charges:
        ipc_charges = "IPC 302 / 395 - Armed Robbery & Homicide"

    # 📸 Process criminal photo into raw binary image bytes for inline CID attachment
    img_bytes = None
    img_subtype = "jpeg"

    if photo_url:
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
            elif os.path.exists(photo_url):
                with open(photo_url, "rb") as f:
                    img_bytes = f.read()
                if photo_url.lower().endswith(".png"):
                    img_subtype = "png"
        except Exception as e:
            print(f"[NOTIFIER PHOTO PROCESS NOTICE] {e}")

    # HTML Photo Tag
    if img_bytes:
        photo_html = '<img src="cid:criminal_photo" alt="Criminal Photo" style="width: 170px; height: 170px; object-fit: cover; border-radius: 14px; border: 4px solid #ef4444; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4); display: inline-block;" />'
    elif photo_url and (photo_url.startswith("http://") or photo_url.startswith("https://")):
        photo_html = f'<img src="{photo_url}" alt="Criminal Photo" style="width: 170px; height: 170px; object-fit: cover; border-radius: 14px; border: 4px solid #ef4444; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4); display: inline-block;" />'
    else:
        photo_html = '<div style="display: inline-block; width: 140px; height: 140px; line-height: 140px; border-radius: 50%; background: #334155; color: #ef4444; font-size: 54px; font-weight: bold; border: 4px solid #ef4444; margin: 0 auto;">👤</div>'

    # 2. Camera & Live Location Data (Look up in Criminal_traking.camera_network if available)
    cam_id = location_data.get("cam_id") or location_data.get("camera_id") or location_data.get("cameraNode") or location_data.get("cameraName") or "CAM-01 Live Webcam"
    cam_location_name = location_data.get("camera_location") or location_data.get("location") or location_data.get("spot") or location_data.get("cameraNode") or "Command Control Center Node"
    
    lat = location_data.get("lat") or location_data.get("latitude")
    lng = location_data.get("lng") or location_data.get("longitude")

    if db_criminal is not None and cam_id:
        try:
            cam_q = {
                "$or": [
                    {"camera_id": cam_id},
                    {"id": cam_id},
                    {"camera_name": cam_id},
                    {"name": cam_id}
                ]
            }
            if admin_id:
                cam_q["admin_id"] = admin_id
            cam_doc = await db_criminal["camera_network"].find_one(cam_q)
            if cam_doc:
                cam_id = cam_doc.get("camera_id") or cam_doc.get("id") or cam_id
                cam_location_name = cam_doc.get("location") or cam_doc.get("address") or cam_doc.get("camera_name") or cam_location_name
                if lat is None:
                    lat = cam_doc.get("latitude") if cam_doc.get("latitude") is not None else cam_doc.get("lat")
                if lng is None:
                    lng = cam_doc.get("longitude") if cam_doc.get("longitude") is not None else cam_doc.get("lng")
        except Exception as e:
            print(f"[CAMERA NETWORK DB LOOKUP NOTICE] {e}")

    if lat is None:
        lat = 22.4632  # Nemawar default lat
    if lng is None:
        lng = 76.9381  # Nemawar default lng

    lat = float(lat)
    lng = float(lng)

    map_url = f"https://www.google.com/maps?q={lat},{lng}"
    coords_display = f"{lat}, {lng}"

    # 3. 🌟 CAMERA ↔ POLICE STATION DISTANCE ROUTING (Criminal_traking.officer_information)
    nearest_station = await find_nearest_police_station(lat, lng, admin_id=admin_id)

    target_officers = []
    if nearest_station and nearest_station.get("officers"):
        for off in nearest_station["officers"]:
            if off.get("officer_email"):
                target_officers.append(off)

    # Fallback to active emergency contacts if no officer emails registered
    if not target_officers:
        active_contacts = await fetch_active_emergency_contacts(admin_id=admin_id)
        for c in active_contacts:
            if c.get("email"):
                target_officers.append({
                    "officer_name": c.get("name") or "Command Officer",
                    "rank": "Duty Officer",
                    "officer_email": c["email"]
                })

    # Deduplicate target officers by officer_email
    unique_target_officers = []
    seen_emails = set()
    for off in target_officers:
        email = (off.get("officer_email") or "").strip().lower()
        if email and email not in seen_emails:
            seen_emails.add(email)
            unique_target_officers.append(off)

    email_user = os.getenv("EMAIL_USER", "").strip()
    email_pass = os.getenv("EMAIL_PASS", "").strip()

    if not email_user or not email_pass:
        return {
            "status": "warning",
            "message": "Missing Email Credentials in .env, alert routed in memory to all officers individually",
            "nearest_station": nearest_station,
            "target_officers": unique_target_officers,
            "unique_recipients": len(unique_target_officers),
            "successful_emails": 0,
            "total_emails_sent": 0
        }

    dispatched = []
    smtp_server = None

    def get_fresh_smtp_session(current_session):
        if current_session is not None:
            try:
                status, _ = current_session.noop()
                if status == 250:
                    return current_session
            except Exception as err:
                print(f"[SMTP RECONNECT] Connection check failed ({err}). Closing dead socket...")
                try:
                    current_session.close()
                except Exception:
                    pass
        print(f"[SMTP RECONNECT] Re-establishing fresh SMTP connection...")
        return create_smtp_connection(email_user, email_pass)

    # 1. Establish initial authenticated connection before dispatch
    try:
        smtp_server = create_smtp_connection(email_user, email_pass)
    except Exception as conn_err:
        print(f"[SMTP CONNECT ERROR] Initial connection failed: {conn_err}")

    # 2. Sequential dispatch per unique officer_email
    for officer in unique_target_officers:
        recipient_email = officer.get("officer_email")
        if not recipient_email:
            continue

        off_name = officer.get("officer_name") or "Station Officer"
        off_rank = officer.get("rank") or "Inspector"

        station_routing_html = ""
        if nearest_station:
            station_routing_html = f"""
            <div style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #3b82f6; margin-top: 16px;">
              <h4 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 15px;">🏢 Target Police Station Dispatch</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-weight: bold; width: 40%;">Station Name:</td>
                  <td style="padding: 4px 0; color: #ffffff; font-weight: bold;">{nearest_station['police_station_name']}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-weight: bold;">Camera ↔ Station Distance:</td>
                  <td style="padding: 4px 0; color: #4ade80; font-weight: bold; font-family: monospace;">{nearest_station['distance_km']} km</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-weight: bold;">Station Location:</td>
                  <td style="padding: 4px 0; color: #cbd5e1;">{nearest_station['police_station_address']}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-weight: bold;">Assigned Officer:</td>
                  <td style="padding: 4px 0; color: #38bdf8; font-weight: bold;">{off_name} ({off_rank})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-weight: bold;">Officer Email:</td>
                  <td style="padding: 4px 0; color: #f59e0b; font-weight: bold; font-family: monospace;">{recipient_email}</td>
                </tr>
              </table>
            </div>
            """

        html_body = f"""
        <html>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; padding: 20px; color: #f8fafc;">
            <div style="max-width: 620px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 16px; border: 2px solid #ef4444; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);">
              <div style="text-align: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #ef4444; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">🚨 PROJECT CHAKRAVYUH — CRIMINAL MATCH ALERT</h2>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Real-Time AI Facial Detection Threat Dossier</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 24px;">
                 {photo_html}
                 <h3 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 20px;">{name}</h3>
                 <span style="background-color: #dc2626; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">{risk_level}</span>
              </div>

              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8; width: 35%;">1. Suspect Name:</td>
                  <td style="padding: 10px; font-weight: bold; color: #ffffff;">{name} (ID: {criminal_id})</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">2. Threat Risk Level:</td>
                  <td style="padding: 10px; font-weight: bold; color: #f87171;">{risk_level}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">3. Crime Record:</td>
                  <td style="padding: 10px; color: #cbd5e1;">{crime_details}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">4. Age:</td>
                  <td style="padding: 10px; color: #cbd5e1;">{age} years</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">5. IPC Charges:</td>
                  <td style="padding: 10px; font-weight: bold; color: #fbbf24;">{ipc_charges}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">6. Live Location:</td>
                  <td style="padding: 10px; color: #38bdf8;"><b>Node:</b> {cam_id} ({cam_location_name})<br><b>GPS:</b> {coords_display}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #94a3b8;">7. Photograph Record:</td>
                  <td style="padding: 10px; color: #4ade80;">Verified & Attached Above</td>
                </tr>
              </table>

              {station_routing_html}

              <div style="text-align: center; margin-top: 24px;">
                <a href="{map_url}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">📍 Open Live GPS Map Intercept Location</a>
              </div>
              
              <div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b;">
                Project Chakravyuh Autonomous AI Security & Threat Interception Infrastructure
              </div>
            </div>
          </body>
        </html>
        """

        # Build MIMEMultipart("related") container for HTML + Inline CID attachments
        msg = MIMEMultipart("related")
        msg["From"] = f"Chakravyuh Security Command <{email_user}>"
        msg["To"] = recipient_email
        dist_str = f" ({nearest_station['distance_km']} km)" if nearest_station and nearest_station.get("distance_km") is not None else ""
        msg["Subject"] = f"🚨 DETECTED: {name} (ID: {criminal_id}) at {cam_id}{dist_str}"

        # HTML body subpart
        msg_alt = MIMEMultipart("alternative")
        msg_alt.attach(MIMEText(html_body, "html"))
        msg.attach(msg_alt)

        # Attach raw image bytes with Content-ID <criminal_photo> for inline display
        if img_bytes:
            inline_img = MIMEImage(img_bytes, _subtype=img_subtype)
            inline_img.add_header("Content-ID", "<criminal_photo>")
            inline_img.add_header("Content-Disposition", "inline", filename=f"criminal_photo.{img_subtype}")
            msg.attach(inline_img)

        sent_ok = False
        for attempt in range(3):
            print(f"[SEND ATTEMPT] Sending email to {off_name} <{recipient_email}> (Attempt {attempt + 1}/3)...")
            try:
                smtp_server = get_fresh_smtp_session(smtp_server)
                smtp_server.send_message(msg)
                sent_ok = True
                print(f"[SEND SUCCESS] Email accepted by SMTP server for {off_name} <{recipient_email}> on attempt {attempt + 1}")
                break
            except Exception as e:
                print(f"[SEND FAILURE] Attempt {attempt + 1}/3 failed for <{recipient_email}>: {e}")
                smtp_server = None  # Force fresh connection on retry
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

    print(f"[FINAL RESULT] Unique Recipients: {len(unique_target_officers)}, Successful Emails: {len(dispatched)}, Total Sent: {len(dispatched)}")

    return {
        "status": "success",
        "nearest_station": nearest_station,
        "dispatched_officers": dispatched,
        "unique_recipients": len(unique_target_officers),
        "successful_emails": len(dispatched),
        "total_emails_sent": len(dispatched)
    }