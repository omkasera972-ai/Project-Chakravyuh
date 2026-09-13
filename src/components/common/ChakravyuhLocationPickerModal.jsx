import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, MapPin, RefreshCw, Check, Navigation, AlertTriangle, Maximize2 } from 'lucide-react';

// Fix Leaflet marker icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom CHAKRAVYUH Location Pin Icon (Red Target Marker)
const locationPinIcon = L.divIcon({
  className: 'chakravyuh-location-pin-marker',
  html: `
    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background-color: rgba(239, 68, 68, 0.35);
        border: 2px solid rgba(239, 68, 68, 0.7);
        animation: pulse 1.8s infinite;
      "></div>
      <div style="
        background: #dc2626;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        z-index: 10;
      ">
        📍
      </div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21]
});

// Google Maps-style Pulsing Blue Dot Marker for Live GPS Location
const currentGpsDotIcon = L.divIcon({
  className: 'google-blue-dot-marker',
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(59, 130, 246, 0.4);
        border: 2px solid rgba(59, 130, 246, 0.8);
        animation: pulse 1.6s infinite;
      "></div>
      <div style="
        background: #2563eb;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 16px rgba(37, 99, 235, 0.95);
        z-index: 10;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Component to fly map center smoothly & invalidate container size when opened inside modal
const MapController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] !== null && center[1] !== null) {
      map.flyTo(center, 17, { animate: true, duration: 1.2 });
    }
  }, [center, map]);

  useEffect(() => {
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  return null;
};

// Location Marker Handler for Click & Drag Events
const LocationMarkerPicker = ({ position, setPosition, setAddress }) => {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      fetchAddress(e.latlng.lat, e.latlng.lng, setAddress);
    },
  });

  return position && position[0] !== null && position[1] !== null ? (
    <Marker
      position={position}
      icon={locationPinIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          const newPos = [pos.lat, pos.lng];
          setPosition(newPos);
          fetchAddress(pos.lat, pos.lng, setAddress);
        },
      }}
    >
      <Popup defaultOpen={true}>
        <div className="p-1.5 text-xs space-y-1">
          <strong className="text-red-600 dark:text-red-400 block font-medium">📍 Selected Target Location</strong>
          <p className="text-gray-700 dark:text-gray-300 text-[11px] font-normal">Drag pin or click anywhere on map</p>
          <p className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

// Helper for reverse-geocoding coordinates to full address
const fetchAddress = async (lat, lng, setAddress) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding warning:', err);
  }
};

export const ChakravyuhLocationPickerModal = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = null,
  initialLng = null,
  initialAddress = '',
  title = 'Select Location on CHAKRAVYUH Map'
}) => {
  const [position, setPosition] = useState(initialLat && initialLng ? [initialLat, initialLng] : null);
  const [userGpsPos, setUserGpsPos] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [mapTileType, setMapTileType] = useState('google-hybrid');

  // STRICT BROWSER GEOLOCATION API REQUEST (enableHighAccuracy: true, timeout: 10000, maximumAge: 0)
  const requestLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    // Call Browser Geolocation API Immediately with strict options
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const livePos = [lat, lng];

        setUserGpsPos(livePos);
        setPosition(livePos);
        setIsLocating(false);

        // Fetch reverse geocode address AFTER coordinates are received
        fetchAddress(lat, lng, setAddress);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission required. Please allow location access in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location position unavailable from device GPS. Click "Retry Location" or select manually on map.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location request timed out. Please click "Retry Location".');
        } else {
          setGeoError('Location permission required. Please allow browser location access.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Request GPS immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        setPosition([initialLat, initialLng]);
        setUserGpsPos([initialLat, initialLng]);
        setAddress(initialAddress || '');
      } else {
        requestLiveLocation();
      }
      setSearchQuery('');
    }
  }, [isOpen, initialLat, initialLng, initialAddress, requestLiveLocation]);

  if (!isOpen) return null;

  // Search location using OpenStreetMap Nominatim geocoding
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const firstResult = data[0];
          const newLat = parseFloat(firstResult.lat);
          const newLng = parseFloat(firstResult.lon);
          const newPos = [newLat, newLng];
          setPosition(newPos);
          setAddress(firstResult.display_name);
        }
      }
    } catch (err) {
      console.error('Geocoding search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!position || position[0] === null || position[1] === null) return;
    onSelectLocation({
      lat: position[0],
      lng: position[1],
      address: address || `Lat: ${position[0].toFixed(5)}, Lng: ${position[1].toFixed(5)}`
    });
    onClose();
  };

  const mapCenter = position && position[0] !== null && position[1] !== null ? position : [20.5937, 78.9629];

  return (
    /* 🌟 100% ENTIRE SCREEN COVER MODAL CONTAINER */
    <div className="fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
      
      {/* 🌟 FULL SCREEN MODAL TOP HEADER */}
      <div className="w-full px-6 py-4 bg-slate-900/95 border-b border-gray-800 flex items-center justify-between z-30 shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-normal">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white tracking-normal flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono border border-blue-500/30 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Full Screen Mode
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-normal">
              Click anywhere on map or drag red marker pin to pick exact camera coordinates
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 text-gray-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer shadow-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 🌟 100% FULL VIEWPORT MAP BODY */}
      <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
        
        {/* Floating Live GPS & Notification Banner */}
        {isLocating && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-normal shadow-2xl flex items-center gap-2.5 animate-pulse border border-blue-400/40">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Requesting live GPS location from device...</span>
          </div>
        )}

        {geoError && !isLocating && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 bg-rose-600 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-normal shadow-2xl flex items-center gap-2.5 max-w-xl text-center border border-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">{geoError}</span>
            <button
              onClick={requestLiveLocation}
              className="ml-2 px-3 py-1 rounded-full bg-white text-rose-700 text-xs font-medium hover:bg-rose-50 transition-all cursor-pointer shrink-0 shadow-sm"
            >
              Retry Location
            </button>
          </div>
        )}

        {/* Floating Search Bar & Recenter GPS Button */}
        <div className="absolute top-5 left-6 z-20 flex items-center space-x-3 max-w-md w-full">
          <form onSubmit={handleSearch} className="w-full flex items-center bg-slate-900/95 text-white rounded-full shadow-2xl border border-gray-700 px-5 py-3 transition-all backdrop-blur-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, address, area or landmark..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none pr-2 font-normal"
            />
            <div className="flex items-center space-x-2 border-l border-gray-700 pl-3 flex-shrink-0">
              <button type="submit" title="Search Location" className="text-gray-300 hover:text-blue-400 cursor-pointer">
                {isSearching ? <RefreshCw className="w-4.5 h-4.5 animate-spin text-blue-400" /> : <Search className="w-5 h-5 stroke-[2.2]" />}
              </button>
            </div>
          </form>
          <button
            type="button"
            onClick={requestLiveLocation}
            title="Center on Live GPS Location"
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xl shrink-0 active:scale-95 border border-blue-400/40"
          >
            <Navigation className="w-5 h-5 fill-current transform rotate-45" />
          </button>
        </div>

        {/* Map Layer Switcher */}
        <div className="absolute top-5 right-6 z-20 flex items-center space-x-2">
          <select
            value={mapTileType}
            onChange={(e) => setMapTileType(e.target.value)}
            className="px-4 py-3 rounded-full text-xs font-medium shadow-2xl border border-gray-700 bg-slate-900/95 text-white backdrop-blur-md cursor-pointer focus:outline-none"
          >
            <option value="google-hybrid">🛰️ Google Hybrid (Satellite + Roads)</option>
            <option value="google-roadmap">🗺️ Google Streets</option>
            <option value="google-sat">📷 Google Satellite</option>
            <option value="osm">🌐 OpenStreetMap</option>
          </select>
        </div>

        {/* React Leaflet Map Component */}
        <MapContainer
          center={mapCenter}
          zoom={position ? 17 : 5}
          zoomControl={true}
          style={{ width: '100%', height: '100%', background: '#0f172a' }}
          className="z-10 w-full h-full"
        >
          <MapController center={position} />
          
          {mapTileType === 'google-hybrid' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'google-roadmap' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'google-sat' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          {mapTileType === 'osm' && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          )}

          {/* Live GPS Dot Marker */}
          {userGpsPos && userGpsPos[0] !== null && userGpsPos[1] !== null && (
            <Marker position={userGpsPos} icon={currentGpsDotIcon}>
              <Popup defaultOpen={true}>
                <div className="p-1 text-xs font-normal">
                  <strong className="text-blue-600 block text-sm font-medium">📍 Your Current Location</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px]">Live Device Geolocation</p>
                  <p className="text-blue-500 text-[10px] font-mono mt-0.5">{userGpsPos[0].toFixed(5)}, {userGpsPos[1].toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          <LocationMarkerPicker position={position} setPosition={setPosition} setAddress={setAddress} />
        </MapContainer>
      </div>

      {/* 🌟 FULL SCREEN MODAL BOTTOM FOOTER PANEL */}
      <div className="w-full px-8 py-5 border-t border-gray-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 z-30 shrink-0 shadow-2xl">
        <div className="flex-1 w-full space-y-1">
          {position && position[0] !== null && position[1] !== null ? (
            <div className="flex items-center space-x-3 text-xs sm:text-sm font-medium text-gray-300">
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-mono border border-red-500/30">
                Latitude: {position[0].toFixed(5)}
              </span>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg font-mono border border-blue-500/30">
                Longitude: {position[1].toFixed(5)}
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-rose-400 font-mono">
              Waiting for live GPS coordinates...
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-400 truncate max-w-3xl font-normal pt-1">
            {address ? `📍 ${address}` : 'Click map or drag pin to select location address'}
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-slate-800 text-sm font-medium transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!position || position[0] === null || position[1] === null}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-5 h-5" />
            <span>Confirm Location</span>
          </button>
        </div>
      </div>

    </div>
  );
};
