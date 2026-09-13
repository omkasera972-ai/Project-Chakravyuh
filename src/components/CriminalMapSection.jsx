import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  Hospital, 
  ShieldAlert, 
  Navigation, 
  Phone, 
  Clock, 
  MapPin, 
  Radio, 
  Crosshair, 
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Car,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';

import { useApp } from '../context/AppContext';

// Custom SVG Markers for Police Stations, Hospitals & Live Web Camera
const createMapMarkerIcon = (bgColor, emoji, border = '#ffffff', size = 32) => {
  return L.divIcon({
    className: 'custom-criminal-map-marker',
    html: `
      <div style="
        background: ${bgColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2.5px solid ${border};
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: ${Math.round(size * 0.48)}px;
        transition: transform 0.2s ease-in-out;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Pulsing Live Web Camera Blue Dot Marker
const liveCameraMarkerIcon = L.divIcon({
  className: 'live-camera-marker',
  html: `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: rgba(59, 130, 246, 0.4);
        border: 2px solid rgba(59, 130, 246, 0.8);
        animation: pulse 1.6s infinite ease-in-out;
      "></div>
      <div style="
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 16px rgba(37, 99, 235, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      ">
        <span style="font-size: 10px;">📸</span>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22]
});

// Police Station & Hospital Icons
const policeIcon = createMapMarkerIcon('linear-gradient(135deg, #1e3a8a, #3b82f6)', '🚔', '#60a5fa', 34);
const nearestPoliceIcon = createMapMarkerIcon('linear-gradient(135deg, #dc2626, #b91c1c)', '🚨', '#fef08a', 40);
const hospitalIcon = createMapMarkerIcon('linear-gradient(135deg, #047857, #10b981)', '🏥', '#a7f3d0', 34);
const nearestHospitalIcon = createMapMarkerIcon('linear-gradient(135deg, #059669, #34d399)', '🚑', '#fef08a', 38);

// Default Datasets for Police Stations around Live Camera Zone
const POLICE_STATIONS = [
  {
    id: 'POL-01',
    name: 'Central HQ Police Station',
    category: 'District Central HQ & QRT Unit',
    lat: 22.7295,
    lng: 75.8690,
    phone: '112 / +91 731-2527100',
    address: 'M.G. Road, Central Sector, Zone 1',
    officer: 'Inspector R.K. Sharma',
    vehicles: '6 QRT Patrol Vans, 10 Interceptor Bikes',
    status: 'Active (24x7 Emergency)'
  },
  {
    id: 'POL-02',
    name: 'Cyber & Crime Branch Station',
    category: 'Cyber Intelligence & Surveillance Cell',
    lat: 22.7180,
    lng: 75.8570,
    phone: '1930 / +91 731-2549200',
    address: 'Palasia Square, Tech Corridor',
    officer: 'ACP Ananya Verma',
    vehicles: '3 Mobile Surveillance Units',
    status: 'Active (Special Ops)'
  },
  {
    id: 'POL-03',
    name: 'North Sector Highway Police Station',
    category: 'Highway Patrol & Expressway Outpost',
    lat: 22.7410,
    lng: 75.8820,
    phone: '+91 731-2804321',
    address: 'NH-52 Expressway Toll Plaza',
    officer: 'Inspector Vikram Singh',
    vehicles: '4 Highway Interceptors',
    status: 'Active (Highway Patrol)'
  },
  {
    id: 'POL-04',
    name: 'South Civil Lines Police Station',
    category: 'Civil Lines Division',
    lat: 22.7090,
    lng: 75.8490,
    phone: '+91 731-2401122',
    address: 'Old Civil Lines Road, Zone 3',
    officer: 'Sub-Inspector S. Deshmukh',
    vehicles: '4 Patrol Jeeps',
    status: 'Active'
  },
  {
    id: 'POL-05',
    name: 'East Ring Road Police Outpost',
    category: 'Ring Road Quick Response Unit',
    lat: 22.7310,
    lng: 75.8940,
    phone: '+91 731-2908877',
    address: 'Eastern Bypass Junction',
    officer: 'Inspector M. Khan',
    vehicles: '3 QRT Bikes',
    status: 'Active'
  }
];

// Default Datasets for Hospitals around Live Camera Zone
const HOSPITALS = [
  {
    id: 'HOSP-01',
    name: 'City Civil Multi-Specialty Hospital',
    category: 'Level 1 Emergency & Trauma Center',
    lat: 22.7210,
    lng: 75.8710,
    phone: '108 / +91 731-4001000',
    address: 'Hospital Road, Central Zone',
    icuBeds: 24,
    ambulances: '8 Advanced Life Support (ALS) Units',
    status: 'Emergency Open 24/7'
  },
  {
    id: 'HOSP-02',
    name: 'Apollo Super Specialty Hospital',
    category: 'Tertiary Emergency & Trauma Surgery',
    lat: 22.7380,
    lng: 75.8600,
    phone: '+91 731-2499999',
    address: 'Vijay Nagar Main Road',
    icuBeds: 15,
    ambulances: '5 ALS Units',
    status: 'Emergency Open 24/7'
  },
  {
    id: 'HOSP-03',
    name: 'Care Emergency Trauma Center',
    category: 'Trauma & Cardiac Care Facility',
    lat: 22.7120,
    lng: 75.8620,
    phone: '+91 731-3005555',
    address: 'South Tukoganj',
    icuBeds: 18,
    ambulances: '4 Emergency Vans',
    status: 'Emergency Open 24/7'
  },
  {
    id: 'HOSP-04',
    name: 'Red Cross Community Medical Center',
    category: 'Disaster Relief & First Aid Outpost',
    lat: 22.7350,
    lng: 75.8850,
    phone: '+91 731-2554433',
    address: 'Eastern Ring Road',
    icuBeds: 8,
    ambulances: '3 First Aid Vans',
    status: 'Open'
  }
];

// Haversine Distance Calculation Function (in km)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance string cleanly
const formatDistance = (distKm) => {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} METER${Math.round(distKm * 1000) === 1 ? '' : 'S'}`;
  }
  return `${distKm.toFixed(2)} KM`;
};

// Map recentering helper
const RecenterMap = ({ center, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const CriminalMapSection = ({ onDispatchAlert }) => {
  const { dispatchPhoneNumbers = [], showToast, userLocation } = useApp();
  // Default Live Web Camera Coordinates (Central Highway CCTV Node)
  const [liveCameraCoords, setLiveCameraCoords] = useState([22.7240, 75.8650]);
  const [mapCenter, setMapCenter] = useState([22.7240, 75.8650]);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'POLICE' | 'HOSPITAL'
  const [usingRealGps, setUsingRealGps] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  
  // Google Maps Tile Switcher ('google-hybrid' | 'google-roadmap' | 'google-satellite' | 'osm')
  const [mapTileType, setMapTileType] = useState('google-hybrid');
  const [livePois, setLivePois] = useState({ police: [], hospitals: [] });
  const [isFetchingPois, setIsFetchingPois] = useState(false);
  const [activeInterceptAlert, setActiveInterceptAlert] = useState(null);

  // Simulate instant location detection (e.g. Nemawar) and trigger alert to nearest police station
  const handleSimulateNemawarIntercept = async () => {
    const nemawarCoords = [22.4632, 76.9925]; // Nemawar, Dewas MP
    setLiveCameraCoords(nemawarCoords);
    setMapCenter(nemawarCoords);
    
    await fetchLivePois(nemawarCoords[0], nemawarCoords[1]);

    const alertPayload = {
      targetName: "Vikram R. (Most Wanted)",
      targetId: "CRIM-NEMAWAR-99",
      location: "Nemawar Narmada River Bridge CCTV Node",
      policeStation: "Nemawar Thana (Dewas Sector)",
      phone: "+91 7273-255100 / 112",
      distance: "0.65 KM",
      driveTime: "~2 MINS",
      timestamp: new Date().toLocaleTimeString()
    };
    setActiveInterceptAlert(alertPayload);

    // Call backend emergency dispatch API for ALL contacts registered in Settings
    const contactsToNotify = (dispatchPhoneNumbers && dispatchPhoneNumbers.length > 0)
      ? dispatchPhoneNumbers
      : [{ name: 'Duty Officer', number: '+91 9876543210', email: 'officer.sharma@gmail.com' }];

    contactsToNotify.forEach((contact) => {
      try {
        fetch('http://127.0.0.1:8000/api/police/emergency-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetName: alertPayload.targetName,
            targetId: alertPayload.targetId,
            policeNumber: contact.number || alertPayload.phone,
            email: contact.email || 'officer.sharma@gmail.com',
            crimeType: "Armed Robbery & Absconding Suspect (Nemawar Intercept)",
            cameraNode: alertPayload.location,
            confidence: "98.4%",
            incidentDateTime: alertPayload.timestamp,
            lat: liveCameraCoords[0] || userLocation?.lat,
            lng: liveCameraCoords[1] || userLocation?.lng
          })
        }).then(r => r.json()).then(res => {
          if (res.status === 'success' && showToast) {
            showToast(
              "🚨 Emergency Alert Dispatched",
              `WhatsApp (+91) & Gmail Alert with Live GPS Link sent to ${contact.name}!`,
              "success"
            );
          }
        });
      } catch(e) {
        console.warn("Dispatch API warning:", e);
      }
    });
  };

  // Fetch real live POIs from OpenStreetMap Overpass API
  const fetchLivePois = async (lat, lng) => {
    setIsFetchingPois(true);
    try {
      const query = `[out:json];(node(around:8000,${lat},${lng})["amenity"="police"];node(around:8000,${lat},${lng})["amenity"="hospital"];);out body 20;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const police = [];
        const hospitals = [];
        (data.elements || []).forEach((el, idx) => {
          if (!el.lat || !el.lon) return;
          const name = el.tags?.name || (el.tags?.amenity === 'police' ? `Police Outpost #${idx+1}` : `Emergency Center #${idx+1}`);
          const item = {
            id: `OVERPASS-${el.id}`,
            name,
            category: el.tags?.amenity === 'police' ? (el.tags?.police || 'Police Station') : (el.tags?.healthcare || 'Hospital / Emergency Clinic'),
            lat: el.lat,
            lng: el.lon,
            phone: el.tags?.phone || el.tags?.['contact:phone'] || '112 / 108 Emergency',
            address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Nearby Zone',
            officer: el.tags?.operator || 'Duty Officer',
            vehicles: 'Patrol / Ambulance Unit',
            icuBeds: 10,
            ambulances: 'Available',
            status: 'Verified Live POI'
          };
          if (el.tags?.amenity === 'police') police.push(item);
          else if (el.tags?.amenity === 'hospital') hospitals.push(item);
        });
        setLivePois({ police, hospitals });
      }
    } catch (e) {
      console.warn("Overpass API error:", e);
    } finally {
      setIsFetchingPois(false);
    }
  };

  // Get real user GPS location instantly from cached global state or fallback
  const handleFetchRealGps = () => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      const newCoords = [userLocation.lat, userLocation.lng];
      setLiveCameraCoords(newCoords);
      setMapCenter(newCoords);
      setUsingRealGps(true);
      fetchLivePois(newCoords[0], newCoords[1]);
      if (showToast) showToast('GPS Synced', `Zero-latency live location locked: ${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E`, 'success');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = [pos.coords.latitude, pos.coords.longitude];
          setLiveCameraCoords(newCoords);
          setMapCenter(newCoords);
          setUsingRealGps(true);
          fetchLivePois(newCoords[0], newCoords[1]);
        },
        (err) => {
          console.warn("Geolocation warning:", err);
          alert("Could not access device GPS. Using Live Camera Default Location.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Sync with continuous live GPS location updates when using real GPS
  useEffect(() => {
    if (usingRealGps && userLocation && userLocation.lat && userLocation.lng) {
      const newCoords = [userLocation.lat, userLocation.lng];
      setLiveCameraCoords(newCoords);
      setMapCenter(newCoords);
    }
  }, [usingRealGps, userLocation?.lat, userLocation?.lng]);

  // Find Nearest Police Station from Live Web Camera
  const allPoliceStations = [...POLICE_STATIONS, ...livePois.police];
  const policeStationsWithDistance = allPoliceStations.map((station) => {
    const dist = calculateDistanceKm(
      liveCameraCoords[0],
      liveCameraCoords[1],
      station.lat,
      station.lng
    );
    return { ...station, distanceKm: dist };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestPoliceStation = policeStationsWithDistance[0];

  // Find Nearest Hospital from Live Web Camera
  const allHospitals = [...HOSPITALS, ...livePois.hospitals];
  const hospitalsWithDistance = allHospitals.map((hospital) => {
    const dist = calculateDistanceKm(
      liveCameraCoords[0],
      liveCameraCoords[1],
      hospital.lat,
      hospital.lng
    );
    return { ...hospital, distanceKm: dist };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestHospital = hospitalsWithDistance[0];

  // Estimated driving time to nearest police station (assume 35 km/h city average speed)
  const estDriveMinsPolice = Math.max(1, Math.round((nearestPoliceStation.distanceKm / 35) * 60));
  const estDriveMinsHospital = Math.max(1, Math.round((nearestHospital.distanceKm / 35) * 60));

  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl transition-all">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span>Police Stations & Emergency Hospitals Map</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                  Live Geospatial Radar
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time proximity mapping & rapid emergency dispatch distances calculated directly from your <strong>Live Web Camera</strong>.
          </p>
        </div>

        {/* MAP CONTROLS & FILTER PILLS */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-gray-100 dark:bg-[#181b24] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-white dark:bg-[#252a36] text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({allPoliceStations.length + allHospitals.length})
            </button>
            <button
              onClick={() => setFilterMode('POLICE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                filterMode === 'POLICE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🚔 Police ({allPoliceStations.length})</span>
            </button>
            <button
              onClick={() => setFilterMode('HOSPITAL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                filterMode === 'HOSPITAL'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🏥 Hospitals ({allHospitals.length})</span>
            </button>
          </div>

          <button
            onClick={handleSimulateNemawarIntercept}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95 animate-pulse"
            title="Simulate Criminal Detection in Nemawar & Trigger Nearest Police Station Dispatch"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 Test Nemawar Intercept Alert</span>
          </button>

          {/* MAP TILE LAYER SWITCHER */}
          <select
            value={mapTileType}
            onChange={(e) => setMapTileType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs cursor-pointer focus:outline-none"
          >
            <option value="google-hybrid">🛰️ Google Hybrid</option>
            <option value="google-roadmap">🗺️ Google Streets</option>
            <option value="google-satellite">📷 Google Satellite</option>
            <option value="osm">🌐 OpenStreetMap</option>
          </select>

          <button
            onClick={() => fetchLivePois(liveCameraCoords[0], liveCameraCoords[1])}
            disabled={isFetchingPois}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            title="Fetch real OpenStreetMap POIs around camera"
          >
            <Radio className={`w-3.5 h-3.5 ${isFetchingPois ? 'animate-spin' : ''}`} />
            <span>{isFetchingPois ? 'Fetching...' : 'Fetch Live POIs'}</span>
          </button>

          <button
            onClick={handleFetchRealGps}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer border ${
              usingRealGps
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}
            title="Use device GPS for live location"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${usingRealGps ? 'text-emerald-500 animate-spin' : ''}`} />
            <span>{usingRealGps ? '🛰️ Live GPS Active' : '🛰️ Use Device GPS'}</span>
          </button>

          <button
            onClick={() => setMapCenter([liveCameraCoords[0], liveCameraCoords[1]])}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-500" />
            <span>Center Camera</span>
          </button>
        </div>
      </div>

      {/* ACTIVE NEMAWAR / EMERGENCY INTERCEPT BANNER */}
      {activeInterceptAlert && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white text-red-700 text-[10px] font-black uppercase tracking-wider">
                  🚨 EMERGENCY DISPATCH SENT
                </span>
                <span className="text-xs font-mono font-bold text-red-100">{activeInterceptAlert.timestamp}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
                CRIMINAL TRACKED: {activeInterceptAlert.targetName} ({activeInterceptAlert.targetId})
              </h3>
              <p className="text-xs text-red-100 font-medium">
                📍 Location: <strong>{activeInterceptAlert.location}</strong> • Alert sent to <strong>{activeInterceptAlert.policeStation}</strong> ({activeInterceptAlert.phone}) • Proximity: <strong>{activeInterceptAlert.distance} ({activeInterceptAlert.driveTime})</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveInterceptAlert(null)}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0 self-end md:self-auto"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* MAP DISPLAY CONTAINER */}
      <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <RecenterMap center={mapCenter} />
          
          {mapTileType === 'google-hybrid' && (
            <TileLayer
              key="google-hybrid"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'google-roadmap' && (
            <TileLayer
              key="google-roadmap"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'google-satellite' && (
            <TileLayer
              key="google-satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'osm' && (
            <TileLayer
              key="osm"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
          )}

          {/* LIVE WEB CAMERA MARKER */}
          <Marker position={liveCameraCoords} icon={liveCameraMarkerIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 space-y-1 text-xs">
                <div className="flex items-center space-x-1 font-black text-blue-600">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>LIVE WEB CAMERA NODE</span>
                </div>
                <p className="text-[11px] text-gray-600 font-semibold">
                  Coordinates: {liveCameraCoords[0].toFixed(4)}, {liveCameraCoords[1].toFixed(4)}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {usingRealGps ? '🛰️ Verified Browser Geolocation' : '📸 Default Primary Web Camera Station'}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* ROUTE LINE FROM WEBCAM TO NEAREST POLICE STATION */}
          {nearestPoliceStation && (
            <Polyline
              positions={[
                liveCameraCoords,
                [nearestPoliceStation.lat, nearestPoliceStation.lng]
              ]}
              pathOptions={{
                color: '#ef4444',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.85
              }}
            />
          )}

          {/* ROUTE LINE FROM WEBCAM TO NEAREST HOSPITAL */}
          {nearestHospital && (
            <Polyline
              positions={[
                liveCameraCoords,
                [nearestHospital.lat, nearestHospital.lng]
              ]}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                dashArray: '6, 6',
                opacity: 0.75
              }}
            />
          )}

          {/* POLICE STATIONS MARKERS */}
          {(filterMode === 'ALL' || filterMode === 'POLICE') &&
            policeStationsWithDistance.map((station) => {
              const isNearest = station.id === nearestPoliceStation.id;
              return (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lng]}
                  icon={isNearest ? nearestPoliceIcon : policeIcon}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-black text-blue-700 flex items-center gap-1">
                          {isNearest ? '🚨 CLOSEST POLICE STATION' : '🚔 Police Station'}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                          {formatDistance(station.distanceKm)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-xs">{station.name}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{station.category}</p>
                      <div className="text-[10px] text-gray-500 space-y-0.5 font-mono pt-1">
                        <p>📍 {station.address}</p>
                        <p>📞 Phone: <strong>{station.phone}</strong></p>
                        <p>👤 Officer: {station.officer}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* HOSPITALS MARKERS */}
          {(filterMode === 'ALL' || filterMode === 'HOSPITAL') &&
            hospitalsWithDistance.map((hosp) => {
              const isNearest = hosp.id === nearestHospital.id;
              return (
                <Marker
                  key={hosp.id}
                  position={[hosp.lat, hosp.lng]}
                  icon={isNearest ? nearestHospitalIcon : hospitalIcon}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-black text-emerald-700 flex items-center gap-1">
                          {isNearest ? '🚑 CLOSEST HOSPITAL' : '🏥 Emergency Hospital'}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                          {formatDistance(hosp.distanceKm)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-xs">{hosp.name}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{hosp.category}</p>
                      <div className="text-[10px] text-gray-500 space-y-0.5 font-mono pt-1">
                        <p>📍 {hosp.address}</p>
                        <p>📞 Phone: <strong>{hosp.phone}</strong></p>
                        <p>🏥 ICU Beds: <strong>{hosp.icuBeds} Available</strong></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* MAP LEGEND OVERLAY */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md text-[11px] space-y-1 font-semibold text-gray-800 dark:text-gray-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white animate-pulse" />
            <span>📸 My Live Web Camera</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">🚨</span>
            <span className="text-red-600 dark:text-red-400 font-black">Closest Police Station</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">🚑</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Closest Hospital</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 🌟 BIG FONTS CLEAN UI DISTANCE DISPLAY UNDERNEATH THE MAP 🌟 */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* PRIMARY CARD: NEAREST POLICE STATION DISTANCE (BIG FONT HERO UI) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-red-950 via-slate-950 to-red-900 border-2 border-red-600/90 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-5">
          {/* Subtle Ambient Red Glow Ring */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge & Header */}
          <div className="flex items-center justify-between gap-2 border-b border-red-800/60 pb-3 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg border border-red-400/50">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-300 font-black block">
                  LIVE PROXIMITY TELEMETRY
                </span>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  NEAREST POLICE STATION FROM LIVE WEB CAMERA
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600/90 text-white font-mono font-black text-xs border border-red-400/50 shadow-md">
              RAPID DISPATCH READY
            </span>
          </div>

          {/* GIANT DISTANCE DISPLAY & STATION TITLE */}
          <div className="space-y-2 z-10 my-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-xs uppercase font-bold text-red-200 tracking-wider">Closest Station:</span>
              <h4 className="text-xl sm:text-2xl font-black text-white underline decoration-red-500 decoration-2">
                {nearestPoliceStation.name}
              </h4>
            </div>

            {/* BIG FONTS DISTANCE STAT BOX */}
            <div className="bg-slate-900/90 border border-red-500/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
              <div>
                <span className="text-[11px] font-mono font-bold text-red-300 block uppercase tracking-widest">
                  EXACT GEODESIC DISTANCE
                </span>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-red-400 flex items-baseline gap-2">
                  <span>{formatDistance(nearestPoliceStation.distanceKm)}</span>
                  <span className="text-xs font-sans font-bold text-red-200 opacity-80">
                    from camera
                  </span>
                </div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-red-800/80 pt-3 sm:pt-0 sm:pl-5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 block uppercase">
                  ESTIMATED RAPID DRIVE TIME
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 flex items-center gap-1.5 font-mono">
                  <Clock className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>~{estDriveMinsPolice} MINS</span>
                </div>
                <span className="text-[10px] text-gray-300 font-semibold block">
                  (QRT Patrol Interceptor Unit)
                </span>
              </div>
            </div>
          </div>

          {/* TELEMETRY DETAILS & ACTION BUTTONS */}
          <div className="space-y-3 z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold bg-red-950/40 border border-red-800/40 p-3 rounded-xl">
              <div>
                <span className="text-gray-400 text-[11px] block">📍 Station Address:</span>
                <span className="text-white">{nearestPoliceStation.address}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] block">📞 Emergency Contact:</span>
                <span className="text-emerald-300 font-mono font-bold">{nearestPoliceStation.phone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={() => handleSimulateNemawarIntercept()}
                className="w-full sm:w-auto flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 text-center cursor-pointer active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>DISPATCH WHATSAPP (+91) & GMAIL ALERT</span>
              </button>

              <button
                onClick={() => {
                  setMapCenter([nearestPoliceStation.lat, nearestPoliceStation.lng]);
                  if (onDispatchAlert) {
                    onDispatchAlert(nearestPoliceStation);
                  }
                }}
                className="w-full sm:w-auto flex-1 py-3.5 px-4 rounded-xl bg-white text-slate-950 hover:bg-gray-100 font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-red-600" />
                <span>CENTER ROUTE ON MAP</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECONDARY CARD: NEAREST HOSPITAL DISTANCE */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 border-2 border-emerald-600/80 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border border-emerald-400/50">
                <Hospital className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-black block">
                  EMERGENCY MEDICAL PROXIMITY
                </span>
                <h3 className="text-base font-black text-white tracking-tight">
                  NEAREST TRAUMA HOSPITAL
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white font-mono font-black text-[10px]">
              24/7 OPEN
            </span>
          </div>

          {/* Distance & Details */}
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-200">Closest Hospital:</span>
              <h4 className="text-lg font-black text-white underline decoration-emerald-500 decoration-2">
                {nearestHospital.name}
              </h4>
              <p className="text-xs text-emerald-300 font-medium">{nearestHospital.category}</p>
            </div>

            {/* BIG FONT HOSPITAL DISTANCE STAT */}
            <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-300 block uppercase tracking-widest">
                DISTANCE FROM LIVE WEBCAM
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-400 flex items-baseline gap-2">
                <span>{formatDistance(nearestHospital.distanceKm)}</span>
                <span className="text-xs font-sans font-bold text-emerald-200 opacity-80">
                  (~{estDriveMinsHospital} min drive)
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-emerald-100 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 font-semibold">
              <p>🏥 ICU Beds Available: <strong className="text-white font-bold">{nearestHospital.icuBeds} Beds</strong></p>
              <p>🚑 Ambulances: <strong className="text-white font-bold">{nearestHospital.ambulances}</strong></p>
              <p>📞 Emergency Phone: <strong className="text-emerald-300 font-mono">{nearestHospital.phone}</strong></p>
            </div>
          </div>

          {/* Direct Instant WhatsApp & Email SOS Dispatch Button */}
          <button
            onClick={() => {
              const contactsToNotify = (dispatchPhoneNumbers && dispatchPhoneNumbers.length > 0)
                ? dispatchPhoneNumbers
                : [{ name: 'Duty Officer', number: '+91 9876543210', email: 'officer.sharma@gmail.com' }];

              contactsToNotify.forEach((contact) => {
                try {
                  fetch('http://127.0.0.1:8000/api/police/emergency-dispatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      targetName: "Emergency Medical SOS Alert",
                      targetId: "SOS-MEDICAL-01",
                      policeNumber: contact.number || nearestHospital.phone,
                      email: contact.email || 'officer.sharma@gmail.com',
                      crimeType: "Medical Emergency & Ambulance Dispatch",
                      cameraNode: "Live Web Camera Node",
                      confidence: "100%",
                      incidentDateTime: new Date().toLocaleTimeString()
                    })
                  }).then(r => r.json()).then(res => {
                    if (res.status === 'success' && showToast) {
                      showToast(
                        "🚑 Medical SOS Dispatched",
                        `WhatsApp (+91) & Gmail Medical SOS Alert sent to ${contact.name}!`,
                        "success"
                      );
                    }
                  });
                } catch(e) {
                  console.warn("Medical dispatch warning:", e);
                }
              });
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 text-center cursor-pointer active:scale-95"
          >
            <Hospital className="w-4 h-4" />
            <span>DISPATCH AMBULANCE WHATSAPP & GMAIL SOS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
