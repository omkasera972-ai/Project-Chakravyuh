import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import {
  Video,
  AlertTriangle,
  Car,
  User,
  Shield,
  Search,
  Navigation,
  Target,
  RefreshCw,
  UserCheck,
  ScanFace,
  Globe,
  Layers,
  Check,
  MapPin
} from 'lucide-react';

// Custom SVG map marker creators for system entities
const createCustomIcon = (bgColor, emoji, border = '#ffffff') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid ${border};
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 13px;
        font-weight: bold;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Google Maps-style Blue Dot Marker with Pulsing Ring for My Live Location
const googleBlueDotIcon = L.divIcon({
  className: 'google-blue-dot-marker',
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(66, 133, 244, 0.35);
        border: 1px solid rgba(66, 133, 244, 0.7);
        animation: pulse 1.8s infinite;
      "></div>
      <div style="
        background: #4285F4;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 12px rgba(66, 133, 244, 0.9);
        z-index: 10;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Marker Icons for specific module features
const camIcon = createCustomIcon('#2563eb', '📹');
const alertIcon = createCustomIcon('#ef4444', '⚠️');
const vehIcon = createCustomIcon('#eab308', '🚗');
const childIcon = createCustomIcon('#10b981', '🧒');
const personnelIcon = createCustomIcon('#6366f1', '🎓');
const suspectIcon = createCustomIcon('#dc2626', '👤');
const defenseIcon = createCustomIcon('#8b5cf6', '🛡️');

// Highway Shield Marker Creator (Subtle Minimal Badge)
const highwayShieldIcon = (code, color = '#3b82f6') => {
  return L.divIcon({
    className: 'highway-shield-marker',
    html: `
      <div style="
        background-color: rgba(15, 23, 42, 0.85);
        color: #e2e8f0;
        padding: 1.5px 6px;
        border-radius: 4px;
        border: 1px solid ${color};
        font-weight: 700;
        font-size: 9px;
        font-family: system-ui, sans-serif;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 3px;
      ">
        <span style="color: ${color};">🛣️</span>
        <span>${code}</span>
      </div>
    `,
    iconSize: [64, 18],
    iconAnchor: [32, 9]
  });
};

// Major Highways & Key Arterial Routes Dataset (Subtle Clean Highway Corridors)
const majorHighways = [
  {
    id: 'HWY-NH52',
    name: 'NH-52 (National Highway 52)',
    code: 'NH-52',
    color: '#3b82f6', // Subtle Royal Blue
    type: 'National Highway',
    positions: [
      [22.6500, 75.8000],
      [22.6900, 75.8300],
      [22.7240, 75.8650],
      [22.7600, 75.8900],
      [22.8000, 75.9200]
    ]
  },
  {
    id: 'HWY-ABROAD',
    name: 'AB Road (Agra-Bombay Arterial)',
    code: 'AB-ROAD',
    color: '#60a5fa', // Soft Light Blue
    type: 'Major Arterial Highway',
    positions: [
      [22.6800, 75.8400],
      [22.7150, 75.8550],
      [22.7350, 75.8750],
      [22.7700, 75.9000]
    ]
  },
  {
    id: 'HWY-RINGROAD',
    name: 'Indore Eastern Bypass & Ring Road',
    code: 'BYPASS-EXPR',
    color: '#34d399', // Soft Teal
    type: 'Expressway Bypass',
    positions: [
      [22.7000, 75.9000],
      [22.7300, 75.9200],
      [22.7700, 75.9100],
      [22.7900, 75.8700]
    ]
  },
  {
    id: 'HWY-SH27',
    name: 'SH-27 (State Highway 27)',
    code: 'SH-27',
    color: '#a78bfa', // Soft Purple
    type: 'State Highway',
    positions: [
      [22.7100, 75.8100],
      [22.7200, 75.8400],
      [22.7400, 75.8700],
      [22.7600, 75.9100]
    ]
  }
];

// Component to dynamically pan & re-center map view
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

// Component for picking location on click when in picker mode
const MapClickPicker = ({ isPickerMode, setPickedLocation }) => {
  useMapEvents({
    click(e) {
      if (!isPickerMode) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPickedLocation({ lat, lng, address: 'Fetching location address...' });

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setPickedLocation({ lat, lng, address: data.display_name });
          }
        })
        .catch(err => console.warn('Geocode error:', err));
    }
  });
  return null;
};

