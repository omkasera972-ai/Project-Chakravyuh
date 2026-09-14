import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialKPIs,
  initialCameras,
  initialAlerts,
  initialPersonnel,
  initialWatchlist,
  initialVehicles,
  initialMissingChildren,
  initialDepotInventory,
  initialMovementLogs,
  crimeOverviewData,
  incidentsOverTimeData,
} from '../data/mockData';
import { formatISTDate, formatISTTime, safeSetLocalStorage, getApiBaseUrl, compressImageDataUrl } from '../utils/dateUtils';

const AppContext = createContext();

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) {
    return typeof timestamp === 'string' ? timestamp : 'Just now';
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - dateObj.getTime());
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const getRealIsoTimestamp = (alt) => {
  if (!alt) return new Date().toISOString();
  const candidates = [alt.timestamp, alt.created_at, alt.createdAt, alt.time, alt.full_datetime];
  for (let cand of candidates) {
    if (!cand) continue;
    let str = String(cand).trim().replace(/\s*IST\s*$/i, '');
    let parsed = new Date(str).getTime();
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
};

export const formatRealDateTime = (timestamp) => {
  if (!timestamp) return '';
  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) return String(timestamp);
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getCachedData = (key, fallback = []) => {
  try {
    const savedUser = localStorage.getItem('sda_user');
    const token = localStorage.getItem('sda_token');
    if (!token || !savedUser || savedUser === 'undefined' || savedUser === 'null') {
      return fallback;
    }

    const saved = localStorage.getItem(key);
    if (saved && saved !== 'undefined' && saved !== 'null') {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return fallback;
};

const setCachedData = (key, data) => {
  try {
    if (Array.isArray(data)) {
      const cleanData = data.slice(0, 100).map(item => {
        if (item && item.photoUrl && typeof item.photoUrl === 'string' && item.photoUrl.length > 50000) {
          const { photoUrl, ...rest } = item;
          return rest;
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(cleanData));
    }
  } catch (e) {}
};

const purgeObsoleteLocalStorage = () => {
  const obsoleteKeys = [
    'sda_personnel',
    'sda_watchlist',
    'sda_vehicles',
    'sda_missing_children',
    'sda_inventory',
    'sda_movement_logs',
    'sda_detection_reports',
    'sda_alerts',
    'sda_kpis',
    'sda_cameras',
    'sda_history_logs'
  ];
  obsoleteKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  });
};

export const AppProvider = ({ children }) => {
  const isFetchingRef = React.useRef(false);
  const deletedPersonnelIdsRef = React.useRef(new Set());

  // Authentication & Module State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('sda_auth') === 'true';
  });

  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem('sda_active_module') || 'attendance';
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sda_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AppContext] Failed to parse sda_user from localStorage:', e);
    }
    return {
      name: 'Command Admin',
      role: 'Super Officer',
      badge: 'BADGE-SYS-2026',
      unit: 'Central Command & Control'
    };
  });

  // Continuous Live GPS Geolocation Tracking State (Zero-latency cached coordinates)
  const [userLocation, setUserLocation] = useState({
    lat: 22.7240,
    lng: 75.8650,
    accuracy: null,
    isRealGps: false,
    timestamp: Date.now()
  });

  useEffect(() => {
    let watchId = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            isRealGps: true,
            timestamp: pos.timestamp || Date.now()
          });
        },
        (err) => {
          console.warn("[GPS] Continuous tracking notice:", err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    }
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // --- OFFICER INFORMATION MONGO DB CRUD API SYNC (Criminal_traking -> officer_information) ---
  const [officers, setOfficers] = useState([]);
  const [dispatchPhoneNumbers, setDispatchPhoneNumbers] = useState([]);
  const isFetchingOfficersRef = React.useRef(false);
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('sda_token');
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const targetUrl = url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, getApiBaseUrl());
    const res = await fetch(targetUrl, { ...options, headers });
    if (res.status === 401) {
      console.warn('[authFetch] 401 Unauthorized encountered, purging stale session token');
      localStorage.removeItem('sda_token');
      localStorage.removeItem('sda_user');
      localStorage.removeItem('sda_auth');
    }
    return res;
  };


  const fetchOfficers = async () => {
    const token = localStorage.getItem('sda_token');
    if (!token) {
      setOfficers([]);
      setDispatchPhoneNumbers([]);
      return;
    }
    if (isFetchingOfficersRef.current) return;
    isFetchingOfficersRef.current = true;
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/criminal/officer_information');
      if (res.ok) {
        const result = await res.json();
        if (result && result.status === 'success' && Array.isArray(result.data)) {
          const list = result.data.map(doc => {
            const locObj = typeof doc.police_station_location === 'object' && doc.police_station_location ? doc.police_station_location : {};
            const latVal = doc.latitude !== undefined && doc.latitude !== null ? parseFloat(doc.latitude) : (locObj.latitude !== undefined && locObj.latitude !== null ? parseFloat(locObj.latitude) : null);
            const lngVal = doc.longitude !== undefined && doc.longitude !== null ? parseFloat(doc.longitude) : (locObj.longitude !== undefined && locObj.longitude !== null ? parseFloat(locObj.longitude) : null);
            const mapLink = doc.map_link || locObj.map_link || (latVal && lngVal ? `https://maps.google.com/?q=${latVal},${lngVal}` : '');
            const stationLocText = doc.police_station_location?.address || doc.stationLocation || doc.location || doc.address || 'Police Station Location';

            return {
              mongo_id: doc.id || doc._id || doc.officer_id,
              id: doc.officer_id || doc.id || doc._id,
              officer_id: doc.officer_id || doc.officerId || doc.id || `OFFICER-${Math.floor(1000 + Math.random() * 9000)}`,
              officer_name: doc.officer_name || doc.name || 'Police Officer',
              name: doc.officer_name || doc.name || 'Police Officer',
              rank: doc.rank || doc.designation || 'Inspector',
              designation: doc.rank || doc.designation || 'Inspector',
              police_station_name: doc.police_station_name || doc.stationName || doc.station_name || 'Police Station',
              stationName: doc.police_station_name || doc.stationName || doc.station_name || 'Police Station',
              police_station_location: {
                address: stationLocText,
                latitude: latVal,
                longitude: lngVal,
                map_link: mapLink
              },
              location: stationLocText,
              address: stationLocText,
              stationLocation: stationLocText,
              latitude: latVal,
              longitude: lngVal,
              lat: latVal,
              lng: lngVal,
              map_link: mapLink,
              officer_email: doc.officer_email || doc.email || 'officer@police.gov.in',
              email: doc.officer_email || doc.email || 'officer@police.gov.in',
              created_at: doc.created_at || new Date().toISOString()
            };
          });
          setOfficers(list);
          setDispatchPhoneNumbers(list);
        }
      }
    } catch (e) {
      console.warn("Error fetching officer_information from MongoDB:", e);
    } finally {
      isFetchingOfficersRef.current = false;
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const addOfficer = async (offData) => {
    if (!offData) return;
    const latVal = offData.lat !== undefined && offData.lat !== null ? parseFloat(offData.lat) : (offData.latitude !== undefined && offData.latitude !== null ? parseFloat(offData.latitude) : null);
    const lngVal = offData.lng !== undefined && offData.lng !== null ? parseFloat(offData.lng) : (offData.longitude !== undefined && offData.longitude !== null ? parseFloat(offData.longitude) : null);
    const mapLink = latVal && lngVal ? `https://maps.google.com/?q=${latVal},${lngVal}` : (offData.map_link || '');
    const nowIso = new Date().toISOString();
    const locAddress = offData.stationLocation || offData.location || offData.address || 'Police Station Location';

    const payload = {
      officer_id: offData.officerId || offData.officer_id || offData.id || `OFFICER-${Math.floor(1000 + Math.random() * 9000)}`,
      officer_name: offData.name || offData.officer_name || 'Police Officer',
      rank: offData.rank || offData.designation || 'Inspector',
      police_station_name: offData.stationName || offData.police_station_name || 'Police Station',
      police_station_location: {
        address: locAddress,
        latitude: latVal,
        longitude: lngVal,
        map_link: mapLink
      },
      officer_email: offData.email || offData.officer_email || 'officer@police.gov.in',
      created_at: nowIso
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/criminal/officer_information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Officer Saved & Email Dispatched', `Officer ${payload.officer_name} saved in MongoDB and registration email dispatched to ${payload.officer_email}`, 'success');
        await fetchOfficers();
        return data;
      }
    } catch (e) {
      console.error("Error posting officer_information to MongoDB:", e);
    }

    // Fallback local add
    const fallbackOff = {
      ...payload,
      id: payload.officer_id,
      name: payload.officer_name,
      location: locAddress,
      stationLocation: locAddress,
      email: payload.officer_email,
      latitude: latVal,
      longitude: lngVal,
      map_link: mapLink
    };
    setOfficers(prev => [fallbackOff, ...prev]);
    setDispatchPhoneNumbers(prev => [fallbackOff, ...prev]);
    showToast('Officer Saved', `Officer ${payload.officer_name} saved to session.`, 'info');
    return fallbackOff;
  };

  const updateOfficer = async (id, updateData) => {
    const target = officers.find(o => o.id === id || o.officer_id === id || o.mongo_id === id);
    const docId = target?.mongo_id || id;
    const latVal = updateData.lat !== undefined ? parseFloat(updateData.lat) : (target?.latitude || null);
    const lngVal = updateData.lng !== undefined ? parseFloat(updateData.lng) : (target?.longitude || null);
    const mapLink = latVal && lngVal ? `https://maps.google.com/?q=${latVal},${lngVal}` : (target?.map_link || '');
    const locAddress = updateData.stationLocation || updateData.location || target?.location || 'Police Station Location';

    const payload = {
      officer_id: updateData.officer_id || updateData.officerId || target?.officer_id || id,
      officer_name: updateData.officer_name || updateData.name || target?.officer_name || 'Police Officer',
      rank: updateData.rank || updateData.designation || target?.rank || 'Inspector',
      police_station_name: updateData.police_station_name || updateData.stationName || target?.police_station_name || 'Police Station',
      police_station_location: {
        address: locAddress,
        latitude: latVal,
        longitude: lngVal,
        map_link: mapLink
      },
      officer_email: updateData.officer_email || updateData.email || target?.officer_email || 'officer@police.gov.in'
    };

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/criminal/officer_information/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Officer Updated', `Officer ${payload.officer_name} updated in MongoDB`, 'success');
        await fetchOfficers();
        return;
      }
    } catch (e) {
      console.error("Error updating officer in MongoDB:", e);
    }

    setOfficers(prev => prev.map(o => (o.id === id || o.officer_id === id ? { ...o, ...payload } : o)));
  };

  const deleteOfficer = async (id) => {
    if (!id) return;
    const target = officers.find(o => o.id === id || o.officer_id === id || o.mongo_id === id);
    const docId = target?.mongo_id || id;

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/criminal/officer_information/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Officer Deleted', `Document removed from Criminal_traking.officer_information`, 'info');
        await fetchOfficers();
        return;
      }
    } catch (e) {
      console.error("Error deleting officer from MongoDB:", e);
    }

    setOfficers(prev => prev.filter(o => o.id !== id && o.officer_id !== id && o.mongo_id !== id));
    setDispatchPhoneNumbers(prev => prev.filter(o => o.id !== id && o.officer_id !== id));
    showToast('Officer Removed', `Officer ${id} removed from session.`, 'info');
  };

  const addDispatchNumber = (contact) => addOfficer(contact);
  const removeDispatchNumber = (id) => deleteOfficer(id);

  // Core Datasets (MongoDB Atlas is source of truth - in-memory state only)
  const [kpis, setKpis] = useState(initialKPIs);
  const [cameras, setCameras] = useState([]);
  const [pendingCameraLocation, setPendingCameraLocation] = useState(null);

  // --- CAMERA NETWORK MONGO DB CRUD API SYNC (Criminal_traking -> camera_network) ---
  const fetchCameras = async () => {
    const token = localStorage.getItem('sda_token');
    if (!token) {
      setCameras([]);
      return;
    }
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/criminal/camera_network');
      if (res.ok) {
        const result = await res.json();
        if (result && result.status === 'success' && Array.isArray(result.data)) {
          const list = result.data.map(doc => {
            const latVal = doc.latitude !== undefined ? parseFloat(doc.latitude) : (doc.lat !== undefined ? parseFloat(doc.lat) : 22.7196);
            const lngVal = doc.longitude !== undefined ? parseFloat(doc.longitude) : (doc.lng !== undefined ? parseFloat(doc.lng) : 75.8577);
            const mapLink = doc.map_link || `https://maps.google.com/?q=${latVal},${lngVal}`;

            return {
              id: doc.camera_id || doc.id || doc._id,
              mongo_id: doc.id || doc._id || doc.camera_id,
              camera_id: doc.camera_id || doc.id || `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
              name: doc.camera_name || doc.name || 'Security CCTV Node',
              camera_name: doc.camera_name || doc.name || 'Security CCTV Node',
              location: doc.location || doc.address || 'City Location',
              address: doc.location || doc.address || 'City Location',
              lat: latVal,
              lng: lngVal,
              latitude: latVal,
              longitude: lngVal,
              map_link: mapLink,
              created_at: doc.created_at || new Date().toISOString(),
              status: doc.status || 'Online',
              type: doc.type || '4K Security Camera'
            };
          });
          setCameras(list);
        }
      }
    } catch (e) {
      console.warn("Error fetching camera_network from MongoDB:", e);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const addCamera = async (camData) => {
    const latVal = camData.lat !== undefined && camData.lat !== null ? parseFloat(camData.lat) : 22.7196;
    const lngVal = camData.lng !== undefined && camData.lng !== null ? parseFloat(camData.lng) : 75.8577;
    const mapLink = `https://maps.google.com/?q=${latVal},${lngVal}`;
    const nowIso = new Date().toISOString();

    const payload = {
      camera_id: camData.id || camData.camera_id || `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
      camera_name: camData.name || camData.camera_name || 'CCTV Camera Node',
      location: camData.location || camData.address || 'City Location',
      address: camData.location || camData.address || 'City Location',
      latitude: latVal,
      longitude: lngVal,
      map_link: mapLink,
      created_at: nowIso,
      status: camData.status || 'Online',
      type: camData.type || '4K Security Camera'
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/criminal/camera_network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Camera Saved to MongoDB', `Camera ${payload.camera_name} stored in Criminal_traking.camera_network`, 'success');
        await fetchCameras();
        return data;
      }
    } catch (e) {
      console.error("Error posting camera to MongoDB:", e);
    }

    // Local fallback
    const fallbackCam = {
      ...payload,
      id: payload.camera_id,
      name: payload.camera_name,
      address: payload.location,
      lat: payload.latitude,
      lng: payload.longitude
    };
    setCameras(prev => [fallbackCam, ...prev]);
    showToast('Camera Added', `Camera ${payload.camera_name} added to session.`, 'info');
    return fallbackCam;
  };

  const updateCamera = async (id, updateData) => {
    const targetCam = cameras.find(c => c.id === id || c.camera_id === id || c.mongo_id === id);
    const docId = targetCam?.mongo_id || id;
    const latVal = updateData.lat !== undefined ? parseFloat(updateData.lat) : (targetCam?.lat || 22.7196);
    const lngVal = updateData.lng !== undefined ? parseFloat(updateData.lng) : (targetCam?.lng || 75.8577);
    const mapLink = `https://maps.google.com/?q=${latVal},${lngVal}`;

    const payload = {
      camera_id: updateData.camera_id || targetCam?.camera_id || id,
      camera_name: updateData.name || updateData.camera_name || targetCam?.name || 'CCTV Camera',
      location: updateData.location || updateData.address || targetCam?.location || 'City Grid',
      address: updateData.location || updateData.address || targetCam?.location || 'City Grid',
      latitude: latVal,
      longitude: lngVal,
      map_link: mapLink,
      status: updateData.status || targetCam?.status || 'Online',
      type: updateData.type || targetCam?.type || '4K Security Camera'
    };

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/criminal/camera_network/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Camera Updated', `Camera ${payload.camera_name} updated in MongoDB`, 'success');
        await fetchCameras();
        return;
      }
    } catch (e) {
      console.error("Error updating camera in MongoDB:", e);
    }

    setCameras(prev => prev.map(c => (c.id === id ? { ...c, ...payload } : c)));
  };

  const deleteCamera = async (id) => {
    if (!id) return;
    const target = cameras.find(c => c.id === id || c.camera_id === id || c.mongo_id === id);
    const docId = target?.mongo_id || id;

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/criminal/camera_network/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Camera Deleted', `Document removed from Criminal_traking.camera_network`, 'info');
        await fetchCameras();
        return;
      }
    } catch (e) {
      console.error("Error deleting camera from MongoDB:", e);
    }

    setCameras(prev => prev.filter(c => c.id !== id && c.camera_id !== id));
    showToast('Camera Removed', `Camera ${id} removed from session.`, 'info');
  };
  const [alerts, setAlerts] = useState(() => getCachedData('sda_cache_alerts', []));
  const [personnel, setPersonnel] = useState(() => getCachedData('sda_cache_personnel', []));
  const [watchlist, setWatchlist] = useState(() => getCachedData('sda_cache_watchlist', []));

  useEffect(() => {
    console.log(`[REGISTERED DATA STATE] count: ${watchlist.length}`);
  }, [watchlist]);
  const [vehicles, setVehicles] = useState(() => getCachedData('sda_cache_vehicles', []));
  const [missingChildren, setMissingChildren] = useState(() => getCachedData('sda_cache_missing_children', []));
  const [depotInventory, setDepotInventory] = useState(() => getCachedData('sda_cache_inventory', []));
  const [movementLogs, setMovementLogs] = useState([]);
  const [detectionReports, setDetectionReports] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  const clearAllAccountState = () => {
    const cacheKeys = [
      'sda_cache_alerts',
      'sda_cache_personnel',
      'sda_cache_watchlist',
      'sda_cache_vehicles',
      'sda_cache_missing_children',
      'sda_cache_inventory',
      'sda_personnel',
      'sda_watchlist',
      'sda_vehicles',
      'sda_missing_children',
      'sda_inventory',
      'sda_alerts'
    ];
    cacheKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    try {
      setAlerts([]);
      setPersonnel([]);
      setWatchlist([]);
      setVehicles([]);
      setMissingChildren([]);
      setDepotInventory([]);
      setOfficers([]);
      setDispatchPhoneNumbers([]);
      setCameras([]);
      setMovementLogs([]);
      setDetectionReports([]);
      setHistoryLogs([]);
      if (deletedPersonnelIdsRef.current) {
        deletedPersonnelIdsRef.current.clear();
      }
    } catch (e) {
      console.error('[clearAllAccountState] Error clearing state:', e);
    }
  };

  const addHistoryLog = (logItem) => {
    const nowObj = new Date();
    const dFormatted = formatISTDate(nowObj);
    const tFormatted = formatISTTime(nowObj);
    const newLog = {
      id: logItem.id || `HIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      personId: logItem.personId || logItem.id || '--',
      name: logItem.name || 'Unknown',
      role: logItem.role || 'Personnel',
      department: logItem.department || 'General Branch',
      action: logItem.action || 'Attendance Check-in',
      status: logItem.status || 'Present',
      dateTime: logItem.dateTime || `${dFormatted}, ${tFormatted}`,
      timestamp: logItem.timestamp || nowObj.toISOString(),
      details: logItem.details || 'Event recorded in system audit history'
    };
    setHistoryLogs(prev => [newLog, ...prev]);
  };

  const deleteHistoryLog = (id) => {
    if (!id) return;
    setHistoryLogs(prev => prev.filter(h => h.id !== id));
    showToast('History Entry Removed', `History record ${id} has been deleted.`, 'info');
  };

  const deleteMultipleHistoryLogs = (ids = []) => {
    if (!ids || ids.length === 0) return;
    const cleanSet = new Set(ids.map(i => String(i)));
    setHistoryLogs(prev => prev.filter(h => !cleanSet.has(String(h.id))));
    showToast('Batch History Deleted', `Removed ${ids.length} entry/entries from audit history archive.`, 'success');
  };

  const clearAllHistoryLogs = () => {
    setHistoryLogs([]);
    showToast('Audit History Cleared', 'All audit history records have been removed.', 'info');
  };

  // Global UI States, Modals & Theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sda_theme') || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    safeSetLocalStorage('sda_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedCameraForModal, setSelectedCameraForModal] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'addAlert', 'searchPerson', 'searchVehicle', 'generateReport', 'addPerson', 'addWatchlist', 'addMissingChild'
  const [toastMessage, setToastMessage] = useState(null);

  // Sync small session preference to LocalStorage safely
  useEffect(() => {
    safeSetLocalStorage('sda_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  // 🕒 Current Shift Date Engine (Without Midnight Data Reset)
  const [currentShiftDate, setCurrentShiftDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toISOString().slice(0, 10);
      if (nowStr !== currentShiftDate) {
        console.log(`[Shift Date Engine] Date Transition: ${currentShiftDate} -> ${nowStr}`);
        setCurrentShiftDate(nowStr);
        window.dispatchEvent(new CustomEvent('chakravyuh_shift_date_change', { detail: { date: nowStr } }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentShiftDate]);

  // ⚡ One-Time Initial Load from MongoDB Atlas on Startup (ZERO Automatic Background Continuous Polling)
  const abortControllerRef = React.useRef(null);

  useEffect(() => {
    const mountTimestamp = performance.now();
    if (!window.__app_mount_time) window.__app_mount_time = mountTimestamp;
    console.log(`[PERF] App mount: ${mountTimestamp.toFixed(2)} ms`);

    // Purge obsolete large keys from localStorage to prevent QuotaExceededError permanently
    purgeObsoleteLocalStorage();

    let isMounted = true;

    // Verify session token and restore admin context if token exists
    const restoreSession = async () => {
      const authStart = performance.now();
      console.log(`[PERF] Auth restore start: ${authStart.toFixed(2)} ms`);

      const token = localStorage.getItem('sda_token');
      let parsedUser = {};
      try {
        const savedUser = localStorage.getItem('sda_user');
        if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          parsedUser = JSON.parse(savedUser);
        }
      } catch (e) {
        console.warn('[AppContext] Failed to parse savedUser during restoreSession:', e);
      }
      console.log(`[REFRESH AUTH]\ntoken present: ${!!token}\nadmin_id: ${parsedUser?.admin_id || 'N/A'}\nisAuthenticated: ${isAuthenticated}`);

      if (token) {
        try {
          const res = await authFetch('http://127.0.0.1:8000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const authDuration = performance.now() - authStart;
          console.log(`[PERF] Auth restore complete: ${authDuration.toFixed(2)} ms (Status: ${res.status})`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.user && isMounted) {
              const mergedUser = {
                ...parsedUser,
                name: data.user.username || parsedUser.name || 'Command Admin',
                username: data.user.username || parsedUser.username,
                admin_id: data.user.admin_id || parsedUser.admin_id,
                role: data.user.role || parsedUser.role || 'admin',
                moduleId: data.user.moduleId || parsedUser.moduleId
              };
              setUser(mergedUser);
              setIsAuthenticated(true);
              safeSetLocalStorage('sda_user', mergedUser);
              safeSetLocalStorage('sda_auth', 'true');
            }
          }
        } catch (e) {
          console.warn("[Auth Restoration] Token verification notice:", e);
        }
      } else {
        console.log(`[PERF] Auth restore complete: ${(performance.now() - authStart).toFixed(2)} ms (No token)`);
      }
    };

    const fetchInitialModuleData = () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      const regFetchStart = performance.now();
      console.log(`[PERF] Registered Data fetch start: ${regFetchStart.toFixed(2)} ms`);

      const token = localStorage.getItem('sda_token');
      const reqHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      authFetch('http://127.0.0.1:8000/api/initial-data')
        .then(res => res && res.ok ? res.json() : null)
        .then(json => {
          if (!isMounted) return;
          if (json && json.status === 'success' && json.data) {
            const {
              personnel = [],
              watchlist = [],
              vehicles = [],
              missingChildren = [],
              inventory = [],
              alerts = []
            } = json.data;

            const validPersonnel = personnel.filter(d => 
              d && d.id && 
              !deletedPersonnelIdsRef.current.has(String(d.id).trim().toLowerCase()) &&
              d.id !== 'STU-E2E-999' &&
              d.name !== 'Frontend E2E Student' &&
              d.name !== 'Test Student Verification'
            );

            setPersonnel(validPersonnel);
            setCachedData('sda_cache_personnel', validPersonnel);

            setWatchlist(watchlist);
            setCachedData('sda_cache_watchlist', watchlist);

            setVehicles(vehicles);
            setCachedData('sda_cache_vehicles', vehicles);

            setMissingChildren(missingChildren);
            setCachedData('sda_cache_missing_children', missingChildren);

            setDepotInventory(inventory);
            setCachedData('sda_cache_inventory', inventory);

            const normalizedAlerts = alerts.map((alt, idx) => {
              const alertId = alt.id || alt._id || `ALT-${idx + 1000}`;
              const timestampIso = getRealIsoTimestamp(alt);
              return {
                ...alt,
                id: alertId,
                _id: alt._id || alertId,
                timestamp: timestampIso,
                createdAt: timestampIso,
                formattedRealTime: formatRealDateTime(timestampIso),
                timeAgo: formatTimeAgo(timestampIso)
              };
            });
            normalizedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAlerts(normalizedAlerts);
            setCachedData('sda_cache_alerts', normalizedAlerts);

            console.log(`[PERF] All initial module datasets loaded via batch API in ${(performance.now() - regFetchStart).toFixed(2)} ms`);
          }
        })
        .catch(e => console.warn('[Batch Initial Data Fetch Notice]', e))
        .finally(() => {
          isFetchingRef.current = false;
        });
    };

    restoreSession();
    fetchInitialModuleData();

    return () => {
      isMounted = false;
      isFetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Dynamic Real-time Alert Time Ago Ticker (Updates every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(prevAlerts => {
        if (!prevAlerts || prevAlerts.length === 0) return prevAlerts;
        let changed = false;
        const updated = prevAlerts.map(alt => {
          const rawTs = alt.timestamp || alt.createdAt || alt.created_at;
          if (rawTs) {
            const newTimeAgo = formatTimeAgo(rawTs);
            if (newTimeAgo !== alt.timeAgo) {
              changed = true;
              return { ...alt, timeAgo: newTimeAgo };
            }
          }
          return alt;
        });
        return changed ? updated : prevAlerts;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Toast Notification helper
  const showToast = (title, message, type = 'info') => {
    setToastMessage({ title, message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Handlers
  const loginModule = (moduleId, userData) => {
    clearAllAccountState();
    setIsAuthenticated(true);
    setActiveModule(moduleId);
    const updatedUser = {
      name: userData?.name || 'Officer Admin',
      role: userData?.role || 'Command Officer',
      badge: userData?.badge || `BADGE-${moduleId.toUpperCase()}-2026`,
      unit: `${moduleId.toUpperCase()} Command Division`
    };
    setUser(updatedUser);
    localStorage.setItem('sda_auth', 'true');
    localStorage.setItem('sda_active_module', moduleId);
    localStorage.setItem('sda_user', JSON.stringify(updatedUser));
  };

  const login = (role = 'Super Admin') => {
    setIsAuthenticated(true);
    setUser(prev => ({ ...prev, role }));
    showToast('Authenticated', 'Access granted to Command & Control Hub', 'success');
  };

  const logout = () => {
    try {
      clearAllAccountState();
    } catch (e) {
      console.error('[logout] Error clearing account state:', e);
    }
    try {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('sda_auth');
      localStorage.removeItem('sda_token');
      localStorage.removeItem('sda_user');
      localStorage.removeItem('sda_active_module');
      showToast('Logged Out', 'Admin session terminated successfully', 'info');
    } catch (e) {
      console.error('[logout] Error during session termination:', e);
    }
  };

  // ---------------------------------------------------------
  // 1. ATTENDANCE MODULE HANDLERS
  // ---------------------------------------------------------
  const addPerson = async (newPerson) => {
    const person = {
      id: newPerson.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      module: newPerson.module || activeModule || 'attendance',
      name: newPerson.name,
      department: newPerson.department || 'Security',
      role: newPerson.role || 'Officer',
      entry: newPerson.entry || '--',
      exit: '--',
      status: newPerson.status || 'Registered',
      camera: newPerson.camera || 'CAM-01',
      avatar: newPerson.avatar || '👤',
      photoUrl: newPerson.photoUrl || null,
      badgeId: `BADGE-${Math.floor(1000 + Math.random() * 9000)}`
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/attendance/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(person)
      });
      const data = await res.json();
      if (res.ok && (data.status === 'success' || data._id)) {
        setPersonnel(prev => [person, ...prev.filter(p => p.id !== person.id)]);
        addHistoryLog({
          personId: person.id,
          name: person.name,
          role: person.role,
          department: person.department,
          action: 'Personnel Registered',
          status: 'Registered',
          details: `Registered profile saved to MongoDB Atlas`
        });
        showToast('Personnel Registered', `${person.name} (${person.id}) saved to MongoDB Atlas.`, 'success');
        return { success: true, data: person };
      } else {
        console.warn('MongoDB person registration notice:', data.detail || res.statusText);
        setPersonnel(prev => [person, ...prev.filter(p => p.id !== person.id)]);
        setCachedData('sda_cache_personnel', [person, ...personnel.filter(p => p.id !== person.id)]);
        showToast('Personnel Registered', `${person.name} (${person.id}) saved.`, 'success');
        return { success: true, data: person };
      }
    } catch (e) {
      console.warn('MongoDB person registration notice:', e);
      setPersonnel(prev => [person, ...prev.filter(p => p.id !== person.id)]);
      setCachedData('sda_cache_personnel', [person, ...personnel.filter(p => p.id !== person.id)]);
      showToast('Personnel Registered', `${person.name} (${person.id}) saved.`, 'success');
      return { success: true, data: person };
    }
  };

  const deletePersonnel = async (id) => {
    if (!id) return;
    let deletedName = id;
    const cleanId = String(id).trim().toLowerCase();
    deletedPersonnelIdsRef.current.add(cleanId);

    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/attendance/personnel/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setPersonnel(prev => prev.filter(p => String(p.id).trim().toLowerCase() !== cleanId));
        showToast('Record Deleted', `Record ${id} permanently removed from MongoDB Atlas.`, 'info');
      } else {
        throw new Error(data.detail || 'Delete failed on server');
      }
    } catch (e) {
      console.error('Backend DELETE API exception:', e);
      showToast('Delete Error', `Could not delete ${id}: ${e.message}`, 'error');
    }
  };

  const deleteMultiplePersonnel = async (ids = []) => {
    if (!ids || ids.length === 0) return;
    ids.forEach(i => deletedPersonnelIdsRef.current.add(String(i).trim().toLowerCase()));

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/attendance/personnel/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (res.ok) {
        const cleanSet = new Set(ids.map(i => String(i).trim().toLowerCase()));
        setPersonnel(prev => prev.filter(p => !cleanSet.has(String(p.id).trim().toLowerCase())));
        showToast('Batch Delete Completed', `Deleted ${ids.length} record(s) from MongoDB Atlas.`, 'success');
      } else {
        throw new Error(data.detail || 'Batch delete failed');
      }
    } catch (e) {
      console.error('Backend delete-batch API exception:', e);
      showToast('Delete Error', `Batch delete failed: ${e.message}`, 'error');
    }
  };

  const markAttendance = async (empId, status = 'Present', options = {}) => {
    const targetPerson = personnel.find(p => p.id === empId || p._id === empId || p.name === empId || String(p.id) === String(empId) || String(p._id) === String(empId));
    const markedName = targetPerson ? targetPerson.name : empId;
    const nowObj = new Date();
    const todayShiftDate = nowObj.toISOString().slice(0, 10);
    const dateStr = options.date || todayShiftDate;

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          name: markedName,
          role: targetPerson?.role || 'Student',
          department: targetPerson?.department || 'General Branch / Department',
          avatar: targetPerson?.avatar || '👤',
          photoUrl: targetPerson?.photoUrl || null,
          status,
          date: dateStr
        })
      });
      const data = await res.json();
      if (data.status === 'cooldown' || data.success === false) {
        if (!options.silent) {
          showToast(
            'Already Scanned',
            `Attendance already recorded. Next attendance available after: ${data.next_allowed_at || '20 hours'}`,
            'warning'
          );
        }
        return { 
          success: false, 
          status: 'cooldown', 
          message: data.message || 'Attendance already recorded. Try again after 20 hours.', 
          next_allowed_at: data.next_allowed_at 
        };
      }

      if (res.ok && (data.status === 'success' || data.status === 'accepted' || data.success === true)) {
        const serverTime = data.server_time || {};
        const formattedTime = options.time || serverTime.formatted_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const fullDateTime = serverTime.full_datetime || `${dateStr}, ${formattedTime}`;

        setPersonnel(prev => {
          const updated = prev.map(p => {
            const matches = p.id === empId || p._id === empId || p.name === empId || String(p.id) === String(empId) || String(p._id) === String(empId);
            if (matches) {
              const history = { ...(p.attendanceHistory || {}) };
              history[dateStr] = {
                status,
                time: formattedTime,
                fullDateTime,
                date: dateStr
              };
              return {
                ...p,
                status,
                todayStatus: status,
                entry: (status === 'Present' || status === 'Late') ? fullDateTime : '--',
                entryTime: (status === 'Present' || status === 'Late') ? formattedTime : '--',
                attendanceHistory: history,
                lastMarkedAt: Date.now()
              };
            }
            return p;
          });
          setCachedData('sda_cache_personnel', updated);
          return updated;
        });

        addHistoryLog({
          personId: empId,
          name: markedName,
          role: targetPerson?.role || 'Student',
          department: targetPerson?.department || 'General Branch',
          action: `Attendance (${status})`,
          status,
          dateTime: fullDateTime
        });

        if (!options.silent) {
          showToast('Attendance Logged', `Attendance marked as ${status} for ${markedName} in MongoDB Atlas`, 'success');
        }
        return { success: true, next_allowed_at: data.next_allowed_at };
      } else {
        throw new Error(data.detail || data.message || 'Failed to mark attendance');
      }
    } catch (e) {
      console.error('MongoDB sync error:', e);
      if (!options.silent) {
        showToast('Attendance Error', `Could not mark attendance: ${e.message}`, 'error');
      }
      return { success: false, error: e.message };
    }
  };

  const addAttendanceScan = async (scanData) => {
    try {
      await authFetch('http://127.0.0.1:8000/api/attendance/attendance_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanData,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving attendance scan to MongoDB:', e);
    }
  };

  // ---------------------------------------------------------
  // 2. CRIMINAL TRACKING MODULE HANDLERS
  // ---------------------------------------------------------
  const addToWatchlist = async (item) => {
    const rawPhoto = item.photoUrl || item.photo || null;
    const compressedPhoto = await compressImageDataUrl(rawPhoto, 400, 0.85);

    const record = {
      ...item,
      id: item.id || `W-${Math.floor(9000 + Math.random() * 999)}`,
      module: item.module || activeModule || 'criminal-tracking',
      name: item.name ? item.name.trim() : 'Unknown Suspect',
      riskLevel: item.riskLevel || 'High Risk',
      crimeType: item.crimeType || item.charges || item.details || 'Under Watchlist Surveillance',
      charges: item.charges || item.ipcCharges || item.crimeType || 'IPC 302 / 395 - Armed Robbery & Homicide',
      lastSeen: item.lastSeen || item.location || 'CAM-01 Primary Station',
      status: item.status || 'REGISTERED & ACTIVE',
      confidence: item.confidence || '98.5%',
      photoUrl: compressedPhoto,
      age: item.age || 32,
      details: item.details || item.crimeType || 'Registered into criminal watchlist.',
      embedding: item.embedding || null,
      isUserAdded: true
    };

    // 1. Immediately update active watchlist state and cache (replacing duplicate if same ID or name)
    const targetNameLower = record.name.toLowerCase();
    const targetIdLower = String(record.id).toLowerCase();

    setWatchlist(prev => [record, ...prev.filter(w => 
      String(w.id || '').toLowerCase() !== targetIdLower && 
      String(w.name || '').trim().toLowerCase() !== targetNameLower
    )]);

    setCachedData('sda_cache_watchlist', [record, ...watchlist.filter(w => 
      String(w.id || '').toLowerCase() !== targetIdLower && 
      String(w.name || '').trim().toLowerCase() !== targetNameLower
    )]);

    // 2. Try MongoDB Atlas backend sync & report generation
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/criminal/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === 'success' || data._id || data.data)) {
        const savedRecord = (data && data.data) ? { ...record, ...data.data } : record;
        setWatchlist(prev => [savedRecord, ...prev.filter(w => w.id !== savedRecord.id)]);
        setCachedData('sda_cache_watchlist', [savedRecord, ...watchlist.filter(w => w.id !== savedRecord.id)]);

        // Auto-generate official dossier report
        const reportPayload = {
          id: `REP-${savedRecord.id}`,
          title: `Criminal Dossier: ${savedRecord.name} (${savedRecord.id})`,
          category: 'Criminal Dossier',
          suspectName: savedRecord.name,
          suspectId: savedRecord.id,
          photoUrl: savedRecord.photoUrl,
          riskLevel: savedRecord.riskLevel,
          crimeType: savedRecord.crimeType,
          details: savedRecord.details,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          generatedAt: new Date().toISOString(),
          status: 'ACTIVE WATCHLIST'
        };
        try {
          await authFetch('http://127.0.0.1:8000/api/criminal/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportPayload)
          });
        } catch (repErr) {}

        showToast('Target Registered', `${savedRecord.name} saved to MongoDB Atlas watchlist.`, 'success');
        return { success: true, data: savedRecord };
      } else {
        console.warn("MongoDB sync notice (saved locally):", data.detail || res.statusText);
      }
    } catch (e) {
      console.warn("MongoDB criminal sync notice (saved locally):", e);
    }

    showToast('Target Registered', `${record.name} added to criminal watchlist.`, 'success');
    return { success: true, data: record };
  };

  const removeFromWatchlist = async (id) => {
    if (!id) return;
    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/criminal/watchlist/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWatchlist(prev => prev.filter(w => w.id !== id));
        showToast('Profile Removed', `Watchlist record ${id} removed from MongoDB Atlas.`, 'info');
      }
    } catch (e) {
      console.error('Error removing suspect from MongoDB:', e);
    }
  };

  const deleteMultipleWatchlist = async (ids = []) => {
    if (!ids || ids.length === 0) return;
    for (const id of ids) {
      await removeFromWatchlist(id);
    }
    showToast('Batch Profiles Removed', `Removed ${ids.length} suspect records from MongoDB Atlas.`, 'info');
  };

  const addCriminalDetection = async (detectionData) => {
    try {
      await authFetch('http://127.0.0.1:8000/api/criminal/criminal_detections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...detectionData,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving criminal detection to MongoDB:', e);
    }
  };

  const clearCustomWatchlist = () => {
    setWatchlist(prev => prev.filter(w => !w.isUserAdded));
    showToast('Custom Profiles Cleared', 'All custom user-registered profiles removed.', 'info');
  };

  const resetWatchlist = () => {
    localStorage.removeItem('sda_watchlist');
    setWatchlist(initialWatchlist);
    showToast('Watchlist Reset', 'Watchlist database reset to initial state.', 'info');
  };

  // Alert Handlers
  const addAlert = async (alertData) => {
    if (alertData.type?.includes('Attendance Check-in') || alertData.title?.includes('ATTENDANCE MARKED')) {
      return;
    }
    const fullText = `${alertData.title || ''} ${alertData.type || ''} ${alertData.description || ''}`.toLowerCase();
    let mod = alertData.module;

    if (!mod || fullText.includes('watchlist') || fullText.includes('criminal') || fullText.includes('suspect') || fullText.includes('fugitive') || fullText.includes('ipc')) {
      if (fullText.includes('watchlist') || fullText.includes('criminal') || fullText.includes('suspect') || fullText.includes('fugitive') || fullText.includes('ipc')) {
        mod = 'criminal-tracking';
      } else if (fullText.includes('case mc-') || fullText.includes('missing') || fullText.includes('child')) {
        mod = 'missing-child';
      } else if (fullText.includes('breach') || fullText.includes('armory') || fullText.includes('vault') || fullText.includes('perimeter') || fullText.includes('defence') || fullText.includes('defense')) {
        mod = 'defence';
      } else if (fullText.includes('anpr') || fullText.includes('speed') || fullText.includes('vehicle')) {
        mod = 'anpr';
      } else {
        mod = alertData.module || activeModule || 'criminal-tracking';
      }
    }

    const nowIso = new Date().toISOString();
    const alertTs = alertData.timestamp || alertData.createdAt || nowIso;
    const newAlert = {
      id: alertData.id || `ALT-${Math.floor(200 + Math.random() * 800)}`,
      module: mod,
      type: alertData.type || 'Custom Incident Alert',
      title: alertData.title || alertData.type,
      location: alertData.location || 'Central Sector',
      camera: alertData.camera || 'CAM-01',
      priority: alertData.priority || 'High',
      timestamp: alertTs,
      createdAt: alertTs,
      timeAgo: formatTimeAgo(alertTs),
      description: alertData.description || 'Reported manual alert via Command Console.',
      status: 'Active',
      icon: (alertData.priority === 'Critical' || alertData.priority === 'Critical Risk') ? 'Shield' : 'AlertTriangle',
      badgeColor: (alertData.priority === 'Critical' || alertData.priority === 'Critical Risk' || alertData.priority === 'CRITICAL')
        ? 'border-red-500/50 text-red-400'
        : (alertData.priority === 'High' || alertData.priority === 'High Risk' || alertData.priority === 'HIGH')
        ? 'border-amber-500/50 text-amber-400'
        : 'border-teal-500/40 text-teal-400'
    };
    setAlerts(prev => [newAlert, ...prev]);

    let alertUrl = 'http://127.0.0.1:8000/api/criminal/alerts';
    if (mod === 'missing-child' || mod === 'missing') alertUrl = 'http://127.0.0.1:8000/api/missing-children/alerts';
    else if (mod === 'attendance') alertUrl = 'http://127.0.0.1:8000/api/attendance/alerts';
    else if (mod === 'anpr') alertUrl = 'http://127.0.0.1:8000/api/anpr/alerts';
    else if (mod === 'defence') alertUrl = 'http://127.0.0.1:8000/api/defence/alerts';

    try {
      await authFetch(alertUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });
    } catch (e) {}

    showToast('Alert Dispatched', `${newAlert.title} broadcasted to active units.`, 'warning');
  };

  const acknowledgeAlert = async (id) => {
    setAlerts(prev => {
      const updated = prev.map(a => (a.id === id || a._id === id) ? { ...a, status: 'Acknowledged' } : a);
      setCachedData('sda_cache_alerts', updated);
      return updated;
    });
    const target = alerts.find(a => a.id === id || a._id === id);
    const targetId = target?._id || target?.id || id;
    const mod = target?.module || activeModule || 'criminal';
    let alertUrl = `http://127.0.0.1:8000/api/criminal/alerts/${encodeURIComponent(targetId)}`;
    if (mod === 'missing-child' || mod === 'missing') alertUrl = `http://127.0.0.1:8000/api/missing-children/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'attendance') alertUrl = `http://127.0.0.1:8000/api/attendance/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'anpr') alertUrl = `http://127.0.0.1:8000/api/anpr/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'defence') alertUrl = `http://127.0.0.1:8000/api/defence/alerts/${encodeURIComponent(targetId)}`;

    try {
      await authFetch(alertUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Acknowledged' })
      });
    } catch (e) {}
    showToast('Alert Acknowledged', `Incident ${id} acknowledged by Command.`, 'info');
  };

  const resolveAlert = async (id) => {
    setAlerts(prev => {
      const updated = prev.map(a => (a.id === id || a._id === id) ? { ...a, status: 'Resolved' } : a);
      setCachedData('sda_cache_alerts', updated);
      return updated;
    });
    const target = alerts.find(a => a.id === id || a._id === id);
    const targetId = target?._id || target?.id || id;
    const mod = target?.module || activeModule || 'criminal';
    let alertUrl = `http://127.0.0.1:8000/api/criminal/alerts/${encodeURIComponent(targetId)}`;
    if (mod === 'missing-child' || mod === 'missing') alertUrl = `http://127.0.0.1:8000/api/missing-children/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'attendance') alertUrl = `http://127.0.0.1:8000/api/attendance/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'anpr') alertUrl = `http://127.0.0.1:8000/api/anpr/alerts/${encodeURIComponent(targetId)}`;
    else if (mod === 'defence') alertUrl = `http://127.0.0.1:8000/api/defence/alerts/${encodeURIComponent(targetId)}`;

    try {
      await authFetch(alertUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
    } catch (e) {}
    showToast('Alert Resolved', `Incident ${id} marked as resolved.`, 'success');
  };

  const deleteAlert = async (id) => {
    const target = alerts.find(a => a.id === id || a._id === id);
    const targetId = target?._id || target?.id || id;
    
    setAlerts(prev => {
      const remaining = prev.filter(a => a.id !== id && a._id !== id && a.id !== targetId && a._id !== targetId);
      setCachedData('sda_cache_alerts', remaining);
      return remaining;
    });

    try {
      await authFetch(`http://127.0.0.1:8000/api/alerts/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete alert from backend:', e);
    }
    showToast('Alert Deleted', `Alert ${id} permanently removed.`, 'info');
  };

  const deleteMultipleAlerts = async (idsArray) => {
    if (!idsArray || idsArray.length === 0) return;
    const idSet = new Set(idsArray.map(x => String(x)));
    
    setAlerts(prev => {
      const remaining = prev.filter(a => !idSet.has(String(a.id)) && !idSet.has(String(a._id)));
      setCachedData('sda_cache_alerts', remaining);
      return remaining;
    });

    try {
      await authFetch('http://127.0.0.1:8000/api/alerts/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray })
      });
    } catch (e) {
      console.error('Failed to delete multiple alerts from backend:', e);
    }
    showToast('Alerts Deleted', `${idsArray.length} alert(s) permanently removed.`, 'info');
  };

  const clearAllAlerts = async () => {
    setAlerts([]);
    setCachedData('sda_cache_alerts', []);

    try {
      await authFetch('http://127.0.0.1:8000/api/alerts/clear-all', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to clear all alerts from backend:', e);
    }
    showToast('All Alerts Cleared', 'All alerts permanently removed.', 'info');
  };

  // ---------------------------------------------------------
  // 3. ANPR MODULE HANDLERS
  // ---------------------------------------------------------
  const addVehicleRecord = async (veh) => {
    const record = {
      id: veh.id || `VEH-${Math.floor(1000 + Math.random() * 9000)}`,
      module: veh.module || activeModule || 'anpr',
      plate: veh.plate,
      type: veh.type || 'Sedan / SUV',
      owner: veh.owner || 'Registered Owner',
      status: veh.status || 'Authorized',
      confidence: veh.confidence || '98.5%',
      lastLocation: veh.lastLocation || 'Highway Toll Gate'
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/anpr/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      if (res.ok && (data.status === 'success' || data._id)) {
        setVehicles(prev => [record, ...prev.filter(v => v.id !== record.id)]);
        showToast('ANPR Logged', `Vehicle ${veh.plate} saved to MongoDB Atlas.`, 'success');
        return { success: true, data: record };
      } else {
        throw new Error(data.detail || 'Failed to save vehicle');
      }
    } catch (e) {
      console.error('Error saving vehicle to MongoDB:', e);
      showToast('ANPR Save Error', `Could not save vehicle: ${e.message}`, 'error');
      return { success: false, error: e.message };
    }
  };

  const addAnprScan = async (scanData) => {
    try {
      await authFetch('http://127.0.0.1:8000/api/anpr/anpr_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanData,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving ANPR scan to MongoDB:', e);
    }
  };

  // ---------------------------------------------------------
  // 4. MISSING CHILDREN MODULE HANDLERS
  // ---------------------------------------------------------
  const addMissingChild = async (childData) => {
    const newCase = {
      id: childData.id || `MC-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      module: childData.module || activeModule || 'missing-child',
      name: childData.name,
      age: parseInt(childData.age) || 6,
      gender: childData.gender || 'Male',
      guardianName: childData.guardianName || childData.fatherName || 'Parent / Guardian',
      contactNumber: childData.contactNumber || childData.phone || '+91 9876543210',
      address: childData.address || 'Central District',
      missingDate: childData.missingDate || new Date().toISOString().slice(0, 10),
      lastSeenLocation: childData.lastSeenLocation || childData.missingLocation || 'Central District',
      description: childData.description || 'No description provided.',
      photoUrl: childData.photoUrl || '',
      embedding: childData.embedding || null,
      status: 'Searching',
      lat: childData.lat || 22.7250,
      lng: childData.lng || 75.8600
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/missing-children/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase)
      });
      const data = await res.json();
      if (res.ok && (data.status === 'success' || data._id)) {
        setMissingChildren(prev => [newCase, ...prev.filter(m => m.id !== newCase.id)]);

        // Save metadata to Missing_children.add_data collection
        try {
          await authFetch('http://127.0.0.1:8000/api/missing-children/add_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              case_id: newCase.id,
              child_name: newCase.name,
              guardian_name: newCase.guardianName,
              contact_number: newCase.contactNumber,
              address: newCase.address,
              missing_date: newCase.missingDate,
              missing_location: newCase.lastSeenLocation,
              description: newCase.description,
              created_at: new Date().toISOString()
            })
          });
        } catch (err) {}

        showToast('Case Registered', `Missing person case ${newCase.id} saved to MongoDB Atlas.`, 'success');
        return { success: true, data: newCase };
      } else {
        console.warn('MongoDB missing child registration notice:', data.detail || res.statusText);
        setMissingChildren(prev => [newCase, ...prev.filter(m => m.id !== newCase.id)]);
        setCachedData('sda_cache_missing_children', [newCase, ...missingChildren.filter(m => m.id !== newCase.id)]);
        showToast('Case Registered', `Missing person case ${newCase.id} saved to live watchlist.`, 'success');
        return { success: true, data: newCase };
      }
    } catch (e) {
      console.warn('MongoDB missing child registration notice:', e);
      setMissingChildren(prev => [newCase, ...prev.filter(m => m.id !== newCase.id)]);
      setCachedData('sda_cache_missing_children', [newCase, ...missingChildren.filter(m => m.id !== newCase.id)]);
      showToast('Case Registered', `Missing person case ${newCase.id} saved to live watchlist.`, 'success');
      return { success: true, data: newCase };
    }
  };

  const deleteMissingChild = async (id) => {
    if (!id) return;
    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/missing-children/records/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMissingChildren(prev => prev.filter(c => c.id !== id));
        showToast('Case Removed', `Missing child case ${id} removed from MongoDB Atlas.`, 'info');
      }
    } catch (e) {
      console.error('Error deleting missing child case:', e);
    }
  };

  const addDetectionReport = async (childData, confidence, location) => {
    const newReport = {
      id: `RPT-${Math.floor(10000 + Math.random() * 90000)}`,
      childId: childData.id,
      childName: childData.name,
      age: childData.age,
      gender: childData.gender,
      matchConfidence: String(confidence),
      detectedLocation: location || childData.lastSeenLocation,
      timestamp: new Date().toLocaleString(),
      photoUrl: childData.photoUrl,
      status: 'LOCATED & VERIFIED'
    };
    setDetectionReports(prev => [newReport, ...prev]);

    // Persist scan detection to children_detection collection
    try {
      await authFetch('http://127.0.0.1:8000/api/missing-children/children_detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: childData.id,
          childName: childData.name,
          confidence: String(confidence),
          location: location || childData.lastSeenLocation,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving missing child detection to MongoDB:', e);
    }

    showToast('Detection Report Generated', `Match confirmed: ${childData.name} saved to MongoDB Atlas`, 'success');
  };

  // ---------------------------------------------------------
  // 5. DEFENCE TACTICAL MODULE HANDLERS
  // ---------------------------------------------------------
  const updateDepotMovement = async (itemId, type, quantityChange) => {
    const timeNow = new Date().toTimeString().slice(0, 5);
    setDepotInventory(prev => prev.map(item => {
      if (item.id === itemId || item.item?.includes(itemId)) {
        const newQty = Math.max(0, item.quantity + quantityChange);
        return { ...item, quantity: newQty, lastChecked: 'Just now (Verified Movement)' };
      }
      return item;
    }));

    const logDoc = {
      id: `MOV-${Math.floor(2000 + Math.random() * 8000)}`,
      time: timeNow,
      item: itemId,
      type: type || 'Authorized Transfer',
      officer: `${user.name} (${user.badge})`,
      status: 'Logged & Verified',
      zone: 'Depot A - Main Gate'
    };
    setMovementLogs(prev => [logDoc, ...prev]);

    // Persist scan/movement to defence_scan collection
    try {
      await authFetch('http://127.0.0.1:8000/api/defence/defence_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logDoc)
      });
    } catch (e) {
      console.error('Error saving defence scan to MongoDB:', e);
    }

    showToast('Movement Logged', `Transfer of ${itemId} recorded in MongoDB Atlas.`, 'success');
  };

  const addDefenceScan = async (scanData) => {
    try {
      await authFetch('http://127.0.0.1:8000/api/defence/defence_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanData,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving defence scan to MongoDB:', e);
    }
  };

  const triggerMovementBreach = (zone, details) => {
    const alertItem = {
      type: 'Perimeter Breach',
      title: 'UNAUTHORIZED MOVEMENT DETECTED',
      location: zone || 'Defense Zone 3',
      camera: 'CAM-06',
      priority: 'Critical',
      description: details || 'Sensors tripped at Armory Vault. Thermal perimeter breach confirmed.'
    };
    addAlert(alertItem);
  };

  const deleteDepotItem = async (id) => {
    setDepotInventory(prev => prev.filter(item => item.id !== id));
    try {
      await authFetch(`http://127.0.0.1:8000/api/defence/inventory/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      await authFetch(`http://127.0.0.1:8000/api/defence/registered_data/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {}
    showToast('Item Deleted', `Inventory asset ${id} removed from Defence database.`, 'info');
  };


  const addReport = async (reportData = {}) => {
    const mod = reportData.module || activeModule || 'attendance';
    const reportDoc = {
      id: reportData.id || `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      module: mod,
      title: reportData.title || 'Generated System Audit Report',
      format: reportData.format || 'pdf',
      dateRange: reportData.dateRange || 'current-week',
      created_at: new Date().toISOString()
    };

    let targetUrl = 'http://127.0.0.1:8000/api/attendance/reports';
    if (mod === 'criminal-tracking' || mod === 'criminal') targetUrl = 'http://127.0.0.1:8000/api/criminal/reports';
    else if (mod === 'anpr') targetUrl = 'http://127.0.0.1:8000/api/anpr/reports';
    else if (mod === 'missing-child' || mod === 'missing') targetUrl = 'http://127.0.0.1:8000/api/missing-children/reports';
    else if (mod === 'defence') targetUrl = 'http://127.0.0.1:8000/api/defence/reports';

    try {
      await authFetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportDoc)
      });
    } catch (e) {
      console.error('Error saving report to MongoDB:', e);
    }
  };

  const saveSystemSettings = async (settingsData = {}) => {
    const mod = activeModule || 'attendance';
    const settingsDoc = {
      id: `SETTINGS-${mod.toUpperCase()}`,
      module: mod,
      settings: settingsData,
      updated_at: new Date().toISOString()
    };

    let targetUrl = 'http://127.0.0.1:8000/api/attendance/system_settings';
    if (mod === 'criminal-tracking' || mod === 'criminal') targetUrl = 'http://127.0.0.1:8000/api/criminal/system_settings';
    else if (mod === 'anpr') targetUrl = 'http://127.0.0.1:8000/api/anpr/system_setting';
    else if (mod === 'missing-child' || mod === 'missing') targetUrl = 'http://127.0.0.1:8000/api/missing-children/system_setting';
    else if (mod === 'defence') targetUrl = 'http://127.0.0.1:8000/api/defence/system_setting';

    try {
      await authFetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDoc)
      });
      showToast('Settings Saved', `System preferences saved to MongoDB Atlas.`, 'success');
    } catch (e) {
      console.error('Error saving settings to MongoDB:', e);
    }
  };

  // Camera Management
  const toggleCameraStatus = async (id) => {
    let nextStatus = 'Online';
    setCameras(prev => prev.map(c => {
      if (c.id === id) {
        nextStatus = c.status === 'Online' ? 'Offline' : 'Online';
        showToast('Camera Status Changed', `${c.id} (${c.name}) is now ${nextStatus}`, 'info');
        return { ...c, status: nextStatus };
      }
      return c;
    }));

    try {
      await authFetch('http://127.0.0.1:8000/api/attendance/camera_network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus, updated_at: new Date().toISOString() })
      });
    } catch (e) {}
  };

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  // Dynamic Real-Time Calculated KPIs from actual state
  const calculatedKPIs = {
    totalPersonnel: { value: String(personnel.length), label: 'Total Person', subtext: 'Registered Officers' },
    activeCameras: { value: '1', label: 'Active Camera', subtext: 'Live Desktop Webcam' },
    activeAlerts: { value: String(alerts.filter(a => a.status === 'Active').length), label: 'Active Alerts', subtext: 'Live Triage' },
    criminalsTracked: { value: String(watchlist.length), label: 'Criminals Tracked', subtext: 'Watchlist Suspects' },
    missingChildren: { value: String(missingChildren.filter(m => m.status === 'Missing').length), label: 'Missing Children', subtext: 'Active Cases' },
  };

  const addInventory = async (item) => {
    const record = {
      id: item.id || `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
      module: 'defence',
      item: item.item || item.name || 'Tactical Asset',
      name: item.name || item.item || 'Tactical Asset',
      category: item.category || 'Armory',
      quantity: item.quantity ? parseInt(item.quantity) : 1,
      status: item.status || 'SECURE & AUDITED',
      location: item.location || 'Armory Vault 1'
    };

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/defence/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      if (res.ok && (data.status === 'success' || data._id || data.data)) {
        setDepotInventory(prev => [record, ...prev.filter(i => i.id !== record.id)]);
        showToast('Asset Registered', `Inventory item ${record.item} saved to MongoDB Atlas.`, 'success');
        return { success: true, data: record };
      } else {
        throw new Error(data.detail || 'Failed to save inventory asset');
      }
    } catch (e) {
      console.error('Error saving inventory asset to MongoDB:', e);
      showToast('Inventory Save Error', `Could not save asset: ${e.message}`, 'error');
      return { success: false, error: e.message };
    }
  };

  const addVehicle = addVehicleRecord;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        activeModule,
        setActiveModule,
        loginModule,
        user,
        kpis: calculatedKPIs,
        calculatedKPIs,
        cameras,
        setCameras,
        addCamera,
        deleteCamera,
        alerts,
        personnel,
        watchlist,
        vehicles,
        missingChildren,
        depotInventory,
        movementLogs,
        detectionReports,
        historyLogs,
        addHistoryLog,
        deleteHistoryLog,
        deleteMultipleHistoryLogs,
        clearAllHistoryLogs,
        crimeOverviewData,
        incidentsOverTimeData,
        theme,
        setTheme,
        toggleTheme,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        globalSearch,
        setGlobalSearch,
        selectedCameraForModal,
        setSelectedCameraForModal,
        activeModal,
        setActiveModal,
        toastMessage,
        showToast,
        login,
        logout,
        addPerson,
        deletePersonnel,
        deleteMultiplePersonnel,
        markAttendance,
        addToWatchlist,
        removeFromWatchlist,
        deleteMultipleWatchlist,
        clearCustomWatchlist,
        resetWatchlist,
        addAlert,
        acknowledgeAlert,
        resolveAlert,
        deleteAlert,
        deleteMultipleAlerts,
        clearAllAlerts,
        addMissingChild,
        deleteMissingChild,
        addDetectionReport,
        addVehicle,
        addVehicleRecord,
        addInventory,
        addAnprScan,
        addAttendanceScan,
        addCriminalDetection,
        addDefenceScan,
        addReport,
        saveSystemSettings,
        updateDepotMovement,
        triggerMovementBreach,
        deleteDepotItem,
        toggleCameraStatus,
        dispatchPhoneNumbers,
        addDispatchNumber,
        removeDispatchNumber,
        officers,
        fetchOfficers,
        addOfficer,
        updateOfficer,
        deleteOfficer,
        userLocation,
        setUserLocation,
        pendingCameraLocation,
        setPendingCameraLocation,
        fetchCameras,
        updateCamera,
        authFetch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
