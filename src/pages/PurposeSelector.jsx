import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ShieldAlert,
  Car,
  Heart,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Camera,
  Layers,
  Activity,
  CheckCircle2,
  Zap,
  ChevronRight
} from 'lucide-react';

export const MODULES_DATA = [
  {
    id: 'attendance',
    title: 'Smart Attendance System',
    subtitle: 'Contactless Biometric Face Recognition & Roster Analytics',
    description: 'Automated multi-face check-in/out engine for educational institutions and corporate enterprises, eliminating manual roll-calls and proxy attendance with live telemetry roster monitoring.',
    icon: UserCheck,
    badge: 'PURPOSE 01',
    gradient: 'from-emerald-500 via-teal-600 to-green-600',
    cardBorder: 'hover:border-emerald-500 hover:shadow-emerald-500/25',
    badgeBg: 'bg-emerald-100/90 text-emerald-900 border-2 border-emerald-300 font-black',
    btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30',
    tags: ['⚡ 12ms Multi-Face Scan', '📊 Live Roster Analytics', '🔒 Contactless Biometrics']
  },
  {
    id: 'criminal-tracking',
    title: 'Criminal Tracking System',
    subtitle: 'AI Facial Identification & Fugitive Watchlist Mesh',
    description: 'Real-time suspect vector matching across CCTV feeds, offender database search, 128D feature vector extraction, distance scoring, and instant police patrol alert dispatch.',
    icon: ShieldAlert,
    badge: 'PURPOSE 02',
    gradient: 'from-indigo-600 via-blue-600 to-purple-600',
    cardBorder: 'hover:border-indigo-500 hover:shadow-indigo-500/25',
    badgeBg: 'bg-indigo-100/90 text-indigo-900 border-2 border-indigo-300 font-black',
    btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30',
    tags: ['🎯 99.8% Vector Precision', '🚨 Instant Patrol Dispatch', '📂 FIR Dossier Sync']
  },
  {
    id: 'anpr',
    title: 'ANPR Vehicle System',
    subtitle: 'Automatic Number Plate Recognition & Speed Radar Engine',
    description: 'High-speed OCR license plate detection for stolen vehicle tracking, red-light jumps, highway speed limit enforcement, and automated digital e-challan notice generation.',
    icon: Car,
    badge: 'PURPOSE 03',
    gradient: 'from-blue-600 via-cyan-600 to-sky-600',
    cardBorder: 'hover:border-blue-500 hover:shadow-blue-500/25',
    badgeBg: 'bg-blue-100/90 text-blue-900 border-2 border-blue-300 font-black',
    btnBg: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/30',
    tags: ['🏎️ 180 km/h OCR Reader', '🚨 Stolen Plate Hotlist', '🚦 Speed Radar Logs']
  },
  {
    id: 'missing-child',
    title: 'Missing Children Finder',
    subtitle: 'Rapid Child Search & Live Camera Alert Mesh',
    description: 'High-priority child search case management, live webcam/CCTV match detection, instant green bounding box location overlays, sound chimes, and patrol team dispatch.',
    icon: Heart,
    badge: 'PURPOSE 04',
    gradient: 'from-purple-600 via-pink-600 to-rose-600',
    cardBorder: 'hover:border-purple-500 hover:shadow-purple-500/25',
    badgeBg: 'bg-purple-100/90 text-purple-900 border-2 border-purple-300 font-black',
    btnBg: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30',
    tags: ['🟢 Glowing Match Overlay', '📍 Real-Time Location Map', '🔊 Voice Speech Alert']
  },
  {
    id: 'defence',
    title: 'Defence Tactical System',
    subtitle: 'Perimeter Geofencing, Thermal Mesh & Garrison Security',
    description: 'Military installation perimeter threat detection, autonomous drone incursion monitoring, armory inventory transfer logs, thermal sensor mesh, and encrypted C4ISR telemetry.',
    icon: Shield,
    badge: 'PURPOSE 05',
    gradient: 'from-red-600 via-amber-600 to-orange-600',
    cardBorder: 'hover:border-red-500 hover:shadow-red-500/25',
    badgeBg: 'bg-red-100/90 text-red-900 border-2 border-red-300 font-black',
    btnBg: 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/30',
    tags: ['🛡️ 360° Thermal Geofence', '🚁 Drone Incursion Alert', '🔒 Military C4ISR Encryption']
  }
];