// Module Configurations & Descriptions
const MODULE_CONFIG = {
  attendance: {
    name: 'Attendance System',
    title: 'Attendance System - Geospatial Satellite Map',
    subtitle: 'Biometric Check-in Terminals, Attendance Alerts & On-Duty Staff Geo-Locations',
    color: 'blue',
    icon: UserCheck,
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  'criminal-tracking': {
    name: 'Criminal Tracking',
    title: 'Criminal Tracking - Geospatial Satellite Map',
    subtitle: 'AI Facial Recognition Nodes, Intercept Alerts & Watchlist Suspect Locations',
    color: 'rose',
    icon: ScanFace,
    badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  },
  anpr: {
    name: 'ANPR System',
    title: 'ANPR System - Geospatial Satellite Map',
    subtitle: 'Automatic Number Plate Cameras, Hot-listed Vehicles & Intercept Routes',
    color: 'amber',
    icon: Car,
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  'missing-child': {
    name: 'Missing Children',
    title: 'Missing Children - Geospatial Satellite Map',
    subtitle: 'Active Missing Child Cases, 800m Search Radius Zones & CCTV Surveillance',
    color: 'emerald',
    icon: User,
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  defence: {
    name: 'Defence Tracker',
    title: 'Defence Tracker - Geospatial Satellite Map',
    subtitle: 'Tactical Defense Perimeter, Munitions Depots & Perimeter Intrusion RADAR',
    color: 'indigo',
    icon: Shield,
    badgeBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  },
  all: {
    name: 'All Modules View',
    title: 'Master Command - Global Geospatial Satellite Map',
    subtitle: 'Unified Command View featuring telemetry from all 5 system modules',
    color: 'purple',
    icon: Globe,
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
};

export const Maps = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cameras,
    alerts,
    vehicles,
    missingChildren,
    personnel,
    watchlist,
    activeModule,
    setSelectedCameraForModal,
    showToast,
    userLocation: globalUserLocation,
    setPendingCameraLocation
  } = useApp();

  const isPickerMode = location.search.includes('mode=select-camera');
  const [pickedLocation, setPickedLocation] = useState(null);

  // Active module scope (Strictly locked to currently logged in module, e.g. 'attendance')
  const [selectedModuleScope, setSelectedModuleScope] = useState(() => activeModule || 'attendance');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Google Maps Tile Switcher ('google-hybrid' | 'google-roadmap' | 'google-terrain' | 'google-sat' | 'osm')
  const [mapTileType, setMapTileType] = useState('google-hybrid');

  // Nearby POIs State (Police Stations, Hospitals, Fuel, ATMs)
  const [nearbyPois, setNearbyPois] = useState([]);
  const [isFetchingPois, setIsFetchingPois] = useState(false);

  // Fetch Nearby POIs via OpenStreetMap Overpass API
  const fetchNearbyPois = async (amenity = 'all') => {
    setIsFetchingPois(true);
    const centerLat = mapCenter[0];
    const centerLng = mapCenter[1];
    let filter = 'amenity~"police|hospital|clinic|pharmacy|fuel|atm|bank|fire_station"';
    if (amenity === 'police') filter = 'amenity="police"';
    if (amenity === 'hospital') filter = 'amenity~"hospital|clinic"';
    if (amenity === 'fuel') filter = 'amenity="fuel"';
    if (amenity === 'atm') filter = 'amenity~"atm|bank"';

    try {
      const query = `[out:json];node(around:6000,${centerLat},${centerLng})[${filter}];out body 35;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.elements || []).map((el, i) => {
          let emoji = '📍';
          let color = '#3b82f6';
          let cat = 'Point of Interest';
          const a = el.tags?.amenity;
          if (a === 'police') { emoji = '🚔'; color = '#1e3a8a'; cat = 'Police Station'; }
          else if (a === 'hospital' || a === 'clinic') { emoji = '🏥'; color = '#047857'; cat = 'Emergency Hospital'; }
          else if (a === 'fuel') { emoji = '⛽'; color = '#d97706'; cat = 'Fuel Station'; }
          else if (a === 'atm' || a === 'bank') { emoji = '🏦'; color = '#0284c7'; cat = 'ATM / Bank'; }
          else if (a === 'fire_station') { emoji = '🚒'; color = '#dc2626'; cat = 'Fire Station'; }

          return {
            id: `POI-${el.id || i}`,
            name: el.tags?.name || `${cat} #${i+1}`,
            category: cat,
            emoji,
            color,
            lat: el.lat,
            lng: el.lon,
            address: el.tags?.['addr:street'] || el.tags?.['addr:full'] || 'Nearby Area',
            phone: el.tags?.phone || el.tags?.['contact:phone'] || '112 / 108 Emergency'
          };
        });
        setNearbyPois(results);
        showToast('Nearby Places Loaded', `Found ${results.length} nearby locations on map!`, 'success');
      }
    } catch (err) {
      console.warn("POI fetch error:", err);
      showToast('POI Error', 'Unable to load nearby places from OpenStreetMap', 'error');
    } finally {
      setIsFetchingPois(false);
    }
  };

  // Layer Toggles
  const [activeLayers, setActiveLayers] = useState({
    myLiveLocation: true,
    cameras: true,
    alerts: true,
    highways: true,
    vehicles: true,
    missingChildren: true,
    personnel: true,
    suspects: true,
    depots: true,
    nearbyPois: true
  });

  // Sync when activeModule changes in context
  useEffect(() => {
    if (activeModule) {
      setSelectedModuleScope(activeModule);
    }
  }, [activeModule]);

  // Default Fallback Center (Indore City Center)
  const defaultCenter = [22.7250, 75.8650];
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // My Live Location State
  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    accuracy: 30,
    hasPermission: false,
    timestamp: null
  });
  const [locationError, setLocationError] = useState(null);
  const [addressName, setAddressName] = useState('');
  const initialCenteredRef = useRef(false);

  // Searched Location Marker State
  const [searchedMarker, setSearchedMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Real Geocoding & Entity Location Search Function
  const handleLocationSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      // 1. Check if matching any local CCTV camera / entity node
      const matchingCam = cameras.find(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.code?.toLowerCase().includes(query.toLowerCase()) ||
        c.zone?.toLowerCase().includes(query.toLowerCase())
      );
      if (matchingCam && matchingCam.lat && matchingCam.lng) {
        setMapCenter([matchingCam.lat, matchingCam.lng]);
        setSearchedMarker({
          lat: matchingCam.lat,
          lng: matchingCam.lng,
          title: matchingCam.code || matchingCam.name,
          subtitle: matchingCam.zone
        });
        showToast('Node Found', `Panned map to camera node: ${matchingCam.code}`, 'success');
        setIsSearching(false);
        return;
      }

      // 2. Perform Real OpenStreetMap Geocoding Lookup (e.g. Mumbai, Indore, Bhopal, Delhi, Vijay Nagar, etc.)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const name = first.display_name?.split(',')[0] || query;

          setMapCenter([lat, lng]);
          setSearchedMarker({
            lat,
            lng,
            title: name,
            subtitle: first.display_name
          });
          showToast('Location Found', `Mapped location to ${name}`, 'success');
        } else {
          showToast('Search Result', `No GPS coordinates found matching "${query}"`, 'error');
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
      showToast('Search Error', 'Failed to perform geocoding lookup', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse Geocoding via OpenStreetMap Nominatim API
  const fetchAddressName = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.village || data.address?.county || '';
        const state = data.address?.state || '';
        const formatted = `${city}${state ? `, ${state}` : ''}` || data.display_name?.split(',')[0] || 'Current Position';
        setAddressName(formatted);
      }
    } catch (err) {
      console.warn('Reverse geocode warning:', err);
    }
  };

  const handleLocationError = (err) => {
    console.warn('Geolocation Error:', err.message);
    if (err.code === 1) {
      setLocationError('Enable location access to see your live position');
    } else {
      setLocationError('Unable to lock GPS position. Check location settings.');
    }
  };

  useEffect(() => {
    // Zero-latency instant sync from global AppContext cached GPS coordinates
    if (globalUserLocation && globalUserLocation.lat && globalUserLocation.lng) {
      const lat = globalUserLocation.lat;
      const lng = globalUserLocation.lng;
      const accuracy = Math.round(globalUserLocation.accuracy) || 25;

      setUserLocation({
        lat,
        lng,
        accuracy,
        hasPermission: true,
        timestamp: new Date(globalUserLocation.timestamp || Date.now()).toLocaleTimeString()
      });
      setLocationError(null);

      if (!initialCenteredRef.current) {
        setMapCenter([lat, lng]);
        initialCenteredRef.current = true;
      }
      fetchAddressName(lat, lng);
    }

    let watchId = null;
    const initGeolocation = () => {
      if (!('geolocation' in navigator)) {
        setLocationError('Geolocation API is not supported by your browser.');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy) || 25;

          setUserLocation({
            lat,
            lng,
            accuracy,
            hasPermission: true,
            timestamp: new Date().toLocaleTimeString()
          });
          setLocationError(null);

          if (!initialCenteredRef.current) {
            setMapCenter([lat, lng]);
            initialCenteredRef.current = true;
          }
        },
        (err) => {
          handleLocationError(err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    };

    initGeolocation();

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [globalUserLocation?.lat, globalUserLocation?.lng]);

  const recenterToUser = () => {
    if (userLocation.lat && userLocation.lng) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      showToast('Map Recentered', `Centered on My Live Location (${addressName || 'GPS Locked'})`, 'success');
    } else {
      retryPermissionRequest();
    }
  };

  const retryPermissionRequest = () => {
    setLocationError(null);
    if (globalUserLocation && globalUserLocation.lat && globalUserLocation.lng) {
      const lat = globalUserLocation.lat;
      const lng = globalUserLocation.lng;
      setUserLocation({
        lat,
        lng,
        accuracy: Math.round(globalUserLocation.accuracy) || 25,
        hasPermission: true,
        timestamp: new Date().toLocaleTimeString()
      });
      setMapCenter([lat, lng]);
      fetchAddressName(lat, lng);
      showToast('Location Enabled', 'Live GPS position synced instantly!', 'success');
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy) || 25;

          setUserLocation({
            lat,
            lng,
            accuracy,
            hasPermission: true,
            timestamp: new Date().toLocaleTimeString()
          });
          setMapCenter([lat, lng]);
          setLocationError(null);
          fetchAddressName(lat, lng);
          showToast('Location Enabled', 'Live GPS position synced successfully!', 'success');
        },
        (err) => {
          handleLocationError(err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // --- MODULE FILTERING LOGIC ---

  // 1. Filter Alerts by active module scope
  const filteredAlerts = alerts.filter(a => {
    if (selectedModuleScope !== 'all' && a.module && a.module !== selectedModuleScope) {
      return false;
    }
    const q = searchQuery.toLowerCase();
    return !searchQuery || a.title?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q);
  });

  // 2. Filter Cameras by active module scope
  const filteredCameras = cameras.filter(c => {
    if (selectedModuleScope !== 'all') {
      if (selectedModuleScope === 'attendance') {
        const isAttendanceCam = c.id === 'CAM-DESKTOP' || c.code?.includes('Cam 01') || c.code?.includes('Cam 02') || c.code?.includes('Cam 05') || c.zone?.toLowerCase().includes('entrance') || c.zone?.toLowerCase().includes('biometric') || c.module === 'attendance';
        if (!isAttendanceCam) return false;
      } else if (selectedModuleScope === 'criminal-tracking') {
        const isCriminalCam = c.code?.includes('Cam 03') || c.code?.includes('Cam 04') || c.zone?.toLowerCase().includes('academic') || c.zone?.toLowerCase().includes('library') || c.module === 'criminal-tracking';
        if (!isCriminalCam) return false;
      } else if (selectedModuleScope === 'anpr') {
        const isAnprCam = c.code?.includes('Cam 06') || c.type?.toLowerCase().includes('lpr') || c.zone?.toLowerCase().includes('gate') || c.module === 'anpr';
        if (!isAnprCam) return false;
      } else if (selectedModuleScope === 'missing-child') {
        const isMcCam = c.code?.includes('Cam 02') || c.code?.includes('Cam 04') || c.code?.includes('Cam 05') || c.module === 'missing-child';
        if (!isMcCam) return false;
      } else if (selectedModuleScope === 'defence') {
        const isDefCam = c.code?.includes('Cam 06') || c.zone?.toLowerCase().includes('sports') || c.zone?.toLowerCase().includes('perimeter') || c.module === 'defence';
        if (!isDefCam) return false;
      }
    }
    const q = searchQuery.toLowerCase();
    return !searchQuery || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.zone?.toLowerCase().includes(q);
  });

  // 3. Filter ANPR Vehicles (shown ONLY in ANPR or ALL scope)
  const filteredVehicles = (selectedModuleScope === 'anpr' || selectedModuleScope === 'all')
    ? vehicles.filter(v => {
        const q = searchQuery.toLowerCase();
        return !searchQuery || v.plate?.toLowerCase().includes(q) || v.type?.toLowerCase().includes(q) || v.reason?.toLowerCase().includes(q);
      })
    : [];

  // 4. Filter Missing Children (shown ONLY in Missing Children or ALL scope)
  const sampleMissingChildren = [
    { id: 'MC-2026-081', name: 'Aarav Sharma', age: 7, status: 'Active Search', lastSeenLocation: 'Vijay Nagar Central Park', lat: 22.7480, lng: 75.8920, description: 'Wearing blue jacket & black school bag' },
    { id: 'MC-2026-094', name: 'Priya Patel', age: 5, status: 'Active Search', lastSeenLocation: 'Central Railway Station Platform 4', lat: 22.7150, lng: 75.8600, description: 'Red frock, white shoes' }
  ];
  const displayChildrenList = (missingChildren && missingChildren.length > 0) ? missingChildren : sampleMissingChildren;
  const filteredChildren = (selectedModuleScope === 'missing-child' || selectedModuleScope === 'all')
    ? displayChildrenList.filter(ch => {
        const q = searchQuery.toLowerCase();
        return !searchQuery || ch.name?.toLowerCase().includes(q) || ch.lastSeenLocation?.toLowerCase().includes(q) || ch.id?.toLowerCase().includes(q);
      })
    : [];

  // 5. Filter Attendance Duty Personnel & Faculty Check-ins (shown ONLY in Attendance or ALL scope)
  const filteredAttendancePersonnel = (selectedModuleScope === 'attendance' || selectedModuleScope === 'all')
    ? (personnel || []).filter(p => {
        const isPresent = p.status === 'Present' || (p.entry && p.entry !== '--');
        if (!isPresent) return false;
        const q = searchQuery.toLowerCase();
        return !searchQuery || p.name?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q) || p.designation?.toLowerCase().includes(q);
      }).map((p, idx) => {
        const baseLat = 22.7240 + ((idx % 4) * 0.0035 - 0.005);
        const baseLng = 75.8650 + ((idx % 3) * 0.0045 - 0.004);
        return {
          ...p,
          lat: p.lat || baseLat,
          lng: p.lng || baseLng
        };
      })
    : [];

  // 6. Filter Criminal Watchlist Suspects (shown ONLY in Criminal Tracking or ALL scope)
  const filteredSuspects = (selectedModuleScope === 'criminal-tracking' || selectedModuleScope === 'all')
    ? (watchlist || []).filter(w => {
        const q = searchQuery.toLowerCase();
        return !searchQuery || w.name?.toLowerCase().includes(q) || w.crimeType?.toLowerCase().includes(q) || w.lastSeen?.toLowerCase().includes(q);
      }).map((w, idx) => {
        const baseLat = 22.7300 + ((idx % 4) * 0.005 - 0.008);
        const baseLng = 75.8750 + ((idx % 3) * 0.005 - 0.005);
        return {
          ...w,
          lat: w.lat || baseLat,
          lng: w.lng || baseLng
        };
      })
    : [];

  // 7. Filter Defense Armory & Depot Vault Nodes (shown ONLY in Defence or ALL scope)
  const defenseDepots = (selectedModuleScope === 'defence' || selectedModuleScope === 'all')
    ? [
        { id: 'DEP-VAL-01', name: 'Armory Vault 1 (INSAS & Munitions)', location: 'Underground Armory Bunker - Sector 1', status: 'Secure (Automated RFID)', lat: 22.7310, lng: 75.8620, type: 'Vault' },
        { id: 'DEP-VAL-02', name: 'Depot B Sector 4 (Level IV Armor)', location: 'Tactical Supply Depot - Sector 4', status: 'Secure', lat: 22.7350, lng: 75.8580, type: 'Depot' },
        { id: 'DEP-VAL-03', name: 'Control Room (UHF Comms & EW)', location: 'Central Radar Command Station', status: 'Active RADAR Surveillance', lat: 22.7280, lng: 75.8690, type: 'Radar' }
      ].filter(d => {
        const q = searchQuery.toLowerCase();
        return !searchQuery || d.name?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q);
      })
    : [];

  const currentConfig = MODULE_CONFIG[selectedModuleScope] || MODULE_CONFIG.attendance;

  return (
    <div className="relative select-none h-[calc(100vh-6rem)] min-h-[580px] w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
      
      {/* 🌟 PICKER MODE TOP BANNER */}
      {isPickerMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600/95 text-white px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-blue-400/40 flex items-center gap-3 text-xs sm:text-sm font-medium animate-pulse">
          <MapPin className="w-5 h-5 text-white shrink-0" />
          <span>📍 LIVE MAP LOCATION PICKER MODE: Click anywhere on map to mark location</span>
        </div>
      )}

      {/* Location Permission Warning Banner */}
      {locationError && !isPickerMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 backdrop-blur-md text-slate-950 p-2 px-4 rounded-full flex items-center gap-3 text-xs font-bold shadow-xl animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-slate-950" />
          <span>{locationError}</span>
          <button
            onClick={retryPermissionRequest}
            className="px-2.5 py-1 rounded-full bg-slate-950 text-amber-400 text-[10px] uppercase tracking-wider font-extrabold hover:bg-slate-900 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 🌟 FLOATING REAL WORKING SEARCH BAR (EXACT MATCH TO INSERTED PHOTO) */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 max-w-xs sm:max-w-sm w-full">
        <form onSubmit={handleLocationSearch} className="w-full flex items-center bg-white text-gray-800 rounded-full shadow-2xl border border-gray-200 px-4 py-2.5 transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, node or area..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none pr-2 font-normal"
          />
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-2.5 flex-shrink-0">
            <button type="submit" title="Search Location" className="text-gray-600 hover:text-blue-600 cursor-pointer">
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> : <Search className="w-4.5 h-4.5 stroke-[2.2]" />}
            </button>
            <button
              type="button"
              onClick={recenterToUser}
              title="Directions / Live GPS Location"
              className="w-8 h-8 rounded-full bg-[#00838f] text-white flex items-center justify-center hover:bg-[#006064] transition-all cursor-pointer shadow-md active:scale-95 ml-0.5"
            >
              <Navigation className="w-4 h-4 fill-current transform rotate-45" />
            </button>
          </div>
        </form>
      </div>

      {/* 🌟 FLOATING TOP-RIGHT QUICK CONTROLS */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
        {/* Google Maps Style Dropdown Selector */}
        <select
          value={mapTileType}
          onChange={(e) => setMapTileType(e.target.value)}
          className="px-3 py-2 rounded-full text-xs font-bold shadow-xl border border-gray-300 bg-white/95 text-gray-800 dark:bg-slate-900/95 dark:text-white dark:border-gray-700 backdrop-blur-md cursor-pointer focus:outline-none"
        >
          <option value="google-hybrid">🛰️ Google Hybrid (Satellite + Roads)</option>
          <option value="google-roadmap">🗺️ Google Streets (Roadmap)</option>
          <option value="google-terrain">🏔️ Google Terrain</option>
          <option value="google-sat">📷 Google Satellite (Pure)</option>
          <option value="osm">🌐 OpenStreetMap</option>
          <option value="esri">🛰️ Esri Satellite</option>
        </select>

        {/* Live Nearby POI Fetcher Button */}
        <button
          onClick={() => fetchNearbyPois('all')}
          disabled={isFetchingPois}
          className="px-3 py-2 rounded-full text-xs font-bold shadow-xl border backdrop-blur-md flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/40 cursor-pointer active:scale-95 disabled:opacity-50"
          title="Fetch Nearby Police Stations, Hospitals, Fuel & ATMs around current position"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPois ? 'animate-spin' : ''}`} />
          <span>{isFetchingPois ? 'Loading POIs...' : '📍 Nearby POIs'}</span>
        </button>

        <button
          onClick={() => toggleLayer('highways')}
          className={`px-3 py-2 rounded-full text-xs font-bold shadow-xl border backdrop-blur-md flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
            activeLayers.highways
              ? 'bg-amber-600/95 text-white border-amber-400/50 ring-1 ring-amber-400/40'
              : 'bg-white/95 text-gray-800 border-gray-300 dark:bg-slate-900/95 dark:text-white dark:border-gray-700'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Highways</span>
        </button>

        <button
          onClick={recenterToUser}
          title="Recenter Map"
          className="w-9 h-9 rounded-full bg-white text-blue-600 border border-gray-300 shadow-xl flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer active:scale-95 dark:bg-slate-900 dark:text-blue-400 dark:border-gray-700"
        >
          <Target className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        zoomControl={false}
        preferCanvas={true}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
        className="z-10"
      >
        {/* Dynamic Recenter */}
        <RecenterMap center={mapCenter} />

        {/* Picker Mode Click Handler */}
        <MapClickPicker isPickerMode={isPickerMode} setPickedLocation={setPickedLocation} />

        {/* Selected Picked Location Marker */}
        {isPickerMode && pickedLocation && (
          <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={createCustomIcon('#dc2626', '📍')}>
            <Popup defaultOpen>
              <div className="p-1 space-y-1 text-xs">
                <strong className="text-red-500 block font-bold">📍 Marked Camera Location</strong>
                <p className="text-gray-300 text-[11px] font-normal">{pickedLocation.address}</p>
                <p className="text-blue-400 font-mono text-[10px]">{pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Searched Location Marker */}
        {searchedMarker && (
          <Marker position={[searchedMarker.lat, searchedMarker.lng]} icon={createCustomIcon('#ec4899', '📍')}>
            <Popup defaultOpen>
              <div className="p-1 space-y-1 text-xs">
                <strong className="text-white block text-sm font-bold">📍 {searchedMarker.title}</strong>
                <p className="text-neutral-300 text-[11px]">{searchedMarker.subtitle}</p>
                <p className="text-emerald-400 font-mono text-[10px]">GPS: {searchedMarker.lat.toFixed(4)}, {searchedMarker.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

          {/* 🛰️ Dynamic Google Maps & Alternative High-Performance Tile Layers */}
          {mapTileType === 'google-hybrid' && (
            <TileLayer
              key="google-hybrid"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              crossOrigin="anonymous"
            />
          )}
          {mapTileType === 'google-roadmap' && (
            <TileLayer
              key="google-roadmap"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              crossOrigin="anonymous"
            />
          )}
          {mapTileType === 'google-terrain' && (
            <TileLayer
              key="google-terrain"
              url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              crossOrigin="anonymous"
            />
          )}
          {mapTileType === 'google-sat' && (
            <TileLayer
              key="google-sat"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              crossOrigin="anonymous"
            />
          )}
          {mapTileType === 'osm' && (
            <TileLayer
              key="osm-fast"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxNativeZoom={18}
              maxZoom={19}
              keepBuffer={4}
              crossOrigin="anonymous"
            />
          )}
          {mapTileType === 'esri' && (
            <TileLayer
              key="esri-satellite-fast"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri World Imagery"
              maxNativeZoom={18}
              maxZoom={19}
              keepBuffer={4}
              crossOrigin="anonymous"
            />
          )}

          {/* 🛣️ Clean Moderate Highway Routes Overlay */}
          {activeLayers.highways && majorHighways.map((hwy) => (
            <React.Fragment key={hwy.id}>
              <Polyline
                positions={hwy.positions}
                color={hwy.color || '#3b82f6'}
                weight={2.8}
                opacity={0.75}
              />
              <Marker
                position={hwy.positions[Math.floor(hwy.positions.length / 2)]}
                icon={highwayShieldIcon(hwy.code, hwy.color || '#3b82f6')}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <strong className="text-white block font-bold">{hwy.name}</strong>
                    <span className="text-blue-400 font-mono text-[10px]">{hwy.type}</span>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* MY LIVE LOCATION BLUE DOT MARKER & ACCURACY CIRCLE */}
          {activeLayers.myLiveLocation && userLocation.lat && userLocation.lng && (
            <React.Fragment key="my-live-location">
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy * 2}
                pathOptions={{
                  color: '#4285F4',
                  fillColor: '#4285F4',
                  fillOpacity: 0.15,
                  weight: 1
                }}
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={googleBlueDotIcon}>
                <Popup>
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-700 pb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                        <strong className="text-white text-sm block">My Live Location</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
                        GPS TRACKING
                      </span>
                    </div>

                    <div className="space-y-1 text-neutral-300">
                      {addressName && (
                        <p className="font-bold text-blue-300 text-xs">📍 {addressName}</p>
                      )}
                      <p className="font-mono text-[11px]">
                        {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Accuracy Margin: ±{userLocation.accuracy} meters • Updated: {userLocation.timestamp}
                      </p>
                    </div>

                    <button
                      onClick={recenterToUser}
                      className="w-full mt-1 py-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center space-x-1"
                    >
                      <Target className="w-3 h-3" />
                      <span>Recenter View</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )}

          {/* Module-Filtered Node Cameras */}
          {activeLayers.cameras && filteredCameras.map((cam) => (
            <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={camIcon}>
              <Popup>
                <div className="p-1 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-neutral-700 pb-1">
                    <strong className="text-white text-sm">{cam.code}</strong>
                    <span className="text-[10px] text-emerald-400 font-bold">{cam.status}</span>
                  </div>
                  <p className="text-neutral-300">{cam.zone}</p>
                  <p className="text-neutral-400 font-mono text-[10px]">{cam.type}</p>
                  <button
                    onClick={() => setSelectedCameraForModal(cam)}
                    className="w-full mt-1 py-1 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold border border-neutral-600"
                  >
                    Open Live Video Feed
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Module-Filtered Alerts */}
          {activeLayers.alerts && (filteredAlerts || []).map((alt, idx) => {
            const rawId = String(alt?.id || alt?._id || alt?.alert_id || idx);
            const numericId = parseInt(rawId.replace(/\D/g, '')) || idx;
            const lat = alt?.lat || (22.7200 + (numericId % 10) * 0.004);
            const lng = alt?.lng || (75.8500 + (numericId % 7) * 0.005);
            return (
              <Marker key={alt?.id || alt?._id || idx} position={[lat, lng]} icon={alertIcon}>
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                      <strong className="text-white block text-xs">{alt?.title || 'Alert'}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">{alt?.priority || 'High'}</span>
                    </div>
                    <p className="text-neutral-300">{alt?.location || 'Unknown Location'}</p>
                    <p className="text-neutral-400 text-[10px]">{alt?.description || ''}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Attendance Module: On-Duty Personnel Check-ins */}
          {activeLayers.personnel && (selectedModuleScope === 'attendance' || selectedModuleScope === 'all') && (filteredAttendancePersonnel || []).map((p, idx) => {
            const pos = [p.lat || (22.7196 + (idx % 5) * 0.005), p.lng || (75.8577 + (idx % 7) * 0.006)];
            return (
              <Marker key={p.id || idx} position={pos} icon={personnelIcon}>
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                      <strong className="text-white block text-sm">{p.name || 'Personnel'}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono text-[9px] font-bold">ATTENDANCE</span>
                    </div>
                    <p className="text-indigo-300 font-semibold">{p.designation || p.role || 'Student'} • {p.department || 'General'}</p>
                    <p className="text-neutral-300 text-[11px]">Badge: {p.badgeId || p.id || '--'}</p>
                    <p className="text-emerald-400 text-[10px] font-bold">Checked-in Entry: {p.entry || '09:15 AM'}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Criminal Tracking Module: Watchlist Suspect Locations */}
          {activeLayers.suspects && (selectedModuleScope === 'criminal-tracking' || selectedModuleScope === 'all') && (filteredSuspects || []).map((s, idx) => {
            const pos = [s.lat || (22.7300 + (idx % 4) * 0.006), s.lng || (75.8600 + (idx % 6) * 0.007)];
            return (
              <Marker key={s.id || idx} position={pos} icon={suspectIcon}>
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                      <strong className="text-white block text-sm">{s.name || 'Suspect Target'}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">SUSPECT</span>
                    </div>
                    <p className="text-rose-400 font-bold">{s.crimeType || s.charges || 'Watchlist Target'} ({s.riskLevel || 'Flagged'})</p>
                    <p className="text-neutral-300 text-[10px]">Last Seen: {s.lastSeen || s.location || 'Tracked'}</p>
                    <p className="text-neutral-400 text-[10px]">AI Match Confidence: {s.confidence || '94%'}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ANPR Module: Vehicle Routes & Intercept Markers */}
          {activeLayers.vehicles && (selectedModuleScope === 'anpr' || selectedModuleScope === 'all') && (filteredVehicles || []).map((veh, idx) => {
            const hasRoute = Array.isArray(veh.route) && veh.route.length > 0;
            const fallbackPos = [veh.lat || (22.7240 + (idx % 4) * 0.005), veh.lng || (75.8650 + (idx % 6) * 0.006)];
            const pos = hasRoute ? veh.route[veh.route.length - 1] : fallbackPos;
            const plateStr = veh.plate || veh.plate_number || veh.number_plate || veh.id || `VEH-${idx + 1}`;
            const typeStr = veh.type || veh.category || veh.vehicle_type || 'Vehicle';

            return (
              <React.Fragment key={veh.id || plateStr || idx}>
                {hasRoute && (
                  <Polyline
                    positions={veh.route}
                    color={veh.status === 'Blacklisted' ? '#ef4444' : '#f59e0b'}
                    dashArray={veh.status === 'Blacklisted' ? '6, 6' : null}
                    weight={3}
                    opacity={0.85}
                  />
                )}
                <Marker position={pos} icon={vehIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs">
                      <strong className="text-white font-mono block text-sm">{plateStr}</strong>
                      <p className="text-neutral-300 font-medium">{typeStr}</p>
                      <p className="text-red-400 font-bold">{veh.status || 'Active'} • {veh.speed || '64 km/h'}</p>
                      <p className="text-neutral-400 text-[10px]">{veh.reason || veh.details || 'ANPR Intercept Node'}</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Missing Children Module: Search Radius & Last Seen */}
          {activeLayers.missingChildren && (selectedModuleScope === 'missing-child' || selectedModuleScope === 'all') && (filteredChildren || []).map((child, idx) => {
            const pos = [child.lat || (22.7150 + (idx % 3) * 0.007), child.lng || (75.8450 + (idx % 5) * 0.008)];
            return (
              <React.Fragment key={child.id || idx}>
                <Circle
                  center={pos}
                  radius={800}
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
                />
                <Marker position={pos} icon={childIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs">
                      <strong className="text-white block text-sm">{child.name || child.child_name || 'Missing Child'} ({child.age || '--'} yrs)</strong>
                      <p className="text-emerald-400 font-bold">{child.status || 'Searching'}</p>
                      <p className="text-neutral-300">{child.lastSeenLocation || child.location || child.area || 'Search Zone'}</p>
                      <p className="text-neutral-400 text-[10px] italic">{child.description || child.details || 'Active Case'}</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Defence Module: Armory Depots & Vault Nodes */}
          {activeLayers.depots && (selectedModuleScope === 'defence' || selectedModuleScope === 'all') && defenseDepots.map((dep) => (
            <Marker key={dep.id} position={[dep.lat, dep.lng]} icon={defenseIcon}>
              <Popup>
                <div className="p-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                    <strong className="text-white block text-sm">{dep.name}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold">DEFENSE DEPOT</span>
                  </div>
                  <p className="text-purple-300 font-medium">{dep.location}</p>
                  <p className="text-emerald-400 font-bold text-[10px]">{dep.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Live OpenStreetMap Nearby POIs (Police, Hospitals, Fuel, ATMs) */}
          {activeLayers.nearbyPois && nearbyPois.map((poi) => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createCustomIcon(poi.color, poi.emoji)}>
              <Popup>
                <div className="p-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                    <strong className="text-white block text-sm">{poi.name}</strong>
                    <span className="px-1.5 py-0.5 rounded text-white font-mono text-[9px] font-bold" style={{ backgroundColor: poi.color }}>
                      {poi.category}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px]">📍 {poi.address}</p>
                  <p className="text-emerald-400 font-mono text-[10px]">📞 {poi.phone}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Dynamic Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-20 bg-[#121419]/90 backdrop-blur-md border border-[#272b36] p-3 rounded-lg text-xs space-y-1.5 text-neutral-300 shadow-xl max-w-xs">
          <span className="font-bold text-white text-[11px] uppercase tracking-wider block border-b border-[#232731] pb-1">
            Map Overlay Legend ({currentConfig.name})
          </span>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#4285F4] border-2 border-white animate-pulse" />
            <span className="font-bold text-blue-400">My Live Location (Blue Dot)</span>
          </div>

          {(selectedModuleScope === 'attendance' || selectedModuleScope === 'all') && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>On-Duty Staff / Biometric Entry</span>
            </div>
          )}

          {(selectedModuleScope === 'criminal-tracking' || selectedModuleScope === 'all') && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Watchlist Suspect Intercept</span>
            </div>
          )}

          {(selectedModuleScope === 'anpr' || selectedModuleScope === 'all') && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>ANPR Vehicle Trail</span>
            </div>
          )}

          {(selectedModuleScope === 'missing-child' || selectedModuleScope === 'all') && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Missing Child 800m Zone</span>
            </div>
          )}

          {(selectedModuleScope === 'defence' || selectedModuleScope === 'all') && (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Defense Armory / RADAR Node</span>
            </div>
          )}
        </div>

      {/* 🌟 PICKER MODE BOTTOM CONFIRMATION PANEL */}
      {isPickerMode && pickedLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-gray-700 text-white p-4 px-6 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl w-full animate-in slide-in-from-bottom-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-3 text-xs font-mono text-blue-400">
              <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Lat: {pickedLocation.lat.toFixed(5)}</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Lng: {pickedLocation.lng.toFixed(5)}</span>
            </div>
            <p className="text-xs text-gray-300 truncate font-normal">{pickedLocation.address}</p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                const mod = activeModule || 'criminal-tracking';
                const searchParams = new URLSearchParams(location.search);
                const targetPage = searchParams.get('from') === 'settings' || searchParams.get('mode') === 'select-station' ? 'settings' : 'cameras';
                navigate(`/portal/${mod}/${targetPage}`);
              }}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-slate-800 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPendingCameraLocation(pickedLocation);
                const mod = activeModule || 'criminal-tracking';
                const searchParams = new URLSearchParams(location.search);
                const targetPage = searchParams.get('from') === 'settings' || searchParams.get('mode') === 'select-station' ? 'settings' : 'cameras';
                navigate(`/portal/${mod}/${targetPage}`);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Save Location</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
