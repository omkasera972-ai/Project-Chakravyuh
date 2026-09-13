import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Grid,
  List,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Search,
  MapPin,
  Plus,
  Check,
  X,
  Trash2,
  Globe,
  Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { CctvView } from '../components/CctvView';
import { ChakravyuhLocationPickerModal } from '../components/common/ChakravyuhLocationPickerModal';

export const CameraNetwork = () => {
  const navigate = useNavigate();
  const { cameras = [], addCamera, deleteCamera, setSelectedCameraForModal, showToast, activeModule, pendingCameraLocation, setPendingCameraLocation } = useApp();
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Adding Camera
  const [camForm, setCamForm] = useState({
    id: `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    location: '',
    lat: null,
    lng: null
  });

  // Listen for location selected from main Live Map page
  useEffect(() => {
    if (pendingCameraLocation) {
      setCamForm(prev => ({
        ...prev,
        lat: pendingCameraLocation.lat,
        lng: pendingCameraLocation.lng,
        location: pendingCameraLocation.address || `Lat: ${pendingCameraLocation.lat.toFixed(5)}, Lng: ${pendingCameraLocation.lng.toFixed(5)}`
      }));
      if (showToast) showToast('Live Map Location Loaded', 'Coordinates & address filled from CHAKRAVYUH Live Map.', 'success');
      setPendingCameraLocation(null);
    }
  }, [pendingCameraLocation, setPendingCameraLocation, showToast]);

  // Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Open Map Modal
  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  // Open Live Map Page directly in location selection mode
  const openLiveMapPage = () => {
    const mod = activeModule || localStorage.getItem('sda_active_module') || 'criminal-tracking';
    navigate(`/portal/${mod}/maps?mode=select-camera`);
  };

  // Callback when location is confirmed on map
  const handleSelectLocation = ({ lat, lng, address }) => {
    setCamForm(prev => ({
      ...prev,
      lat,
      lng,
      location: address || prev.location || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
    }));
    if (showToast) showToast('Location Selected', 'Coordinates & address loaded into camera form.', 'success');
  };

  // Save Camera Form Submit
  const handleSaveCamera = (e) => {
    e.preventDefault();
    if (!camForm.name.trim()) {
      if (showToast) showToast('Missing Name', 'Please enter Camera Name.', 'error');
      return;
    }
    if (!camForm.location.trim()) {
      if (showToast) showToast('Missing Location', 'Please select or enter Camera Location/Address.', 'error');
      return;
    }

    addCamera({
      id: camForm.id,
      name: camForm.name.trim(),
      address: camForm.location.trim(),
      location: camForm.location.trim(),
      lat: camForm.lat,
      lng: camForm.lng,
      status: 'Online',
      type: '4K Security Camera'
    });

    // Reset Form
    setCamForm({
      id: `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      location: '',
      lat: null,
      lng: null
    });
  };

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => c.status === 'Online' || c.status === 'ACTIVE').length;
  const offlineCameras = cameras.filter(c => c.status === 'Offline').length;

  const filteredCameras = cameras.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(q) ||
                          (c.code || '').toLowerCase().includes(q) ||
                          (c.location || '').toLowerCase().includes(q) ||
                          (c.address || '').toLowerCase().includes(q) ||
                          (c.id || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-slate-800 dark:text-white tracking-normal">
            Camera Network Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 font-normal">
            Configure live CCTV network nodes, interactive GPS map locations, and streaming feeds.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 dark:bg-[#171922] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-[#222631] text-blue-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-[#222631] text-blue-600 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Connected Nodes" value={String(totalCameras)} subtext="Active Network Nodes" icon={Video} />
        <StatCard title="Online Streams" value={String(onlineCameras)} subtext="Streaming Live" icon={ShieldCheck} />
        <StatCard title="Offline Nodes" value={String(offlineCameras)} subtext="Maintenance Needed" icon={AlertTriangle} />
        <StatCard title="Average Latency" value="18 ms" subtext="RTSP Low Latency" icon={Activity} />
      </div>

      {/* 🌟 CENTER CARD: ADD CAMERA NETWORK FORM */}
      <div className="w-full bg-white dark:bg-[#161922] p-6 sm:p-9 rounded-3xl border border-blue-100 dark:border-gray-800 shadow-md space-y-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-normal text-2xl shadow-xs">
            📹
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-normal text-slate-800 dark:text-white tracking-normal">
              Add Camera Network
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-gray-400 font-normal">
              Register a new live CCTV node with interactive GPS map coordinates.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCamera} className="space-y-6 w-full">
          <div className="space-y-6 w-full">
            
            {/* Field 1: Camera ID */}
            <div className="space-y-2.5 w-full">
              <label className="block text-slate-800 dark:text-gray-200 font-normal text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-center font-normal">1</span>
                  <span>Camera ID</span>
                </span>
                <span className="text-rose-500 text-xs font-normal uppercase tracking-wider">Required *</span>
              </label>
              <input
                type="text"
                value={camForm.id}
                onChange={(e) => setCamForm({ ...camForm, id: e.target.value })}
                placeholder="e.g. CAM-1001"
                required
                className="w-full h-[56px] px-5 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white font-mono text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
              />
            </div>

            {/* Field 2: Camera Name */}
            <div className="space-y-2.5 w-full">
              <label className="block text-slate-800 dark:text-gray-200 font-normal text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-normal">2</span>
                  <span>Camera Name</span>
                </span>
                <span className="text-rose-500 text-xs font-normal uppercase tracking-wider">Required *</span>
              </label>
              <input
                type="text"
                value={camForm.name}
                onChange={(e) => setCamForm({ ...camForm, name: e.target.value })}
                placeholder="e.g. Nemawar Chouraha CCTV Camera 1"
                required
                className="w-full h-[56px] px-5 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-base sm:text-lg font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
              />
            </div>

            {/* Field 3: Camera Location / Address */}
            <div className="space-y-2.5 w-full">
              <label className="block text-slate-800 dark:text-gray-200 font-normal text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-sm flex items-center justify-center font-normal">3</span>
                  <span>Camera Location / Address</span>
                </span>
                <span className="text-rose-500 text-xs font-normal uppercase tracking-wider">Required *</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  type="text"
                  value={camForm.location}
                  onChange={(e) => setCamForm({ ...camForm, location: e.target.value })}
                  placeholder="e.g. Nemawar Bypass Gate, MP"
                  required
                  className="w-full h-[56px] px-5 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-base sm:text-lg font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={openMapModal}
                  className="px-5 h-[56px] rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-sm font-normal flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95"
                >
                  <MapPin className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  <span>📍 Select Location on Map</span>
                </button>
                <button
                  type="button"
                  onClick={openLiveMapPage}
                  className="px-5 h-[56px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-normal flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 shadow-md"
                  title="Open main Live Geospatial Satellite Map to click and pick camera location"
                >
                  <Globe className="w-4.5 h-4.5 text-white" />
                  <span>🗺️ Open Live Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lat Lng Readout Display */}
          {(camForm.lat || camForm.lng) && (
            <div className="flex items-center gap-4 text-xs sm:text-sm font-mono text-slate-500 dark:text-gray-400 pt-1">
              <span className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                Latitude: <strong className="text-blue-600 dark:text-blue-400 font-normal">{Number(camForm.lat).toFixed(5)}</strong>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                Longitude: <strong className="text-blue-600 dark:text-blue-400 font-normal">{Number(camForm.lng).toFixed(5)}</strong>
              </span>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-[58px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-base sm:text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" />
              <span>Save Camera</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {['All', 'Online', 'Offline'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-normal transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#14161d] text-slate-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:text-slate-900'
              }`}
            >
              {status} Cameras ({status === 'All' ? totalCameras : status === 'Online' ? onlineCameras : offlineCameras})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search camera name or ID..."
            className="pl-9 pr-4 py-2 bg-white dark:bg-[#14161d] border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid View of Registered Cameras */}
      {viewMode === 'grid' ? (
        filteredCameras.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-[#121419] rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 space-y-3">
            <Video className="w-10 h-10 text-gray-400 mx-auto opacity-60" />
            <p className="font-medium text-slate-700 dark:text-gray-300 text-base">No Registered Cameras Found</p>
            <p className="text-xs text-gray-400">Use the form above to add a camera node to the system.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCameras.map((cam) => (
              <div
                key={cam.id}
                className="bg-white dark:bg-[#121419] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-sm hover:border-blue-500 transition-all group flex flex-col justify-between"
              >
                <div>
                  <CctvView
                    cameraCode={cam.id}
                    location={cam.name}
                    isLive={cam.status === 'Online'}
                    aspectRatio="aspect-[16/10]"
                    onClick={() => setSelectedCameraForModal(cam)}
                  />
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-800 dark:text-white text-base leading-tight">
                        {cam.name || cam.camera_name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {cam.status || 'Online'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-normal">
                      📍 {cam.location || cam.address || cam.zone}
                    </p>
                    {cam.lat && cam.lng && (
                      <p className="text-[11px] font-mono text-slate-600 dark:text-gray-400">
                        GPS: Lat {Number(cam.lat).toFixed(4)}, Lng {Number(cam.lng).toFixed(4)}
                      </p>
                    )}
                    {(cam.map_link || (cam.lat && cam.lng)) && (
                      <div className="pt-1">
                        <a
                          href={cam.map_link || `https://maps.google.com/?q=${cam.lat},${cam.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-normal cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>📍 View Location on Map</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCameraForModal(cam)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl font-normal text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Inspect Live Feed
                  </button>

                  <button
                    onClick={() => deleteCamera(cam.id || cam.camera_id)}
                    title="Remove Camera"
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#121419] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#171922] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-normal uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Camera ID</th>
                  <th className="py-3 px-4">Camera Name</th>
                  <th className="py-3 px-4">Location / Address</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Map Link</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCameras.map((cam) => (
                  <tr key={cam.id || cam.camera_id} className="hover:bg-gray-50 dark:hover:bg-[#161820] transition-colors">
                    <td className="py-3 px-4 font-mono font-normal text-slate-800 dark:text-white">{cam.id || cam.camera_id}</td>
                    <td className="py-3 px-4 font-normal text-slate-800 dark:text-white">{cam.name || cam.camera_name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-gray-300">{cam.location || cam.address}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-gray-300">
                      {cam.lat && cam.lng ? `${Number(cam.lat).toFixed(4)}, ${Number(cam.lng).toFixed(4)}` : '--'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <a
                        href={cam.map_link || `https://maps.google.com/?q=${cam.lat},${cam.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-normal hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>View Map</span>
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {cam.status || 'Online'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCameraForModal(cam)}
                        className="px-3 py-1 rounded-xl bg-blue-50 text-blue-600 font-normal text-xs"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => deleteCamera(cam.id || cam.camera_id)}
                        className="px-3 py-1 rounded-xl bg-rose-50 text-rose-600 font-normal text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 REUSABLE CHAKRAVYUH MAP LOCATION PICKER MODAL */}
      <ChakravyuhLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLat={camForm.lat || 22.7196}
        initialLng={camForm.lng || 75.8577}
        initialAddress={camForm.location}
        title="Select Camera Location on CHAKRAVYUH Map"
      />
    </div>
  );
};