export const PurposeSelector = () => {
  const navigate = useNavigate();

  const handleSelectModule = (moduleId) => {
    navigate(`/portal/${moduleId}/login`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased relative overflow-x-hidden">
      
      {/* Lightweight Decorative Accent Blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Bar — FIXED AT TOP (GPU ACCELERATED & ZERO LAG) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 bg-white/98 px-6 sm:px-12 py-4 shadow-sm transform-gpu">
        <div className="w-full flex items-center justify-between">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50">
              <Shield className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-slate-950 leading-none">
                  CHAKRAVYUH
                </h1>
                <span className="px-3 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                  v2.0 AI Enterprise
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-extrabold tracking-wide mt-1.5">
                Multi-Purpose AI Security & Intelligence Command Platform
              </p>
            </div>
          </div>

          {/* Right Status Badges — Stretched Right */}
          <div className="hidden md:flex items-center gap-4 text-xs font-black">
            <div className="flex items-center gap-2.5 bg-emerald-50 border-2 border-emerald-200 px-4 py-2.5 rounded-2xl text-emerald-900 shadow-xs hover:bg-emerald-100/80 transition-colors">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <Cpu className="w-4.5 h-4.5 text-emerald-600 stroke-[2.5]" />
              <span>FastAPI AI Engine Active</span>
            </div>

            <div className="flex items-center gap-2.5 bg-blue-50 border-2 border-blue-200 px-4 py-2.5 rounded-2xl text-blue-900 shadow-xs hover:bg-blue-100/80 transition-colors">
              <Camera className="w-4.5 h-4.5 text-blue-600 stroke-[2.5]" />
              <span>Webcam Multi-Detector Ready</span>
            </div>

            <div className="flex items-center gap-2.5 bg-indigo-50 border-2 border-indigo-200 px-4 py-2.5 rounded-2xl text-indigo-900 shadow-xs hover:bg-indigo-100/80 transition-colors">
              <Lock className="w-4.5 h-4.5 text-indigo-600 stroke-[2.5]" />
              <span>Government Standard Encryption</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Full-Page Canvas */}
      <main className="w-full px-6 sm:px-12 pt-28 pb-12 flex-grow relative z-10">
        
        {/* Hero Header Section */}
        <div className="text-center max-w-5xl mx-auto mb-14 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-100 via-blue-100 to-purple-100 border-2 border-indigo-300/90 text-xs sm:text-sm font-black text-indigo-950 shadow-md">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="tracking-wide uppercase">Select Operational Security Domain & Purpose</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.12]">
            Which Security & Surveillance <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">Purpose</span> Are You Accessing Today?
          </h2>

          <p className="text-slate-600 text-lg sm:text-xl md:text-2xl font-bold leading-relaxed max-w-4xl mx-auto">
            Select an operational intelligence workspace below. Every domain features dedicated biometric matching, live CCTV node sweeps, automated alerts, and full report generation.
          </p>
        </div>

        {/* 5 Purpose Cards Grid — 60 FPS Performance Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9 mb-12">
          {MODULES_DATA.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => handleSelectModule(module.id)}
                className={`group relative bg-white border-2 border-slate-200/90 ${module.cardBorder} rounded-[2.5rem] p-9 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between transform-gpu hover:-translate-y-2 overflow-hidden min-h-[420px]`}
              >
                {/* Background Accent Gradient Corner Glow */}
                <div className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl ${module.gradient} opacity-5 group-hover:opacity-15 transition-opacity rounded-bl-full pointer-events-none`} />

                {/* Card Top: Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-7">
                    <span className={`text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${module.badgeBg} shadow-xs`}>
                      {module.badge}
                    </span>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${module.gradient} flex items-center justify-center shadow-xl text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <IconComponent className="w-8 h-8 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors tracking-tight mb-2">
                    {module.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-600 mb-4">{module.subtitle}</p>

                  <p className="text-slate-600 text-sm sm:text-base font-bold leading-relaxed mb-7">
                    {module.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-2.5 mb-8">
                    {module.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-black bg-slate-100/90 text-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-300/80 shadow-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Bottom: Action Button */}
                <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-slate-400 group-hover:text-slate-950 transition-colors uppercase tracking-widest">
                    Access Portal
                  </span>
                  <button
                    className={`px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition-all cursor-pointer ${module.btnBg}`}
                  >
                    <span>Launch Purpose Workspace</span>
                    <ArrowRight className="w-4.5 h-4.5 stroke-[3] transform group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer Bar — Cleanly pinned to bottom */}
      <footer className="mt-auto w-full text-center text-xs sm:text-sm font-black text-slate-500 border-t-2 border-slate-200 py-6 px-8 bg-white/95 backdrop-blur-md relative z-10">
        <p>© 2026 Project Chakravyuh — Smart Security & Surveillance Command System. All 5 Feature Portals Active.</p>
      </footer>
    </div>
  );
};

export default PurposeSelector;
