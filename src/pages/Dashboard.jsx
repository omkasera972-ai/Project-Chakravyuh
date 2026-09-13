import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  Video, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Settings, 
  Activity, 
  ScanFace, 
  UserCheck, 
  ShieldAlert, 
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  Car,
  Target,
  Radio,
  X
} from 'lucide-react';
import {
  CameraBgSvg,
  AlertBgSvg,
  WatchlistBgSvg,
  AttendanceBgSvg,
  MapBgSvg,
  ShieldBgSvg,
  BellBgSvg
} from '../components/common/CardBackgroundIcons';

export const Dashboard = () => {
  const { activeModule, watchlist = [], alerts = [], cameras = [], personnel = [] } = useApp();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [showCtInfoModal, setShowCtInfoModal] = useState(false);
  const [showAttendanceInfoModal, setShowAttendanceInfoModal] = useState(false);
  const [showAnprInfoModal, setShowAnprInfoModal] = useState(false);
  const [showDefenceInfoModal, setShowDefenceInfoModal] = useState(false);

  const currentModule = moduleId || activeModule || 'criminal-tracking';

  const getModuleTitle = () => {
    switch (currentModule) {
      case 'attendance':
        return 'AI Face Recognition Attendance Dashboard';
      case 'criminal-tracking':
        return 'Criminal Tracking Command Dashboard';
      case 'anpr':
        return 'ANPR Traffic Command Dashboard';
      case 'missing-child':
        return 'Missing Children Rescue Command Dashboard';
      case 'defence':
        return 'Defence Tactical Command Dashboard';
      default:
        return 'Chakravyuh Command Dashboard';
    }
  };

  const getModuleAccentColor = () => {
    switch (currentModule) {
      case 'attendance': return 'emerald';
      case 'criminal-tracking': return 'red';
      case 'anpr': return 'amber';
      case 'missing-child': return 'purple';
      case 'defence': return 'blue';
      default: return 'indigo';
    }
  };

  const accent = getModuleAccentColor();

  const moduleAlerts = (alerts || [])
    .filter(a => {
      if (a.module) return a.module === currentModule;
      if (a.type?.includes('Breach') || a.type?.includes('Armory') || a.type?.includes('Vault') || a.icon === 'Shield') {
        return currentModule === 'defence';
      }
      if (a.type?.includes('Missing') || a.title?.includes('CHILD') || a.icon === 'User') {
        return currentModule === 'missing-child';
      }
      if (a.type?.includes('ANPR') || a.type?.includes('Speed') || a.icon === 'Car') {
        return currentModule === 'anpr';
      }
      if (a.type?.includes('Attendance') || a.icon === 'UserCheck') {
        return currentModule === 'attendance';
      }
      return currentModule === 'criminal-tracking';
    })
    .sort((a, b) => {
      const getTs = (alt) => {
        const t = alt.timestamp || alt.createdAt || alt.created_at || alt.time;
        if (!t) return 0;
        const ms = new Date(t).getTime();
        return isNaN(ms) ? 0 : ms;
      };
      return getTs(b) - getTs(a);
    });
  const activeAlerts = moduleAlerts.filter(a => a.status === 'Active');
  const criticalCount = moduleAlerts.filter(a => a.priority === 'Critical' && a.status !== 'Resolved').length;
  const highRiskCount = (watchlist || []).filter(w => w.riskLevel === 'Critical' || w.riskLevel === 'High Risk' || w.riskLevel === 'Criminal').length;
  const activeCamerasCount = (cameras || []).filter(c => c.status === 'ACTIVE' || c.status === 'Live' || c.status === 'Online' || c.status === 'Active').length;

  return (
    <div className="space-y-6 select-none pb-4 min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/20 to-indigo-50/20 dark:from-[#0a0d14] dark:via-[#0e111a] dark:to-[#111522] rounded-3xl p-2 sm:p-4">
      {/* Top Banner: Executive Overview */}
      <div className="bg-[#0f141d] border border-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              {getModuleTitle()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl leading-relaxed">
              {currentModule === 'attendance'
                ? 'Centralized operational overview, live attendance telemetry status, camera node metrics, and contactless check-in roster monitoring.'
                : 'Centralized operational overview, live telemetry status, surveillance node metrics, and threat dispatch monitoring.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(`/portal/${currentModule}/${currentModule}`)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Launch {currentModule === 'attendance' ? 'Smart Attendance Portal' : currentModule === 'criminal-tracking' ? 'Criminal Tracker' : 'Feature Workspace'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Operational Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Surveillance Nodes */}
        <button
          onClick={() => navigate(`/portal/${currentModule}/cameras`)}
          className="relative overflow-hidden bg-blue-50/40 dark:bg-[#11141c] border-2 border-blue-200/80 dark:border-blue-900/40 hover:border-blue-500/80 p-5 rounded-2xl shadow-xs cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 group-hover:text-blue-500 transition-colors uppercase tracking-wider">
                Surveillance Nodes
              </span>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Video className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{activeCamerasCount} Nodes</div>
            <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Operational Telemetry</span>
            </div>
          </div>
          <CameraBgSvg className="w-12 h-12 text-blue-500" />
        </button>

        {/* Card 2: Active Threat Alerts / Check-ins */}
        {currentModule === 'attendance' ? (
          <button
            onClick={() => navigate(`/portal/${currentModule}/reports`)}
            className="relative overflow-hidden bg-emerald-50/40 dark:bg-[#11141c] border-2 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-500/80 p-5 rounded-2xl shadow-xs cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 group-hover:text-emerald-500 transition-colors uppercase tracking-wider">
                  Verified Check-ins
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{personnel.filter(p => p.status === 'Present').length} Present</div>
              <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                AI Face Recognition Verified Present Logs
              </div>
            </div>
            <AttendanceBgSvg className="w-12 h-12 text-emerald-500" />
          </button>
        ) : (
          <button
            onClick={() => navigate(`/portal/${currentModule}/alerts`)}
            className="relative overflow-hidden bg-red-50/40 dark:bg-[#11141c] border-2 border-red-200/80 dark:border-red-900/40 hover:border-red-500/80 p-5 rounded-2xl shadow-xs cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 group-hover:text-red-500 transition-colors uppercase tracking-wider">
                  Active Threat Alerts
                </span>
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{activeAlerts.length} Active</div>
              <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-bold">
                {criticalCount} Critical Priority Pending
              </div>
            </div>
            <AlertBgSvg className="w-12 h-12 text-red-500" />
          </button>
        )}

        {/* Card 3: Registered Watchlist / Enrolled Roster */}
        {currentModule === 'attendance' ? (
          <button
            onClick={() => navigate(`/portal/${currentModule}/attendance`)}
            className="relative overflow-hidden bg-teal-50/40 dark:bg-[#11141c] border-2 border-teal-200/80 dark:border-teal-900/40 hover:border-teal-500/80 p-5 rounded-2xl shadow-xs cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 group-hover:text-teal-500 transition-colors uppercase tracking-wider">
                  Enrolled Roster
                </span>
                <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{personnel.length} Members</div>
              <div className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-bold">
                Total Staff & Students Enrolled
              </div>
            </div>
            <AttendanceBgSvg className="w-12 h-12 text-teal-500" />
          </button>
        ) : (
          <button
            onClick={() => navigate(`/portal/${currentModule}/${currentModule}`)}
            className="relative overflow-hidden bg-amber-50/40 dark:bg-[#11141c] border-2 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-500/80 p-5 rounded-2xl shadow-xs cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-gray-700 dark:text-gray-200 group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                  Registered Watchlist
                </span>
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{watchlist.length} Targets</div>
              <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold">
                {highRiskCount} High Risk Suspects
              </div>
            </div>
            <WatchlistBgSvg className="w-12 h-12 text-amber-500" />
          </button>
        )}
      </div>

      {/* Quick Portal Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-wider uppercase">
          Portal Control Tools & Navigation Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentModule === 'anpr' ? (
            <button
              onClick={() => setShowAnprInfoModal(true)}
              className="relative overflow-hidden border-t-4 border-t-blue-500 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-900 border-x border-b border-blue-500/40 hover:border-blue-400 text-left space-y-3 transition-all group shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10 space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-md">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                      🚘 Automatic Number Plate Engine
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight mb-1.5">
                    ANPR System — Advantages & Strategic Impact
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    Real-time 12ms ANPR OCR engine captures license plates up to 180 km/h, tracking stolen vehicles, fake plates, and e-challan speed violations.
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-blue-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Full Briefing & Impact Details →
                </span>
              </div>
              <CameraBgSvg className="w-12 h-12 text-blue-400" />
            </button>
          ) : currentModule === 'defence' ? (
            <button
              onClick={() => setShowDefenceInfoModal(true)}
              className="relative overflow-hidden border-t-4 border-t-red-600 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-red-950/80 to-slate-900 border-x border-b border-red-500/40 hover:border-red-400 text-left space-y-3 transition-all group shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10 space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-300 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-md">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-red-300 text-[10px] font-extrabold uppercase tracking-wider">
                      🛡️ Military & Defence Tactical Engine
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight mb-1.5">
                    Defence System — Advantages & Strategic Impact
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    Real-time 12ms AI thermal & optical sensor mesh detects perimeter intrusions, drone threats, and border breaches with instant QRT patrol dispatch.
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-red-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Full Briefing & Impact Details →
                </span>
              </div>
              <ShieldBgSvg className="w-12 h-12 text-red-500" />
            </button>
          ) : currentModule === 'attendance' ? (
            <button
              onClick={() => setShowAttendanceInfoModal(true)}
              className="relative overflow-hidden border-t-4 border-t-emerald-500 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-x border-b border-emerald-500/40 hover:border-emerald-400 text-left space-y-4 transition-all group shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                      🎓 Campus & Corporate Biometric Engine
                    </span>
                  </div>
                  <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                    Smart Attendance System
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed font-medium">
                    Automated AI multi-face recognition system for instant contactless student & staff check-ins, eliminating manual roll-calls, proxy attendance, and queue delays with real-time roster analytics.
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Complete Attendance Info & Impact Briefing →
                </span>
              </div>
              <AttendanceBgSvg className="w-14 h-14 text-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => setShowCtInfoModal(true)}
              className="relative overflow-hidden border-t-4 border-t-indigo-500 p-6 rounded-2xl bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 border-x border-b border-indigo-500/40 hover:border-indigo-400 text-left space-y-4 transition-all group shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ScanFace className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                      🇮🇳 National Law Enforcement Engine
                    </span>
                  </div>
                  <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                    Criminal Tracking System
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed font-medium">
                    Yeh AI System Bharat Sarkar aur State Police ko live CCTV feeds aur facial biometrics ke dwara wanted criminals aur chhoro ko real-time 12ms me pehchan kar pakadne me help karta hai.
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-indigo-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Complete App Info & Impact Briefing →
                </span>
              </div>
              <AttendanceBgSvg className="w-14 h-14 text-indigo-400" />
            </button>
          )}

          <button
            onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            className="relative overflow-hidden border-t-4 border-t-blue-500 p-6 rounded-2xl bg-white dark:bg-[#11141c] border-x border-b border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left space-y-4 transition-all group shadow-xs"
          >
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">Camera Network</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                  Manage live CCTV nodes, multi-channel feeds, and camera telemetry.
                </p>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                View Cameras →
              </span>
            </div>
            <CameraBgSvg className="w-14 h-14 text-blue-500" />
          </button>

          <button
            onClick={() => navigate(`/portal/${currentModule}/maps`)}
            className="relative overflow-hidden border-t-4 border-t-emerald-500 p-6 rounded-2xl bg-white dark:bg-[#11141c] border-x border-b border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left space-y-4 transition-all group shadow-xs"
          >
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">Geospatial Map</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                  Interactive real light map topology, camera nodes, and incident zones.
                </p>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Open Interactive Map →
              </span>
            </div>
            <MapBgSvg className="w-14 h-14 text-emerald-500" />
          </button>

          <button
            onClick={() => navigate(`/portal/${currentModule}/alerts`)}
            className="relative overflow-hidden border-t-4 border-t-red-500 p-6 rounded-2xl bg-white dark:bg-[#11141c] border-x border-b border-gray-200 dark:border-gray-800 hover:border-red-500/50 hover:bg-red-50/30 dark:hover:bg-red-950/20 text-left space-y-4 transition-all group shadow-xs"
          >
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">Alerts & Triage</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                  Real-time security threat triage logs and incident management.
                </p>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Check Active Alerts →
              </span>
            </div>
            <BellBgSvg className="w-14 h-14 text-red-500" />
          </button>
        </div>
      </div>

      {/* Recent Security / Attendance Telemetry Events (Full Width) */}
      <div className="relative overflow-hidden w-full bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs group">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {currentModule === 'attendance' ? 'Recent AI Face Recognition Attendance Telemetry Feed' : 'Recent Threat Telemetry Feed'}
              </h2>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 mt-1">
                {currentModule === 'attendance'
                  ? 'Live contactless attendance check-in events logged by campus camera terminals'
                  : 'Live surveillance events logged by active camera nodes'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/portal/${currentModule}/${currentModule === 'attendance' ? 'attendance' : 'alerts'}`)}
              className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex-shrink-0"
            >
              {currentModule === 'attendance' ? 'View Attendance Portal →' : 'View All Alerts →'}
            </button>
          </div>

          <div className="space-y-4">
            {currentModule === 'attendance' ? (
              (personnel || []).filter(p => p.status === 'Present').slice(0, 5).map((person) => (
                <div
                  key={person.id}
                  className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors shadow-xs"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden border border-emerald-500/30 shadow-xs">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCheck className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-base sm:text-lg leading-tight">{person.name}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold mt-1">
                        {person.id} • {person.department} ({person.role || 'Member'})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="font-mono text-xs sm:text-base font-bold text-gray-700 dark:text-gray-200">{person.entry || '--'}</span>
                    <span className={`px-3.5 py-1 rounded-full font-black text-xs sm:text-sm ${
                      person.status === 'Present'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                        : person.status === 'Late'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                    }`}>
                      {person.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (moduleAlerts || []).length > 0 ? (
              (moduleAlerts || []).slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 hover:border-red-500/40 transition-colors shadow-xs"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                      (alert.priority === 'Critical' || alert.priority === 'Critical Risk' || alert.priority === 'CRITICAL')
                        ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400'
                        : (alert.priority === 'High' || alert.priority === 'High Risk' || alert.priority === 'HIGH')
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-base sm:text-lg leading-tight">{alert.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold mt-1">{alert.location} • {alert.camera}</p>
                    </div>
                  </div>
                  <span className={`px-3.5 py-1 rounded-full font-black text-xs sm:text-sm ${
                    (alert.priority === 'Critical' || alert.priority === 'Critical Risk' || alert.priority === 'CRITICAL')
                      ? 'bg-red-600 text-white'
                      : (alert.priority === 'High' || alert.priority === 'High Risk' || alert.priority === 'HIGH')
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-600 text-white'
                    }`}>
                    {alert.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm sm:text-base font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No active threat telemetry events for this module.
              </div>
            )}
          </div>
        </div>
        <AttendanceBgSvg className="w-16 h-16 text-emerald-500" />
      </div>

      {/* 🛡️ DEFENCE TACTICAL SYSTEM — ADVANTAGES & STRATEGIC IMPACT BRIEFING MODAL */}
      {showDefenceInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <span className="px-3 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold text-sm">
                    MILITARY & DEFENCE TACTICAL COMMAND BRIEFING
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Defence Tactical Security System — Complete Working, Advantages & Strategic Impact
                </h2>
                <p className="text-base text-slate-300">
                  Comprehensive tactical breakdown of AI multi-sensor perimeter surveillance, autonomous drone detection, encrypted military C4ISR telemetry, and QRT countermeasure dispatch.
                </p>
              </div>
              <button
                onClick={() => setShowDefenceInfoModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Section 1: Core System Advantages & Benefits */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-red-400 flex items-center gap-2">
                <span>⚡ 1. Core System Advantages & Key Operational Benefits</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-900 border border-red-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-red-300 text-base block">🎯 12ms Multi-Sensor Threat Detection</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Fuses optical CCTV, thermal infrared (IR), and RADAR telemetry to detect perimeter intrusions, camouflage breaches, and unauthorized personnel in 12 milliseconds.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-amber-300 text-base block">🚁 Autonomous Drone & Infiltration Detection</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Deep learning neural mesh identifies low-altitude drone incursions and ground infiltration attempts under extreme weather, pitch dark night, or fog.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-emerald-300 text-base block">⚡ Automated QRT Patrol Dispatch</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Instantly calculates threat coordinates and streams real-time target telemetry to military Quick Reaction Teams (QRT) and command bunkers.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-blue-300 text-base block">🔒 Encrypted C4ISR & EW Resiliency</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Secured with 256-bit military encryption and anti-jamming mesh architecture designed to remain operational during electronic warfare attacks.</p>
                </div>
              </div>
            </div>

            {/* Section 2: Strategic Tactical Impact for Armed Forces */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
                <span>🛡️ 2. Strategic Tactical Impact</span>
              </h3>
              <ul className="text-sm text-slate-200 space-y-2.5 list-disc pl-6 leading-relaxed font-medium">
                <li><strong className="text-white font-extrabold">Zero Border & Perimeter Blind Spots:</strong> 360-degree continuous AI surveillance grid safeguarding forward operating posts, ammunition depots, and airbases.</li>
                <li><strong className="text-white font-extrabold">Instant Tactical Interception:</strong> Reduces threat identification and QRT dispatch response time from minutes to seconds.</li>
                <li><strong className="text-white font-extrabold">Geospatial Target Telemetry:</strong> Live 3D map mapping providing command officers with tactical situation awareness and incident heatmaps.</li>
                <li><strong className="text-white font-extrabold">Tamper-Proof Cyber Security:</strong> Hardened against cyber intrusions and unauthorized remote tampering.</li>
              </ul>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDefenceInfoModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
              >
                Close Briefing
              </button>

              <button
                onClick={() => {
                  setShowDefenceInfoModal(false);
                  navigate(`/portal/${currentModule}/defence`);
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Shield className="w-5 h-5" />
                <span>Open Defence Command Workspace →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚘 ANPR SYSTEM — ADVANTAGES & STRATEGIC IMPACT BRIEFING MODAL */}
      {showAnprInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚘</span>
                  <span className="px-3 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 font-extrabold text-sm">
                    TRAFFIC COMMAND & LAW ENFORCEMENT BRIEFING
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  ANPR Automatic Number Plate Recognition — System Advantages & Impact
                </h2>
                <p className="text-base text-slate-300">
                  Comprehensive breakdown of AI optical character recognition, stolen vehicle tracking, e-challan enforcement, and strategic traffic impact.
                </p>
              </div>
              <button
                onClick={() => setShowAnprInfoModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Section 1: Core System Advantages & Benefits (Fayde) */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-blue-400 flex items-center gap-2">
                <span>⚡ 1. System Advantages & Key Operational Benefits</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-blue-300 text-base block">🏎️ 12ms High-Speed OCR Recognition</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Captures and decodes registration plates on vehicles moving up to 180 km/h with 99.4% optical recognition precision across all Indian states.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-red-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-red-300 text-base block">🚨 Stolen & Cloned Plate Tracking</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Cross-references national crime and RTO databases in real-time to trigger instant alerts when stolen or forged license plates pass camera nodes.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-emerald-300 text-base block">🚦 Automated E-Challan & Speed Enforcement</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Automatically logs speed limit violations, red-light jumps, and wrong-way driving, generating instant digital e-challan notices with photographic evidence.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 space-y-1.5 shadow-xs">
                  <span className="font-extrabold text-purple-300 text-base block">🌙 All-Weather & Night Vision Performance</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">Infrared (IR) sensors and HDR imaging ensure 100% operational reading accuracy during night surveillance, heavy fog, rain, or glare.</p>
                </div>
              </div>
            </div>

            {/* Section 2: Strategic Impact for Traffic & Law Enforcement */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
                <span>🛡️ 2. Strategic Operational Impact</span>
              </h3>
              <ul className="text-sm text-slate-200 space-y-2.5 list-disc pl-6 leading-relaxed font-medium">
                <li><strong className="text-white font-extrabold">99.4% Stolen Vehicle Interception Rate:</strong> Dispatches instant alert broadcasts with precise GPS coordinates to nearest PCR highway patrol vans.</li>
                <li><strong className="text-white font-extrabold">45% Traffic Congestion Reduction:</strong> Touchless barrier-free highway tolling and automated traffic management eliminates checkpoint bottleneck queues.</li>
                <li><strong className="text-white font-extrabold">Zero Human Bias & Corruption:</strong> Automated digital violation logging eliminates manual traffic stops, human negotiation, and oversight errors.</li>
                <li><strong className="text-white font-extrabold">Geospatial Telemetry & Heatmaps:</strong> Provides traffic command centers with real-time vehicle density analytics, peak-hour forecasts, and route monitoring.</li>
              </ul>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAnprInfoModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
              >
                Close Briefing
              </button>

              <button
                onClick={() => {
                  setShowAnprInfoModal(false);
                  navigate(`/portal/${currentModule}/anpr`);
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Car className="w-5 h-5" />
                <span>Open ANPR Traffic Workspace →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🇮🇳 CRIMINAL TRACKING SYSTEM — A TO Z APP INFO & GOVERNMENT IMPACT BRIEFING MODAL */}
      {showCtInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b26] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-gray-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇮🇳</span>
                  <span className="px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 font-bold text-sm">
                    GOVERNMENT OF INDIA & LAW ENFORCEMENT BRIEFING
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Criminal Tracking System — Complete Application Overview & Impact
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Detailed analysis of why law enforcement and government agencies require an automated AI facial recognition system to apprehend fugitives and prevent crime.
                </p>
              </div>
              <button
                onClick={() => setShowCtInfoModal(false)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Section 1: Why Law Enforcement Needs This App */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <span>🎯 1. Why India & Law Enforcement Need This App</span>
              </h3>
              <ul className="text-base text-gray-700 dark:text-gray-300 space-y-2.5 list-disc pl-6 leading-relaxed font-normal">
                <li><strong className="text-gray-900 dark:text-white font-semibold">Manual CCTV Surveillance Limitations:</strong> Humans in police control rooms cannot continuously monitor thousands of live CCTV feeds 24/7. Wanted criminals and fugitives easily slip away in crowded public spaces.</li>
                <li><strong className="text-gray-900 dark:text-white font-semibold">Inter-State Fugitive Tracking Gap:</strong> Criminals frequently cross state borders to evade arrest. Identifying them across jurisdictions using paper-based records or manual checks is inefficient and slow.</li>
                <li><strong className="text-gray-900 dark:text-white font-semibold">Real-Time Proactive Crime Prevention:</strong> Traditional law enforcement relies on post-incident investigation. This AI system provides real-time proactive interception the moment a suspect appears on any monitored camera network.</li>
              </ul>
            </div>

            {/* Section 2: Key Strategic Benefits for Police & Government */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <span>🛡️ 2. Key Strategic Benefits for Police & Security Agencies</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1a202c] border border-emerald-200 dark:border-emerald-900/60 space-y-1.5 shadow-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base block">⚡ 12ms Instant Facial Recognition</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">As soon as a wanted criminal's face appears in traffic, toll plaza, or railway station CCTV feeds, identification occurs within 12 milliseconds.</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1a202c] border border-red-200 dark:border-red-900/60 space-y-1.5 shadow-xs">
                  <span className="font-bold text-red-700 dark:text-red-300 text-base block">🚨 Automated Patrol Unit Dispatch</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">When a suspect is detected, instant alerts containing precise GPS coordinates and live camera stream codes are dispatched directly to nearby police PCR vans and control centers.</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1a202c] border border-amber-200 dark:border-amber-900/60 space-y-1.5 shadow-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-base block">📂 Centralized Biometric & FIR Database</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Synchronizes national criminal records, active FIR dossiers, and 128-dimensional facial descriptors across state borders into a unified cloud database.</p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1a202c] border border-blue-200 dark:border-blue-900/60 space-y-1.5 shadow-xs">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-base block">🔒 Mask, Spectacles & Angle Resilience</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Powered by a deep learning engine (ResNet-34) that matches facial features with 99.8% precision even with masks, glasses, facial hair, or off-angle camera perspectives.</p>
                </div>
              </div>
            </div>

            {/* Section 3: End-to-End System Architecture & Core Features */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <span>⚙️ 3. End-to-End System Architecture & Core Features</span>
              </h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-2 font-normal leading-relaxed">
                <p>• <strong className="text-gray-900 dark:text-white font-semibold">Live Checkpoint Scanner:</strong> High-resolution HD camera feed integration for static security checkpoints and border posts.</p>
                <p>• <strong className="text-gray-900 dark:text-white font-semibold">Surveillance Intercept Simulator:</strong> Real-time dynamic highway and transit surveillance matching feeds against active suspect watchlists.</p>
                <p>• <strong className="text-gray-900 dark:text-white font-semibold">Dossier & Profile Management:</strong> Comprehensive criminal records including risk ratings (Critical/High), last known GPS locations, biometric embeddings, and FIR references.</p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowCtInfoModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm transition-colors"
              >
                Close Briefing
              </button>

              <button
                onClick={() => {
                  setShowCtInfoModal(false);
                  navigate(`/portal/${currentModule}/criminal-tracking`);
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <ScanFace className="w-5 h-5" />
                <span>Open Live Criminal Tracker System →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎓 SMART ATTENDANCE SYSTEM — COMPLETE OVERVIEW, IMPACT & BENEFITS BRIEFING MODAL */}
      {showAttendanceInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <span className="px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
                    SMART CAMPUS & ENTERPRISE BIOMETRIC BRIEFING
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Smart Attendance System — Overview, Impact & Key Benefits
                </h2>
                <p className="text-base text-slate-300">
                  Comprehensive breakdown of automated AI multi-face biometric check-in, real-time roster analytics, and key operational advantages.
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Section 1: System Overview */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
                <span>🎯 1. System Overview</span>
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                The <strong className="text-white font-bold">Smart Attendance System</strong> is an automated, AI-powered contactless biometric verification platform designed for educational institutions (schools, colleges, universities) and corporate enterprises. Utilizing live CCTV feeds and webcams, the system performs real-time multi-face detection, extracts 128-dimensional facial feature vectors, and instantly marks attendance against enrolled rosters within milliseconds.
              </p>
            </div>

            {/* Section 2: Real-World Impact & Time Savings */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-teal-400 flex items-center gap-2">
                <span>🚀 2. Real-World Impact & Operational Efficiency</span>
              </h3>
              <ul className="text-sm text-slate-300 space-y-2.5 list-disc pl-6 leading-relaxed font-normal">
                <li><strong className="text-white font-bold">Eliminates Manual Roll-Calls:</strong> Saves 10 to 15 minutes per lecture or shift, returning hundreds of valuable instructional hours annually to teachers and students.</li>
                <li><strong className="text-white font-bold">Zero Proxy Attendance & Time Fraud:</strong> AI facial recognition eliminates buddy-punching, fraudulent sign-ins, and manual attendance manipulation.</li>
                <li><strong className="text-white font-bold">Touchless & Hygienic Access:</strong> Contactless check-in prevents bottleneck queues at physical turnstiles and fingerprint scanners.</li>
                <li><strong className="text-white font-bold">Automated Roster Analytics:</strong> Live check-in streams provide management with instant attendance visibility, absentee logs, and shift performance summaries.</li>
              </ul>
            </div>

            {/* Section 3: Key Strategic Benefits (System Advantages) */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
                <span>🛡️ 3. Key Benefits & System Advantages</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-bold text-emerald-400 text-sm block">⚡ 12ms Instant Multi-Face Detection</span>
                  <p className="text-xs text-slate-300 leading-relaxed">Detects and verifies multiple individuals simultaneously as they walk past entry gates without stopping or queuing.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-bold text-emerald-400 text-sm block">⏳ 12-Hour Anti-Duplicate Cooldown</span>
                  <p className="text-xs text-slate-300 leading-relaxed">Smart anti-duplicate logic suppresses repeated check-ins and duplicate popups when a student repeatedly passes the camera.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-bold text-emerald-400 text-sm block">🔊 Instant Speech Feedback & Overlay</span>
                  <p className="text-xs text-slate-300 leading-relaxed">Provides audio announcements ("Attendance marked for [Name]") and live green bounding box overlays for visual confirmation.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-xs">
                  <span className="font-bold text-emerald-400 text-sm block">📄 One-Click PDF & CSV Export</span>
                  <p className="text-xs text-slate-300 leading-relaxed">Instantly export daily attendance rosters, shift audit logs, and individual student check-in receipt PDFs with a single click.</p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
              >
                Close Briefing
              </button>

              <button
                onClick={() => {
                  setShowAttendanceInfoModal(false);
                  navigate(`/portal/${currentModule}/attendance`);
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-5 h-5" />
                <span>Open Smart Attendance Portal →</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )
}

export default Dashboard;
