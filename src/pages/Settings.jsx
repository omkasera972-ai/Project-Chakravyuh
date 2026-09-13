import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Bell, 
  Monitor, 
  Video, 
  Save, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Globe, 
  Key, 
  Sliders, 
  Smartphone,
  Clock,
  Trash2,
  Search,
  Filter,
  History,
  UserCheck,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsBgSvg, CpuBgSvg, ShieldBgSvg } from '../components/common/CardBackgroundIcons';
import { ChakravyuhLocationPickerModal } from '../components/common/ChakravyuhLocationPickerModal';

export const Settings = () => {
  const navigate = useNavigate();
  const { 
    user, 
    historyLogs = [], 
    deleteHistoryLog, 
    deleteMultipleHistoryLogs, 
    clearAllHistoryLogs, 
    dispatchPhoneNumbers = [],
    addDispatchNumber,
    removeDispatchNumber,
    officers = [],
    addOfficer,
    deleteOfficer,
    saveSystemSettings,
    showToast,
    activeModule,
    pendingCameraLocation,
    setPendingCameraLocation
  } = useApp();

  const [activeTab, setActiveTab] = useState('profile');
  const [newContactForm, setNewContactForm] = useState({
    officerId: '',
    name: '',
    rank: '',
    stationName: '',
    stationLocation: '',
    email: ''
  });

  // Map Modal State for Police Station Location
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [stationCoords, setStationCoords] = useState({ lat: null, lng: null });

  // Listen for location selected from main Live Map page
  useEffect(() => {
    if (pendingCameraLocation) {
      setStationCoords({ lat: pendingCameraLocation.lat, lng: pendingCameraLocation.lng });
      setNewContactForm(prev => ({
        ...prev,
        stationLocation: pendingCameraLocation.address || `Lat: ${pendingCameraLocation.lat.toFixed(5)}, Lng: ${pendingCameraLocation.lng.toFixed(5)}`
      }));
      if (showToast) showToast('Live Map Location Loaded', 'Police Station coordinates & address loaded from Live Map.', 'success');
      if (setPendingCameraLocation) setPendingCameraLocation(null);
    }
  }, [pendingCameraLocation, setPendingCameraLocation, showToast]);

  const openLiveMapPage = () => {
    const mod = activeModule || localStorage.getItem('sda_active_module') || 'criminal-tracking';
    navigate(`/portal/${mod}/maps?mode=select-station&from=settings`);
  };

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user.name || 'Command Officer Ewe',
    role: user.role || 'Law Enforcement Detective / Super Admin',
    badge: 'BADGE-001-ALPHA',
    unit: 'Central Command & Control Room',
    email: 'admin.operations@sda.internal'
  });

  // Toggles & Preferences
  const [preferences, setPreferences] = useState({
    autoAlertSound: true,
    darkHighContrast: true,
    neuralAutoScan: true,
    anprLiveIntercepts: true,
    cctvStreamFps60: true,
    lowBandwidthMode: false,
    retentionDays: 90
  });

  // History Tab States
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (saveSystemSettings) {
      await saveSystemSettings(preferences);
    }
    showToast('Preferences Saved', 'Command console settings updated successfully in MongoDB.', 'success');
  };

  const tabs = [
    { id: 'profile', label: 'Operator Profile', icon: User, desc: 'Personal details & command credentials' },
    { id: 'dispatch_numbers', label: 'Officers Information', icon: UserCheck, desc: 'Duty officer details & police station contact directory' },
    { id: 'history', label: 'Criminal Audit History', icon: Clock, desc: 'Permanent log archive of criminal detections & record deletions' },
    { id: 'security', label: 'Security & Access', icon: Shield, desc: '2FA tokens & session timeouts' },
    { id: 'notifications', label: 'Alert Notifications', icon: Bell, desc: 'Acoustic alarms & real-time dispatch' },
    { id: 'system', label: 'System Preferences', icon: Monitor, desc: 'Console theme & telemetry retention' },
    { id: 'camera', label: 'Camera Stream Settings', icon: Video, desc: '4K AI inferencing & 60 FPS codec' },
  ];

  // Filter history logs by search term & type (EXCLUDING Attendance logs which belong ONLY to Attendance module)
  const filteredHistory = (historyLogs || [])
    .filter((log) => {
      // Exclude Attendance logs from Criminal module settings
      const isAttendanceLog = 
        (log.action || '').toLowerCase().includes('attendance') ||
        (log.details || '').toLowerCase().includes('attendance') ||
        log.type === 'attendance';
      return !isAttendanceLog;
    })
    .filter((log) => {
      const matchesType = 
        historyTypeFilter === 'all' ||
        (historyTypeFilter === 'registered' && log.action?.includes('Registered')) ||
        (historyTypeFilter === 'deleted' && log.action?.includes('Deleted')) ||
        (historyTypeFilter === 'dispatch' && (log.action?.includes('Dispatch') || log.action?.includes('Alert')));

      const q = historySearchTerm.toLowerCase();
      const matchesSearch =
        (log.name || '').toLowerCase().includes(q) ||
        (log.personId || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.dateTime || '').toLowerCase().includes(q) ||
        (log.department || '').toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });

  const handleSelectAllHistory = (e) => {
    if (e.target.checked) {
      setSelectedHistoryIds(filteredHistory.map(h => h.id));
    } else {
      setSelectedHistoryIds([]);
    }
  };

  const handleSelectOneHistory = (id) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteHistory = () => {
    if (selectedHistoryIds.length === 0) return;
    deleteMultipleHistoryLogs(selectedHistoryIds);
    setSelectedHistoryIds([]);
  };

  const criminalLogsCount = (historyLogs || []).filter(h => !h.action?.toLowerCase().includes('attendance')).length;
  const registeredCount = (historyLogs || []).filter(h => h.action?.includes('Registered')).length;
  const deletedCount = (historyLogs || []).filter(h => h.action?.includes('Deleted')).length;
  const dispatchCount = (historyLogs || []).filter(h => h.action?.includes('Dispatch') || h.action?.includes('Alert')).length;

  return (
    <div className="space-y-6 select-none pb-6 min-h-[calc(100vh-8rem)] flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              System Settings & Command Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Engine Online
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure command console parameters, operator access credentials, emergency broadcast contacts, and criminal audit logs.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Console Settings</span>
        </button>
      </div>

      {/* 🌟 GMAIL-STYLE SETTINGS CONTAINER WITH TOP HORIZONTAL EQUAL DISTANCE TABS */}
      <div className="w-full bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between flex-1">
        
        {/* 🌟 GMAIL TOP HORIZONTAL TAB BAR - EXTRA LARGE READABLE NORMAL FONTS */}
        <div className="w-full bg-gray-50/90 dark:bg-[#161922] border-b-2 border-gray-200 dark:border-gray-800 px-4 sm:px-8 pt-4 flex items-center justify-between overflow-x-auto scrollbar-none gap-x-3 sm:gap-x-6">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 pt-2 px-4 whitespace-nowrap transition-all cursor-pointer border-b-4 flex items-center justify-center space-x-2 flex-1 text-center text-base sm:text-lg lg:text-xl tracking-normal ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-normal'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* GMAIL-STYLE MAIN CONTENT BODY */}
        <div className="p-6 sm:p-8 flex-1 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            {/* Operator Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-0.5 shadow-md flex-shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white text-2xl font-normal">
                      <User className="w-8 h-8 text-indigo-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-white text-lg">{profileForm.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-normal font-mono mt-0.5">
                      {profileForm.role} • {profileForm.badge}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-normal mb-1.5">Operator Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-normal mb-1.5">Assigned Role</label>
                    <input
                      type="text"
                      disabled
                      value={profileForm.role}
                      className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#101217] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 font-normal cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-normal mb-1.5">Command Unit</label>
                    <input
                      type="text"
                      value={profileForm.unit}
                      onChange={(e) => setProfileForm({ ...profileForm, unit: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-normal mb-1.5">Internal Secure Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-normal rounded-xl hover:bg-black dark:hover:bg-gray-100 text-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* Officers Information Tab (Full Width Page Layout) */}
            {activeTab === 'dispatch_numbers' && (
              <div className="space-y-8 w-full">
                {/* Hero Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-7 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30">
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-slate-800 dark:text-white text-2xl sm:text-3xl flex items-center gap-3">
                      <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <span>Officers Information</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-4xl font-normal">
                      Manage official law enforcement officer credentials, ranks, station assignments, and email addresses.
                    </p>
                  </div>
                </div>

                {/* 🌟 100% FULL-WIDTH PORTRAIT FORM CARD (LARGE NORMAL FONTS) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newContactForm.name.trim()) {
                      showToast('Missing Field', 'Please enter Officer Name.', 'error');
                      return;
                    }
                    if (!newContactForm.officerId.trim()) {
                      showToast('Missing Field', 'Please enter Officer ID.', 'error');
                      return;
                    }

                    const officerPayload = {
                      officerId: newContactForm.officerId.trim(),
                      name: newContactForm.name.trim(),
                      rank: newContactForm.rank.trim() || 'Inspector',
                      stationName: newContactForm.stationName.trim() || 'Police Station',
                      stationLocation: newContactForm.stationLocation.trim() || 'Police Station Location',
                      email: newContactForm.email.trim() || 'officer@police.gov.in',
                      lat: stationCoords.lat,
                      lng: stationCoords.lng
                    };

                    addOfficer(officerPayload);
                    setNewContactForm({
                      officerId: '',
                      name: '',
                      rank: '',
                      stationName: '',
                      stationLocation: '',
                      email: ''
                    });
                    setStationCoords({ lat: null, lng: null });
                  }}
                  className="w-full bg-white dark:bg-[#161922] p-8 sm:p-11 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-8 shadow-md relative overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-normal text-3xl shadow-inner">
                        👮
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white text-2xl sm:text-3xl tracking-normal">
                          Register Officer Information
                        </h4>
                        <p className="text-sm sm:text-base text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                          Full Screen Width • Big Readable Font Form Fields
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Portrait Vertical Stacked Input Fields (100% Full Width Single Line Stack with Big Normal Fonts) */}
                  <div className="space-y-7 w-full">
                    
                    {/* Field 1: Officer ID */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-base sm:text-lg flex items-center justify-center font-normal">1</span>
                          <span>Officer ID</span>
                        </span>
                        <span className="text-rose-500 text-xs sm:text-sm font-normal uppercase tracking-wider">Required *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. OFFICER-4092"
                        value={newContactForm.officerId}
                        onChange={(e) => setNewContactForm({ ...newContactForm, officerId: e.target.value })}
                        className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 2: Officer Name */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-base sm:text-lg flex items-center justify-center font-normal">2</span>
                          <span>Officer Name</span>
                        </span>
                        <span className="text-rose-500 text-xs sm:text-sm font-normal uppercase tracking-wider">Required *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Inspector R.K. Sharma"
                        value={newContactForm.name}
                        onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                        className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 3: Rank / Designation */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-base sm:text-lg flex items-center justify-center font-normal">3</span>
                          <span>Rank / Designation</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Inspector / Thana Incharge"
                        value={newContactForm.rank}
                        onChange={(e) => setNewContactForm({ ...newContactForm, rank: e.target.value })}
                        className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 4: Police Station Name */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-base sm:text-lg flex items-center justify-center font-normal">4</span>
                          <span>Police Station Name</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nemawar Police Station"
                        value={newContactForm.stationName}
                        onChange={(e) => setNewContactForm({ ...newContactForm, stationName: e.target.value })}
                        className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 5: Police Station Location */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-base sm:text-lg flex items-center justify-center font-normal">5</span>
                          <span>Police Station Location</span>
                        </span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <input
                          type="text"
                          placeholder="e.g. Dewas District, Madhya Pradesh"
                          value={newContactForm.stationLocation}
                          onChange={(e) => setNewContactForm({ ...newContactForm, stationLocation: e.target.value })}
                          className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className="px-5 h-[60px] rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-sm sm:text-base font-normal flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95"
                        >
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>📍 Select Location on Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={openLiveMapPage}
                          className="px-5 h-[60px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-normal flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 shadow-md"
                          title="Open main Live Geospatial Satellite Map to click and pick police station location"
                        >
                          <Globe className="w-5 h-5 text-white" />
                          <span>🗺️ Open Live Map</span>
                        </button>
                      </div>
                      {stationCoords.lat && stationCoords.lng && (
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-gray-400 pt-1">
                          <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                            Latitude: <strong className="text-blue-600 dark:text-blue-400 font-normal">{stationCoords.lat.toFixed(5)}</strong>
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                            Longitude: <strong className="text-blue-600 dark:text-blue-400 font-normal">{stationCoords.lng.toFixed(5)}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Field 6: Officer Email */}
                    <div className="space-y-3 w-full">
                      <label className="block text-slate-800 dark:text-slate-200 font-normal text-lg sm:text-xl flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-base sm:text-lg flex items-center justify-center font-normal">6</span>
                          <span>Officer Email</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. officer.sharma@police.gov.in"
                        value={newContactForm.email}
                        onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                        className="w-full h-[60px] px-6 py-4 bg-gray-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl text-slate-800 dark:text-white text-lg sm:text-xl font-normal placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>

                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full h-[64px] py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-lg sm:text-xl rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-3 cursor-pointer active:scale-[0.99]"
                    >
                      <Save className="w-6 h-6" />
                      <span>Save Officer Information</span>
                    </button>
                  </div>
                </form>

                {/* 🌟 REGISTERED OFFICERS LIST TABLE (Criminal_traking.officer_information) */}
                <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div>
                      <h4 className="font-normal text-slate-800 dark:text-white text-xl flex items-center gap-2">
                        <span>📋</span>
                        <span>Registered Officers Directory ({officers.length})</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-normal">
                        MongoDB Source of Truth: <code className="text-blue-600 dark:text-blue-400 font-mono">Criminal_traking.officer_information</code>
                      </p>
                    </div>
                  </div>

                  {officers.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No officers registered yet. Use the form above to add an officer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-normal uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4">Officer ID</th>
                            <th className="py-3 px-4">Officer Name</th>
                            <th className="py-3 px-4">Rank / Designation</th>
                            <th className="py-3 px-4">Police Station Name</th>
                            <th className="py-3 px-4">Station Location & Map</th>
                            <th className="py-3 px-4">Officer Email</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {officers.map((off) => (
                            <tr key={off.id || off.officer_id} className="hover:bg-gray-50 dark:hover:bg-[#1c202d] transition-colors">
                              <td className="py-3 px-4 font-mono font-normal text-slate-800 dark:text-white">{off.officer_id || off.id}</td>
                              <td className="py-3 px-4 font-normal text-slate-800 dark:text-white">{off.officer_name || off.name}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-gray-300">{off.rank || off.designation}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-gray-300">{off.police_station_name || off.stationName}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-gray-300">
                                <div>{off.location || off.stationLocation || 'Station Address'}</div>
                                {(off.map_link || (off.latitude && off.longitude)) && (
                                  <a
                                    href={off.map_link || `https://maps.google.com/?q=${off.latitude},${off.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 font-normal hover:underline inline-flex items-center gap-1 mt-1 text-[11px]"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    <span>📍 View Location on Map</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600 dark:text-gray-300">{off.officer_email || off.email}</td>
                              <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const targetEmail = off.officer_email || off.email;
                                    try {
                                      showToast('Sending Email...', `Sending test email to ${targetEmail}`, 'info');
                                      const res = await authFetch('http://127.0.0.1:8000/api/criminal/officers/send-test-email', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          email: targetEmail,
                                          name: off.officer_name || off.name,
                                          officerId: off.officer_id || off.id,
                                          rank: off.rank,
                                          stationName: off.police_station_name || off.stationName,
                                          stationLocation: off.location || off.stationLocation
                                        })
                                      });
                                      if (res.ok) {
                                        showToast('Email Sent!', `Registration email dispatched to ${targetEmail}`, 'success');
                                      } else {
                                        showToast('Send Failed', `Could not send email to ${targetEmail}`, 'error');
                                      }
                                    } catch (err) {
                                      showToast('Email Error', 'Failed to send test email.', 'error');
                                    }
                                  }}
                                  className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-normal hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  ✉️ Send Email
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteOfficer(off.id || off.officer_id)}
                                  className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-normal hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Criminal System Audit History Tab (Excludes Private Attendance Logs) */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>Criminal System Audit History Logs</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Permanent log archive for criminal detection and management events. (Attendance logs remain private to Attendance Roster Module).
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedHistoryIds.length > 0 && (
                      <button
                        onClick={handleBulkDeleteHistory}
                        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedHistoryIds.length})</span>
                      </button>
                    )}
                    {historyLogs.length > 0 && (
                      <button
                        onClick={clearAllHistoryLogs}
                        className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#181b24] hover:bg-red-500 hover:text-white text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center space-x-1.5 border border-gray-200 dark:border-gray-800 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All History</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Criminal Logs</span>
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">{criminalLogsCount}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Registered Profiles</span>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">{registeredCount}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Deleted Events</span>
                    <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">{deletedCount}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Alert Dispatches</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{dispatchCount}</span>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search criminal logs by name, ID, or action..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={historyTypeFilter}
                      onChange={(e) => setHistoryTypeFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-bold focus:outline-none"
                    >
                      <option value="all">All Criminal Audit Events</option>
                      <option value="registered">Registered Profiles</option>
                      <option value="deleted">Deleted Record Logs</option>
                      <option value="dispatch">Alert & Dispatch Logs</option>
                    </select>
                  </div>
                </div>

                {/* History Data Table */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                      No history records found matching your filter criteria.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-[#161922] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              onChange={handleSelectAllHistory}
                              checked={selectedHistoryIds.length === filteredHistory.length && filteredHistory.length > 0}
                              className="rounded accent-indigo-600 cursor-pointer"
                            />
                          </th>
                          <th className="p-3">Log ID / Time</th>
                          <th className="p-3">Action Type</th>
                          <th className="p-3">Person / Record</th>
                          <th className="p-3">Role / Dept</th>
                          <th className="p-3">Details</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-white dark:bg-[#11141c]">
                        {filteredHistory.map((log) => {
                          const isSelected = selectedHistoryIds.includes(log.id);
                          const isDeletedEvent = log.action?.includes('Deleted');
                          const isRegisteredEvent = log.action?.includes('Registered');

                          return (
                            <tr key={log.id} className={`hover:bg-gray-50/80 dark:hover:bg-[#161922]/80 transition-colors ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectOneHistory(log.id)}
                                  className="rounded accent-indigo-600 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 font-mono text-[11px]">
                                <span className="font-bold text-gray-900 dark:text-white block">{log.id}</span>
                                <span className="text-gray-400 text-[10px] block mt-0.5">{log.dateTime}</span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                                  isDeletedEvent 
                                    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' 
                                    : isRegisteredEvent
                                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isDeletedEvent ? <XCircle className="w-3 h-3" /> : isRegisteredEvent ? <UserCheck className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-gray-900 dark:text-white block">{log.name}</span>
                                <span className="text-gray-400 text-[10px] font-mono block">{log.personId}</span>
                              </td>
                              <td className="p-3 text-gray-600 dark:text-gray-300 font-medium">
                                <span className="block font-semibold">{log.role}</span>
                                <span className="text-[10px] text-gray-400 block">{log.department}</span>
                              </td>
                              <td className="p-3 text-gray-500 dark:text-gray-400 text-[11px] max-w-xs truncate">
                                {log.details}
                                {isDeletedEvent && (
                                  <span className="text-rose-500 dark:text-rose-400 text-[10px] block font-bold mt-0.5">
                                    *(Roster Record Deleted, Preserved in Audit Archive)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => deleteHistoryLog(log.id)}
                                  title="Delete history log item"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 text-xs sm:text-sm">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  <span>Session & Access Controls</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                        <Key className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Two-Factor Cryptographic Token</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Hardware token authentication for high-risk override actions</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Automated Inactivity Lock</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Lock console display after 15 minutes of zero operator input</p>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-indigo-600 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 text-xs sm:text-sm">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500" />
                  <span>Real-Time Threat Dispatch & Alarms</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Critical Breach Acoustic Alarm</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Play audio acoustic alert when high-risk suspect is detected</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoAlertSound}
                      onChange={(e) => setPreferences({ ...preferences, autoAlertSound: e.target.checked })}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">PCR Patrol Car Broadcast</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Instant dispatch broadcast to nearest patrol units</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.anprLiveIntercepts}
                      onChange={(e) => setPreferences({ ...preferences, anprLiveIntercepts: e.target.checked })}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* System Preferences Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6 text-xs sm:text-sm">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-indigo-500" />
                  <span>Command Console Preferences</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">High-Contrast Surveillance Palette</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Optimized for 24/7 command center monitor banks</p>
                      </div>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Telemetry Audit Retention Window</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Historical CCTV detection event retention period</p>
                      </div>
                    </div>
                    <span className="text-gray-900 dark:text-white font-mono font-bold">90 Days</span>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-6 text-xs sm:text-sm">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-500" />
                  <span>Neural Vision & Stream Codecs</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">AI Real-Time Optical Flow Processing</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Enable hardware neural inferencing on all 4K PTZ streams</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.neuralAutoScan}
                      onChange={(e) => setPreferences({ ...preferences, neuralAutoScan: e.target.checked })}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">60 FPS Ultra-Low Latency Mode</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Stream video at 60 frames per second using hardware acceleration</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.cctvStreamFps60}
                      onChange={(e) => setPreferences({ ...preferences, cctvStreamFps60: e.target.checked })}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>



          <SettingsBgSvg className="w-16 h-16 text-indigo-500" />
        </div>
      </div>

      {/* 🌟 REUSABLE CHAKRAVYUH MAP LOCATION PICKER MODAL FOR POLICE STATION */}
      <ChakravyuhLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectLocation={({ lat, lng, address }) => {
          setStationCoords({ lat, lng });
          setNewContactForm(prev => ({
            ...prev,
            stationLocation: address || prev.stationLocation || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
          }));
          if (showToast) showToast('Location Selected', 'Police Station coordinates & address loaded into form.', 'success');
        }}
        initialLat={stationCoords.lat}
        initialLng={stationCoords.lng}
        initialAddress={newContactForm.stationLocation}
        title="Select Police Station Location on CHAKRAVYUH Map"
      />
    </div>
  );
};
