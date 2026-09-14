import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getApiBaseUrl } from '../utils/dateUtils';
import { MODULES_DATA } from './PurposeSelector';
import {
  Shield,
  Lock,
  User,
  ArrowLeft,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  CheckCircle2,
  Camera,
  Car,
  Radar,
  Users
} from 'lucide-react';

const MODULE_THEMES = {
  'attendance': {
    name: 'Attendance System',
    title1: 'Student Attendance',
    title2: 'System',
    badgeText: 'STUDENT ATTENDANCE MODULE',
    subtitle: ['Track Attendance', 'Manage Students', 'Build a Better Tomorrow'],
    bgImage: '/attendance_bg.jpg',
    quote: (
      <div className="text-blue-600 font-serif italic text-xl sm:text-2xl font-normal leading-relaxed relative inline-block">
        <div>Better Attendance</div>
        <div className="ml-4">Brighter Future</div>
        <svg className="w-32 h-3 text-blue-400 mt-1 ml-2 opacity-80" viewBox="0 0 120 14" fill="none">
          <path d="M2 9 C35 2, 85 12, 118 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    bgGradient: 'bg-[#F5FAFF]',
    primaryColor: '#2563eb',
    accentClass: 'text-blue-600',
    btnClass: 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md shadow-blue-500/15',
    cardBorder: 'border-blue-100',
    cardSubtitle: 'Access your student attendance dashboard',
    badgeIcon: (
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-sm">
        <svg className="w-10 h-10 text-blue-600 fill-current" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3zM5 13.18v4l7 3.82l7-3.82v-4L12 17l-7-3.82z"/>
        </svg>
      </div>
    ),
    cardBadgeIcon: (
      <div className="relative w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm mx-auto">
        <svg className="w-8 h-8 text-blue-600 fill-current" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3zM5 13.18v4l7 3.82l7-3.82v-4L12 17l-7-3.82z"/>
        </svg>
      </div>
    ),
    heroGraphic: (
      <svg viewBox="0 0 500 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-95" preserveAspectRatio="xMidYMid meet">
        <rect x="20" y="260" width="460" height="15" fill="#C48B5E" rx="3"/>
        <rect x="0" y="275" width="500" height="35" fill="#A0693B" rx="2"/>
        <rect x="40" y="235" width="130" height="25" fill="#3B82F6" rx="4"/>
        <rect x="50" y="212" width="115" height="23" fill="#EAB308" rx="4"/>
        <rect x="45" y="190" width="120" height="22" fill="#10B981" rx="4"/>
        <rect x="55" y="170" width="105" height="20" fill="#F97316" rx="4"/>
        <path d="M30 220 C30 220 25 200 15 195 C25 205 35 205 35 220 Z" fill="#10B981"/>
        <path d="M35 210 C35 210 45 185 55 180 C45 195 40 200 38 220 Z" fill="#059669"/>
        <path d="M25 260 L35 225 L45 225 L55 260 Z" fill="#94A3B8"/>
        <rect x="410" y="210" width="35" height="50" fill="#2563EB" rx="6"/>
        <line x1="420" y1="180" x2="420" y2="210" stroke="#64748B" strokeWidth="4"/>
        <line x1="430" y1="170" x2="430" y2="210" stroke="#CBD5E1" strokeWidth="4"/>
        <path d="M120 245 L380 245 L395 260 L105 260 Z" fill="#64748B"/>
        <rect x="190" y="246" width="120" height="5" fill="#475569" rx="2"/>
        <rect x="135" y="80" width="230" height="165" fill="#1E293B" rx="10"/>
        <rect x="143" y="88" width="214" height="149" fill="#FFFFFF" rx="6"/>
        <rect x="143" y="88" width="214" height="18" fill="#F1F5F9" rx="6"/>
        <circle cx="153" cy="97" r="3" fill="#EF4444"/>
        <circle cx="163" cy="97" r="3" fill="#F59E0B"/>
        <circle cx="173" cy="97" r="3" fill="#10B981"/>
        <rect x="160" y="115" width="100" height="110" fill="#EFF6FF" rx="8" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 2"/>
        <circle cx="210" cy="150" r="18" fill="#3B82F6"/>
        <path d="M185 188 C185 168 235 168 235 188 Z" fill="#3B82F6"/>
        <circle cx="285" cy="145" r="18" fill="#10B981"/>
        <path d="M276 145 L282 151 L294 138" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="270" y="175" width="70" height="6" fill="#CBD5E1" rx="3"/>
        <rect x="270" y="188" width="50" height="6" fill="#E2E8F0" rx="3"/>
      </svg>
    )
  },
  'criminal-tracking': {
    name: 'Criminal Tracking System',
    title1: 'Criminal Tracking',
    title2: 'System',
    badgeText: 'CRIMINAL TRACKING MODULE',
    subtitle: ['Track Offenders', 'Ensure Safer Communities', 'Build a Safer Tomorrow'],
    bgImage: '/criminal_bg.jpg',
    quote: (
      <div className="text-blue-600 font-serif italic text-xl sm:text-2xl font-normal leading-relaxed relative inline-block">
        <div>Safer Cities</div>
        <div className="ml-4">Stronger Communities</div>
        <svg className="w-32 h-3 text-blue-400 mt-1 ml-2 opacity-80" viewBox="0 0 120 14" fill="none">
          <path d="M2 9 C35 2, 85 12, 118 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    bgGradient: 'bg-[#F5FAFF]',
    primaryColor: '#2563eb',
    accentClass: 'text-blue-600',
    btnClass: 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md shadow-blue-500/15',
    cardBorder: 'border-blue-100',
    cardSubtitle: 'Access your criminal tracking dashboard',
    badgeIcon: (
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-sm">
        <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 6L14 14V28C14 41 22 52 32 58 C42 52 50 41 50 28V14L32 6Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="32" cy="24" r="6.5" fill="white"/>
          <path d="M23 37C23 32 27 28.5 32 28.5C37 28.5 41 32 41 37" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="43" cy="41" r="6.5" stroke="#2563EB" strokeWidth="2.5" fill="white"/>
          <line x1="48" y1="46" x2="54" y2="52" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    cardBadgeIcon: (
      <div className="relative w-14 h-14 rounded-2xl bg-white border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-sm mx-auto">
        <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 6L14 14V28C14 41 22 52 32 58 C42 52 50 41 50 28V14L32 6Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="32" cy="24" r="6.5" fill="white"/>
          <path d="M23 37C23 32 27 28.5 32 28.5C37 28.5 41 32 41 37" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="43" cy="41" r="6.5" stroke="#2563EB" strokeWidth="2.5" fill="white"/>
          <line x1="48" y1="46" x2="54" y2="52" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    heroGraphic: (
      <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[300px] opacity-95" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="300" cy="380" rx="280" ry="18" fill="#cbd5e1" opacity="0.3"/>
        
        {/* Blue folders */}
        <g transform="translate(40, 200)">
          <rect x="0" y="0" width="70" height="90" rx="6" fill="#3b82f6" opacity="0.7"/>
          <rect x="5" y="5" width="60" height="80" rx="4" fill="#60a5fa" opacity="0.5"/>
          <rect x="10" y="15" width="50" height="6" rx="2" fill="white" opacity="0.8"/>
          <rect x="10" y="30" width="50" height="6" rx="2" fill="white" opacity="0.6"/>
        </g>

        {/* Laptop */}
        <g transform="translate(80, 100)">
          <path d="M-20 220 L320 220 L340 240 L-40 240 Z" fill="#64748b"/>
          <rect x="0" y="0" width="300" height="200" rx="12" fill="#1e293b"/>
          <rect x="8" y="8" width="284" height="184" rx="8" fill="#ffffff"/>
          <rect x="8" y="8" width="284" height="24" fill="#f1f5f9" rx="8"/>
          <circle cx="18" cy="20" r="3" fill="#ef4444"/>
          <circle cx="28" cy="20" r="3" fill="#f59e0b"/>
          <circle cx="38" cy="20" r="3" fill="#10b981"/>
          
          <rect x="40" y="32" width="160" height="160" fill="#f0f7ff"/>
          <path d="M40 60 L200 60 M40 100 L200 100 M40 140 L200 140" stroke="#e0f2fe" strokeWidth="2"/>
          <path d="M70 32 L70 192 M110 32 L110 192 M150 32 L150 192" stroke="#e0f2fe" strokeWidth="2"/>
          
          <g fill="#ef4444">
            <path d="M60 70 C60 66 63 63 67 63 C71 63 74 66 74 70 C74 75 67 82 67 82 C67 82 60 75 60 70 Z"/>
            <circle cx="67" cy="69" r="2.5" fill="white"/>
            <path d="M130 65 C130 61 133 58 137 58 C141 58 144 61 144 65 C144 70 137 77 137 77 C137 77 130 70 130 65 Z"/>
            <circle cx="137" cy="64" r="2.5" fill="white"/>
          </g>
          
          <rect x="200" y="32" width="92" height="160" fill="#ffffff"/>
          <rect x="208" y="42" width="76" height="70" rx="6" fill="#f1f5f9"/>
          <circle cx="246" cy="72" r="18" fill="#94a3b8"/>
          <path d="M226 105 C226 90 266 90 266 105 Z" fill="#94a3b8"/>
          <rect x="216" y="125" width="60" height="20" rx="10" fill="#ef4444"/>
          <text x="246" y="139" fill="white" fontSize="11" fontWeight="500" textAnchor="middle">Tracked</text>
        </g>

        {/* Police cap */}
        <g transform="translate(420, 180)">
          <path d="M0 80 C30 95 100 95 130 80 C115 68 20 68 0 80 Z" fill="#0f172a"/>
          <path d="M10 70 C-5 35 30 5 65 5 C100 5 135 35 120 70 Z" fill="#1e3a8a"/>
          <g transform="translate(65, 35)">
            <path d="M0 -14 L12 -6 V8 C12 15 6 22 0 25 C-6 22 -12 15 -12 8 V-6 L0 -14 Z" fill="#f59e0b"/>
          </g>
        </g>
      </svg>
    )
  },
  'anpr': {
    name: 'ANPR Vehicle System',
    title1: 'ANPR Vehicle',
    title2: 'System',
    badgeText: 'AUTOMATIC LICENSE PLATE MODULE',
    subtitle: ['Automatic License Recognition', 'Vehicle Tracking', 'Secure Highways'],
    bgImage: '/criminal_bg.jpg',
    quote: (
      <div className="text-cyan-600 font-serif italic text-xl sm:text-2xl font-normal leading-relaxed relative inline-block">
        <div>Smart Traffic</div>
        <div className="ml-4">Safer Roads</div>
        <svg className="w-32 h-3 text-cyan-400 mt-1 ml-2 opacity-80" viewBox="0 0 120 14" fill="none">
          <path d="M2 9 C35 2, 85 12, 118 4" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    bgGradient: 'bg-[#F5FAFF]',
    primaryColor: '#0284c7',
    accentClass: 'text-cyan-600',
    btnClass: 'bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-500/15',
    cardBorder: 'border-cyan-100',
    cardSubtitle: 'Access your vehicle tracking dashboard',
    badgeIcon: (
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-cyan-100/80 flex items-center justify-center text-cyan-600 shadow-sm">
        <Car className="w-9 h-9" />
      </div>
    ),
    cardBadgeIcon: (
      <div className="relative w-14 h-14 rounded-2xl bg-white border border-cyan-100/80 flex items-center justify-center text-cyan-600 shadow-sm mx-auto">
        <Car className="w-8 h-8" />
      </div>
    ),
    heroGraphic: (
      <svg viewBox="0 0 500 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[300px] opacity-95" preserveAspectRatio="xMidYMid meet">
        <rect x="20" y="250" width="460" height="20" fill="#cbd5e1" rx="4"/>
        <path d="M50 250 L120 160 L380 160 L450 250 Z" fill="#e2e8f0" />
        <rect x="140" y="100" width="220" height="130" fill="#0284c7" rx="16" />
        <rect x="155" y="115" width="190" height="100" fill="#ffffff" rx="10" />
        <text x="250" y="172" fill="#0f172a" fontSize="20" fontWeight="600" letterSpacing="3" textAnchor="middle">MH 12 AB 1234</text>
      </svg>
    )
  },
  'missing-child': {
    name: 'Missing Children Finder',
    title1: 'Missing Children',
    title2: 'Finder',
    badgeText: 'MISSING CHILDREN RECOVERY MODULE',
    subtitle: ['Facial Recognition', 'Rapid Alerting', 'Reuniting Families'],
    bgImage: '/attendance_bg.jpg',
    quote: (
      <div className="text-emerald-600 font-serif italic text-xl sm:text-2xl font-normal leading-relaxed relative inline-block">
        <div>Protecting Children</div>
        <div className="ml-4">Reuniting Families</div>
        <svg className="w-32 h-3 text-emerald-400 mt-1 ml-2 opacity-80" viewBox="0 0 120 14" fill="none">
          <path d="M2 9 C35 2, 85 12, 118 4" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    bgGradient: 'bg-[#F5FAFF]',
    primaryColor: '#059669',
    accentClass: 'text-emerald-600',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/15',
    cardBorder: 'border-emerald-100',
    cardSubtitle: 'Access missing children dashboard',
    badgeIcon: (
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm">
        <Users className="w-9 h-9" />
      </div>
    ),
    cardBadgeIcon: (
      <div className="relative w-14 h-14 rounded-2xl bg-white border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm mx-auto">
        <Users className="w-8 h-8" />
      </div>
    ),
    heroGraphic: (
      <svg viewBox="0 0 500 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[300px] opacity-95" preserveAspectRatio="xMidYMid meet">
        <circle cx="250" cy="140" r="100" fill="#d1fae5" opacity="0.5"/>
        <rect x="175" y="65" width="150" height="150" rx="16" fill="#ffffff" stroke="#059669" strokeWidth="2"/>
        <circle cx="250" cy="120" r="32" fill="#059669"/>
      </svg>
    )
  },
  'defence': {
    name: 'Defence Tactical System',
    title1: 'Defence Tactical',
    title2: 'System',
    badgeText: 'TACTICAL DEFENCE MODULE',
    subtitle: ['Tactical Inventory', 'Personnel Readiness', 'Strategic Surveillance'],
    bgImage: '/criminal_bg.jpg',
    quote: (
      <div className="text-slate-700 font-serif italic text-xl sm:text-2xl font-normal leading-relaxed relative inline-block">
        <div>Stronger Defence</div>
        <div className="ml-4">Secure Nation</div>
        <svg className="w-32 h-3 text-slate-400 mt-1 ml-2 opacity-80" viewBox="0 0 120 14" fill="none">
          <path d="M2 9 C35 2, 85 12, 118 4" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    bgGradient: 'bg-[#F5FAFF]',
    primaryColor: '#334155',
    accentClass: 'text-slate-800',
    btnClass: 'bg-slate-800 hover:bg-slate-900 shadow-md shadow-slate-900/15',
    cardBorder: 'border-slate-200',
    cardSubtitle: 'Access defence tactical dashboard',
    badgeIcon: (
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm">
        <Radar className="w-9 h-9" />
      </div>
    ),
    cardBadgeIcon: (
      <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mx-auto">
        <Radar className="w-8 h-8" />
      </div>
    ),
    heroGraphic: (
      <svg viewBox="0 0 500 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[300px] opacity-95" preserveAspectRatio="xMidYMid meet">
        <circle cx="250" cy="150" r="110" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5"/>
        <line x1="250" y1="40" x2="250" y2="260" stroke="#94a3b8" strokeWidth="1"/>
        <line x1="140" y1="150" x2="360" y2="150" stroke="#94a3b8" strokeWidth="1"/>
      </svg>
    )
  }
};

const extractErrorMessage = (data, defaultMsg) => {
  if (!data) return defaultMsg;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map(err => err.msg || (typeof err === 'string' ? err : JSON.stringify(err))).join(', ');
  }
  if (typeof data.detail === 'object' && data.detail !== null) {
    return data.detail.msg || JSON.stringify(data.detail);
  }
  if (typeof data.message === 'string') return data.message;
  return defaultMsg;
};

export const ModuleLogin = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const module = MODULES_DATA.find(m => m.id === moduleId) || MODULES_DATA[0];
  const theme = MODULE_THEMES[module.id] || MODULE_THEMES['attendance'];

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form state on tab or module change
  useEffect(() => {
    setErrorMessage('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [activeTab, moduleId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('Admin Username is required.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);
    localStorage.removeItem('sda_token');
    localStorage.removeItem('sda_user');
    localStorage.removeItem('sda_auth');

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          username: cleanUsername,
          password: cleanPassword
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn('Non-JSON response received from server:', jsonErr);
      }

      if (res.ok && data.status === 'success') {
        const userObj = {
          name: data.user?.username || cleanUsername,
          username: data.user?.username || cleanUsername,
          admin_id: data.user?.admin_id,
          role: 'admin',
          moduleId: module.id
        };

        localStorage.setItem('sda_auth', 'true');
        localStorage.setItem('sda_active_module', module.id);
        localStorage.setItem('sda_token', data.token);
        localStorage.setItem('sda_user', JSON.stringify(userObj));

        if (showToast) showToast('Admin Authenticated', `Welcome Admin ${cleanUsername}! Access granted.`, 'success');
        
        window.location.href = `/portal/${module.id}/dashboard`;
      } else {
        setErrorMessage(extractErrorMessage(data, 'Incorrect admin name or password.'));
      }
    } catch (err) {
      console.error('Backend Login API error:', err);
      setErrorMessage('Failed to connect to authentication server. Please verify network or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanUsername) {
      setErrorMessage('Admin Username is required.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Password is required.');
      return;
    }
    if (!cleanConfirm) {
      setErrorMessage('Confirm Password is required.');
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (cleanPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    localStorage.removeItem('sda_token');
    localStorage.removeItem('sda_user');
    localStorage.removeItem('sda_auth');

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          username: cleanUsername,
          password: cleanPassword,
          confirmPassword: cleanConfirm
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn('Non-JSON response received from server:', jsonErr);
      }

      if (res.ok && data.status === 'success') {
        const userObj = {
          name: data.user?.username || cleanUsername,
          username: data.user?.username || cleanUsername,
          admin_id: data.user?.admin_id,
          role: 'admin',
          moduleId: module.id
        };

        localStorage.setItem('sda_auth', 'true');
        localStorage.setItem('sda_active_module', module.id);
        localStorage.setItem('sda_token', data.token);
        localStorage.setItem('sda_user', JSON.stringify(userObj));

        if (showToast) showToast('Admin Account Created', `Account created for ${cleanUsername}.`, 'success');
        
        window.location.href = `/portal/${module.id}/dashboard`;
      } else {
        setErrorMessage(extractErrorMessage(data, 'Failed to create Admin Account.'));
      }
    } catch (err) {
      console.error('Backend Register API error:', err);
      setErrorMessage('Failed to connect to authentication server. Please verify network or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen max-w-full overflow-hidden flex font-sans selection:bg-blue-600 selection:text-white bg-[#F5FAFF] relative">
      
      {/* HIGH-QUALITY MODULE DYNAMIC BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <img
          src={theme.bgImage || '/criminal_bg.jpg'}
          alt="Surveillance Grid Background"
          className="w-full h-full object-cover opacity-[0.35] pointer-events-none transition-all duration-700"
        />
        {/* Soft elegant gradient overlay to ensure perfect contrast & clean atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F5FAFF]/90 via-[#F5FAFF]/80 to-[#F5FAFF]/95" />
      </div>

      {/* TOP-LEFT ALIGNED SELECT MODULE BUTTON (POSITIONED RIGHT AT TOP EDGE) */}
      <div className="absolute top-4 left-6 sm:top-6 sm:left-10 lg:left-12 z-30">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-slate-700 backdrop-blur-md border border-blue-100 transition-all text-xs font-semibold shadow-sm hover:shadow-md cursor-pointer hover:border-blue-300"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Select Module</span>
        </button>
      </div>

      {/* LEFT SIDE: HERO SECTION (~52% width) */}
      <div className="w-[50%] sm:w-[50%] lg:w-[52%] flex flex-col justify-between p-8 sm:p-12 lg:pl-16 lg:pr-8 relative z-10 h-full border-r border-blue-100/50">

        {/* Main Left Header Content (Clean Non-Bold Typography) */}
        <div className="relative z-10 my-auto pt-2 max-w-xl">
          
          {/* Badge Icon */}
          <div className="flex items-center gap-4 mb-4">
            {theme.badgeIcon}
          </div>

          {/* Clean Non-Bold Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-normal leading-[1.1] mb-3 text-slate-800">
            <span>{theme.title1}</span> <br />
            <span className={theme.accentClass}>{theme.title2}</span>
          </h1>

          {/* Subtitle with phrase dots */}
          <p className="text-slate-500 text-xs sm:text-sm font-normal tracking-normal flex flex-wrap items-center gap-2 mb-5">
            <span>{theme.subtitle[0]}</span>
            <span className="text-blue-400">•</span>
            <span>{theme.subtitle[1]}</span>
            <span className="text-blue-400">•</span>
            <span>{theme.subtitle[2]}</span>
          </p>

          {/* Handwritten Quote */}
          <div className="mt-1 relative inline-block">
            {theme.quote}
          </div>
        </div>

        {/* Hero Graphic */}
        <div className="relative z-10 mt-auto pt-2 flex justify-center w-full">
          <div className="relative w-full max-w-lg">
            {theme.heroGraphic}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LARGER & LEFT-SHIFTED ADMIN LOGIN CARD PANEL (~48-50% width) */}
      <div className="w-[50%] lg:w-[48%] flex flex-col justify-center items-start lg:pl-4 lg:pr-12 p-4 sm:p-8 z-10 relative h-full max-h-screen overflow-y-auto shrink-0">
        
        <div className="my-auto max-w-lg w-full py-2">
          
          {/* FLOATING WHITE CARD (Bigger width & height padding, refined non-bold text) */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100/90 p-8 sm:p-11 relative">
            
            {/* Top Logo inside card */}
            <div className="flex justify-center mb-4">
              {theme.cardBadgeIcon}
            </div>

            {/* Admin Login Heading (Clean font, non-bold) */}
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-800 text-center tracking-normal mb-1">
              {activeTab === 'login' ? (
                <span>Admin <span className="text-blue-600">Login</span></span>
              ) : (
                <span>Admin <span className="text-blue-600">Register</span></span>
              )}
            </h2>

            <p className="text-xs sm:text-sm font-normal text-slate-400 text-center mb-8">
              {activeTab === 'login'
                ? theme.cardSubtitle
                : 'Create your admin credentials'}
            </p>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-700 text-xs sm:text-sm font-normal flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Username Input */}
                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="username"
                      id="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="w-full h-[56px] pl-11 pr-4 rounded-2xl bg-slate-50/70 border border-blue-100 text-slate-700 placeholder-slate-400 font-normal text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full h-[56px] pl-11 pr-11 rounded-2xl bg-slate-50/70 border border-blue-100 text-slate-700 placeholder-slate-400 font-normal text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>


                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-[56px] rounded-2xl text-white font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${theme.btnClass} ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>→ Login</span>
                </button>

                {/* OR Separator */}
                <div className="relative flex items-center justify-center my-5">
                  <div className="border-t border-slate-200/80 w-full" />
                  <span className="bg-white px-3 text-[11px] font-normal text-slate-400 uppercase tracking-widest relative z-10">or</span>
                </div>

                {/* Account Toggle & Security Footer */}
                <div className="text-center space-y-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs font-normal text-blue-600 hover:underline cursor-pointer"
                  >
                    Create New Admin Account
                  </button>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-normal text-slate-400 pt-1">
                    <Shield className="w-3.5 h-3.5 text-blue-500/80 shrink-0" />
                    <span>Only authorized admins can access this system</span>
                  </div>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="w-full h-[52px] pl-11 pr-4 rounded-2xl bg-slate-50/70 border border-blue-100 text-slate-700 placeholder-slate-400 font-normal text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create Password"
                      required
                      className="w-full h-[52px] pl-11 pr-11 rounded-2xl bg-slate-50/70 border border-blue-100 text-slate-700 placeholder-slate-400 font-normal text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                      className="w-full h-[52px] pl-11 pr-11 rounded-2xl bg-slate-50/70 border border-blue-100 text-slate-700 placeholder-slate-400 font-normal text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-[54px] rounded-2xl text-white font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${theme.btnClass} ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating...' : 'Create Admin Account'}</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200/80 w-full" />
                  <span className="bg-white px-3 text-[11px] font-normal text-slate-400 uppercase tracking-widest relative z-10">or</span>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs font-normal text-blue-600 hover:underline cursor-pointer"
                  >
                    Return to Existing Admin Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
