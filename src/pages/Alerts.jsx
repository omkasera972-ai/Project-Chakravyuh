import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  Shield, 
  Car, 
  ScanFace, 
  CheckCircle2, 
  User, 
  Plus, 
  Check, 
  ArrowUpDown,
  Filter,
  Eye,
  X,
  Search,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AlertBgSvg,
  ShieldBgSvg,
  WatchlistBgSvg,
  ReportBgSvg
} from '../components/common/CardBackgroundIcons';

export const Alerts = () => {
  const { activeModule, alerts, watchlist = [], acknowledgeAlert, resolveAlert, deleteAlert, deleteMultipleAlerts, clearAllAlerts, setActiveModal } = useApp();
  const { moduleId } = useParams();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortMode, setSortMode] = useState('condition'); // 'condition' | 'latest'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);

  const currentModule = moduleId || activeModule || 'criminal-tracking';

  // Checkbox selection state for bulk deletion
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);

  // Helper to get effective priority (elevates to Critical if suspect is registered as Critical Risk)
  const getEffectivePriority = (alert) => {
    const p = String(alert.priority || '').toLowerCase();
    if (p.includes('critical')) return 'Critical';
    const alertTxt = `${alert.title || ''} ${alert.description || ''}`.toLowerCase();
    const isCriticalSuspect = (watchlist || []).some(w => 
      w.name && alertTxt.includes(w.name.toLowerCase()) && 
      (String(w.riskLevel || '').toLowerCase().includes('critical') || String(w.riskLevel || '').toLowerCase().includes('criminal'))
    );
    if (isCriticalSuspect) return 'Critical';
    if (p.includes('high')) return 'High';
    return alert.priority || 'High';
  };

  // Filter alerts STRICTLY by active module (100% Data & Alert Isolation)
  const moduleAlerts = (alerts || []).filter(a => {
    const title = (a.title || '').toLowerCase();
    const type = (a.type || '').toLowerCase();
    const desc = (a.description || '').toLowerCase();
    const text = `${title} ${type} ${desc}`;

    // 1. Criminal Watchlist & Suspect alerts ALWAYS route to criminal-tracking
    if (text.includes('watchlist') || text.includes('criminal') || text.includes('suspect') || text.includes('fugitive') || text.includes('ipc')) {
      return currentModule === 'criminal-tracking';
    }

    // 2. Missing Child alerts ALWAYS route to missing-child
    if (text.includes('missing') || text.includes('child') || text.includes('case mc-')) {
      return currentModule === 'missing-child';
    }

    // 3. ANPR alerts ALWAYS route to anpr
    if (text.includes('anpr') || text.includes('speed') || text.includes('vehicle') || text.includes('challan') || a.icon === 'Car') {
      return currentModule === 'anpr';
    }

    // 4. Defence alerts ALWAYS route to defence
    if (text.includes('breach') || text.includes('armory') || text.includes('vault') || text.includes('perimeter') || text.includes('defence') || text.includes('defense') || a.icon === 'Shield') {
      return currentModule === 'defence';
    }

    // 5. Attendance alerts ALWAYS route to attendance
    if (text.includes('attendance') || a.icon === 'UserCheck') {
      return currentModule === 'attendance';
    }

    // 6. Fallback to explicit module tag
    if (a.module) {
      return a.module === currentModule;
    }

    return currentModule === 'criminal-tracking';
  });

  // Condition-based Ranking Score Calculator
  const getConditionScore = (alert) => {
    let score = 0;
    const effP = getEffectivePriority(alert);
    if (effP === 'Critical') score += 100;
    else if (effP === 'High') score += 75;
    else if (effP === 'Medium') score += 50;
    else score += 25;

    if (alert.status === 'Active') score += 40;
    else if (alert.status === 'Acknowledged') score += 20;
    else score += 0;

    const alertType = String(alert.type || alert.category || '').toLowerCase();
    if (alertType.includes('watchlist') || alertType.includes('intercept') || alertType.includes('criminal')) score += 30;
    else if (alertType.includes('anpr') || alertType.includes('missing')) score += 20;
    else if (alertType.includes('breach')) score += 15;

    if (alert.timeAgo?.includes('Just now') || alert.timeAgo?.includes('s ago') || alert.timeAgo?.includes('m ago')) score += 15;

    return score;
  };

  const criticalCount = moduleAlerts.filter(a => getEffectivePriority(a) === 'Critical' && a.status !== 'Resolved').length;
  const highCount = moduleAlerts.filter(a => getEffectivePriority(a) === 'High' && a.status !== 'Resolved').length;
  const resolvedCount = moduleAlerts.filter(a => a.status === 'Resolved').length;
  const totalActive = moduleAlerts.filter(a => a.status !== 'Resolved').length;

  const filteredAlerts = moduleAlerts
    .filter(a => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = a.title?.toLowerCase().includes(q) ||
                            a.description?.toLowerCase().includes(q) ||
                            a.location?.toLowerCase().includes(q) ||
                            a.camera?.toLowerCase().includes(q) ||
                            a.id?.toLowerCase().includes(q);

      const effP = getEffectivePriority(a);
      const matchesPriority = priorityFilter === 'All' || 
                             (priorityFilter === 'Resolved' ? a.status === 'Resolved' : effP === priorityFilter);
      
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      const getTs = (alt) => {
        const t = alt.timestamp || alt.createdAt || alt.created_at || alt.time;
        if (!t) return 0;
        const ms = new Date(t).getTime();
        return isNaN(ms) ? 0 : ms;
      };
      if (sortMode === 'condition') {
        const scoreDiff = getConditionScore(b) - getConditionScore(a);
        if (scoreDiff !== 0) return scoreDiff;
      }
      return getTs(b) - getTs(a);
    });

  // Toggle single alert checkbox selection
  const handleToggleSelect = (id) => {
    setSelectedAlertIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select All or Unselect All currently visible filtered alerts
  const handleSelectAllToggle = () => {
    const visibleIds = filteredAlerts.map(a => a.id);
    const allSelected = visibleIds.every(id => selectedAlertIds.includes(id));
    if (allSelected) {
      setSelectedAlertIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedAlertIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Bulk Delete Selected Alerts
  const handleDeleteSelected = () => {
    if (selectedAlertIds.length === 0) return;
    if (window.confirm(`Delete ${selectedAlertIds.length} selected alert(s) permanently?`)) {
      deleteMultipleAlerts(selectedAlertIds);
      setSelectedAlertIds([]);
    }
  };

  // Clear All Alerts
  const handleClearAll = () => {
    if (window.confirm('Delete ALL alerts permanently?')) {
      clearAllAlerts();
      setSelectedAlertIds([]);
    }
  };

  const getAlertIcon = (iconName, type) => {
    const typeStr = String(type || '').toLowerCase();
    if (typeStr.includes('anpr') || typeStr.includes('vehicle')) return <Car className="w-5 h-5 text-amber-500" />;
    if (typeStr.includes('watchlist') || typeStr.includes('match') || typeStr.includes('criminal')) return <ScanFace className="w-5 h-5 text-red-500" />;
    if (typeStr.includes('missing') || typeStr.includes('child')) return <User className="w-5 h-5 text-purple-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getAlertStyle = (priority, status) => {
    if (status === 'Resolved') {
      return {
        bg: 'bg-[#f8f9fa] dark:bg-[#12141c] border-gray-200 dark:border-gray-800/80 opacity-75',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        locationColor: 'text-gray-500 dark:text-gray-400',
        badgeBg: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        btnBg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      };
    }
    if (priority === 'Critical' || priority === 'Critical Risk' || priority === 'CRITICAL' || String(priority).toLowerCase().includes('critical')) {
      return {
        bg: 'bg-red-50/50 dark:bg-[#1c1215] border-red-200 dark:border-red-900/60',
        iconBg: 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400',
        locationColor: 'text-red-700 dark:text-red-400',
        badgeBg: 'bg-red-600 text-white font-bold',
        btnBg: 'bg-red-600 hover:bg-red-700 text-white'
      };
    }
    if (priority === 'High' || priority === 'High Risk' || priority === 'HIGH' || String(priority).toLowerCase().includes('high')) {
      return {
        bg: 'bg-amber-50/50 dark:bg-[#1c1812] border-amber-200 dark:border-amber-900/60',
        iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400',
        locationColor: 'text-amber-700 dark:text-amber-400',
        badgeBg: 'bg-amber-500 text-white font-bold',
        btnBg: 'bg-amber-600 hover:bg-amber-700 text-white'
      };
    }
    return {
      bg: 'bg-gray-50 dark:bg-[#141720] border-gray-200 dark:border-gray-800',
      iconBg: 'bg-gray-800 text-white',
      locationColor: 'text-gray-700 dark:text-gray-300',
      badgeBg: 'bg-gray-800 text-white',
      btnBg: 'bg-gray-900 hover:bg-black text-white'
    };
  };

  const isAllFilteredSelected = filteredAlerts.length > 0 && filteredAlerts.every(a => selectedAlertIds.includes(a.id));

  return (
    <div className="space-y-4 select-none pb-8">
      {/* Top Banner Header */}
      <div className="bg-[#111318] text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-[#21252f]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Security Incident & Alert Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time threat triage, perimeter alarm acknowledgements & dispatch log
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('addAlert')}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-gray-950 font-bold hover:bg-gray-100 transition-all text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 text-gray-950 stroke-[2.5]" />
            <span>Dispatch Custom Alert</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-2xs group">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Active Alerts</span>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalActive}</div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block font-medium">Pending Triage</span>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500">
            <Bell className="w-6 h-6 stroke-[2]" />
          </div>
          <AlertBgSvg className="w-12 h-12 text-red-500" />
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-2xs group">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Critical Incidents</span>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{criticalCount}</div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block font-medium">Immediate Red Priority</span>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <AlertBgSvg className="w-12 h-12 text-red-600" />
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-2xs group">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">High Priority</span>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{highCount}</div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block font-medium">Active Response</span>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-500">
            <Shield className="w-6 h-6 stroke-[2]" />
          </div>
          <ShieldBgSvg className="w-12 h-12 text-amber-500" />
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-2xs group">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Resolved Today</span>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{resolvedCount}</div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block font-medium">Closed Cases</span>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
          <ReportBgSvg className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      {/* Select All & Bulk Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAllToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition-all"
          >
            {isAllFilteredSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-400" />}
            <span>{isAllFilteredSelected ? 'Deselect All' : 'Select All Alerts'}</span>
          </button>

          {selectedAlertIds.length > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              {selectedAlertIds.length} Alert(s) Selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedAlertIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedAlertIds.length})</span>
            </button>
          )}

          {alerts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              Clear All Alerts
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { label: 'All', count: moduleAlerts.length },
            { label: 'Critical', count: criticalCount },
            { label: 'High', count: highCount },
            { label: 'Medium', count: moduleAlerts.filter(a => a.priority === 'Medium' && a.status !== 'Resolved').length },
            { label: 'Resolved', count: resolvedCount }
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => setPriorityFilter(tab.label)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priorityFilter === tab.label
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-xs'
                  : 'bg-white dark:bg-[#161922] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alert, location..."
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-white dark:bg-[#161922] p-1 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400 pl-2 font-bold flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span>Sort:</span>
            </span>
            <button
              onClick={() => setSortMode('latest')}
              className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                sortMode === 'latest'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ⚡ Most Recent
            </button>
            <button
              onClick={() => setSortMode('condition')}
              className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                sortMode === 'condition'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Condition Ranking
            </button>
          </div>
        </div>
      </div>

      {/* Main Alert List Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#121419] rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Alerts Found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">All alerts resolved or filter returns zero results.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const targetId = alert.id || alert._id;
            const effPriority = getEffectivePriority(alert);
            const score = getConditionScore(alert);
            const style = getAlertStyle(effPriority, alert.status);
            const isChecked = selectedAlertIds.includes(targetId);

            return (
              <div
                key={targetId}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${style.bg}`}
              >
                {/* Left Section: Checkbox + Icon Box + Details */}
                <div className="flex items-start space-x-4">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => handleToggleSelect(targetId)}
                    className="mt-3 text-slate-400 hover:text-white transition-colors"
                  >
                    {isChecked ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5 text-slate-500" />}
                  </button>

                  {/* Rounded Icon Box */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${style.iconBg}`}>
                    {getAlertIcon(alert.icon, alert.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">
                        {alert.title}
                      </h3>

                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${style.badgeBg}`}>
                        {effPriority}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-gray-200/80 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-[10px] font-bold border border-gray-300/60 dark:border-gray-700">
                        {alert.camera}
                      </span>

                      <span className="text-[11px] text-gray-400 font-medium font-mono">
                        {alert.timeAgo} {alert.formattedRealTime ? `• ${alert.formattedRealTime}` : ''}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                      {alert.description}
                    </p>

                    <p className={`text-[11px] font-bold font-mono ${style.locationColor}`}>
                      Location: {alert.location}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setSelectedAlertDetail(alert)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all ${style.btnBg}`}
                  >
                    View Details
                  </button>

                  {alert.status !== 'Resolved' && (
                    <>
                      {alert.status !== 'Acknowledged' && (
                        <button
                          onClick={() => acknowledgeAlert(targetId)}
                          className="px-3.5 py-2 rounded-xl bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 text-blue-800 dark:text-blue-300 font-bold text-xs transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(targetId)}
                        className="px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors"
                      >
                        Resolve Case
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete alert ${targetId} (${alert.title})?`)) {
                        deleteAlert(targetId);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident Dossier Detail Modal */}
      {selectedAlertDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121419] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-gray-900 dark:text-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-gray-900 dark:text-white font-bold text-sm">
                Incident Dossier: {selectedAlertDetail.id}
              </h3>
              <button 
                onClick={() => setSelectedAlertDetail(null)} 
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Incident Title:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedAlertDetail.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Priority Rating:</span>
                <span className={`font-bold ${
                  getEffectivePriority(selectedAlertDetail) === 'Critical'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {getEffectivePriority(selectedAlertDetail)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Camera Feed:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedAlertDetail.camera}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Location:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedAlertDetail.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Telemetry Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAlertDetail.status}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#181b24] border border-gray-200 dark:border-gray-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-gray-700 dark:text-gray-300">Detailed Description:</span>
              <p className="text-gray-600 dark:text-gray-400">{selectedAlertDetail.description}</p>
            </div>

            <button
              onClick={() => setSelectedAlertDetail(null)}
              className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold rounded-xl text-xs hover:bg-black dark:hover:bg-gray-100 transition-colors shadow-xs"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
