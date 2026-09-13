import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  UserCheck,
  ScanFace,
  Car,
  User,
  ShieldCheck,
  Video,
  Bell,
  Map,
  FileText,
  GraduationCap,
  UserPlus,
  Settings,
  LogOut,
  LayoutGrid,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar = () => {
  const { logout, alerts, isSidebarCollapsed, activeModule } = useApp();
  const navigate = useNavigate();

  const currentModuleKey = activeModule || 'attendance';
  const activeAlertsCount = (alerts || []).filter(a => {
    if (a.status === 'Resolved') return false;
    const title = (a.title || '').toLowerCase();
    const type = (a.type || '').toLowerCase();
    const desc = (a.description || '').toLowerCase();
    const text = `${title} ${type} ${desc}`;

    if (text.includes('watchlist') || text.includes('criminal') || text.includes('suspect') || text.includes('fugitive') || text.includes('ipc')) {
      return currentModuleKey === 'criminal-tracking';
    }
    if (text.includes('case mc-') || text.includes('missing') || text.includes('child')) {
      return currentModuleKey === 'missing-child';
    }
    if (text.includes('breach') || text.includes('armory') || text.includes('vault') || text.includes('perimeter') || text.includes('defence') || text.includes('defense') || a.icon === 'Shield') {
      return currentModuleKey === 'defence';
    }
    if (text.includes('anpr') || text.includes('speed') || text.includes('vehicle') || text.includes('challan') || a.icon === 'Car') {
      return currentModuleKey === 'anpr';
    }
    if (text.includes('attendance') || a.icon === 'UserCheck') {
      return currentModuleKey === 'attendance';
    }
    if (a.module) {
      return a.module === currentModuleKey;
    }
    return currentModuleKey === 'criminal-tracking';
  }).length;
  const basePath = `/portal/${currentModuleKey}`;

  // Module-Specific primary navigation items
  const getModuleSpecificNavItems = (modKey) => {
    switch (modKey) {
      case 'attendance':
        return [
          { name: 'Attendance System', path: `${basePath}/attendance`, icon: UserCheck },
          { name: 'Student Information', path: `${basePath}/students`, icon: GraduationCap },
          { name: 'Register New Data', path: `${basePath}/enrollment`, icon: UserPlus },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
      case 'criminal-tracking':
        return [
          { name: 'Criminal Tracking', path: `${basePath}/criminal-tracking`, icon: ScanFace },
          { name: 'Add Criminal', path: `${basePath}/add-criminal`, icon: UserPlus },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
      case 'anpr':
        return [
          { name: 'ANPR System', path: `${basePath}/anpr`, icon: Car },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
      case 'missing-child':
        return [
          { name: 'Missing Children', path: `${basePath}/missing-child`, icon: User },
          { name: 'Add Missing Person', path: `${basePath}/add-missing-child`, icon: UserPlus },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
      case 'defence':
        return [
          { name: 'Defence Tracker', path: `${basePath}/defence`, icon: ShieldCheck },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
      default:
        return [
          { name: 'Attendance System', path: `${basePath}/attendance`, icon: UserCheck },
          { name: 'Registered Data', path: `${basePath}/registered-data`, icon: Database }
        ];
    }
  };

  // Dedicated Nav Items: NO OTHER 4 MODULES SHOWN!
  const navItems = [
    { name: 'Dashboard', path: `${basePath}/dashboard`, icon: Home },
    ...getModuleSpecificNavItems(currentModuleKey),
    { name: 'Camera Network', path: `${basePath}/cameras`, icon: Video },
    { name: 'Alerts & Triage', path: `${basePath}/alerts`, icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { name: 'Live Maps', path: `${basePath}/maps`, icon: Map },
    { name: 'Reports & Logs', path: `${basePath}/reports`, icon: FileText },
    { name: 'Settings', path: `${basePath}/settings`, icon: Settings },
  ];

  const handleLogout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    logout();
    window.location.href = '/';
  };

  const getActiveItemClasses = (modKey) => {
    switch (modKey) {
      case 'attendance':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs border border-emerald-200 dark:border-emerald-800/60';
      case 'criminal-tracking':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold shadow-xs border border-rose-200 dark:border-rose-800/60';
      case 'anpr':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold shadow-xs border border-amber-200 dark:border-amber-800/60';
      case 'missing-child':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold shadow-xs border border-purple-200 dark:border-purple-800/60';
      case 'defence':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs border border-blue-200 dark:border-blue-800/60';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-200 dark:border-indigo-800/60';
    }
  };

  return (
    <aside
      className={`bg-white dark:bg-[#111318] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between h-full select-none p-3 flex-shrink-0 transition-all duration-300 overflow-hidden ${
        isSidebarCollapsed ? 'w-20 items-center px-2' : 'w-72'
      }`}
    >
      {/* Navigation Menu */}
      <nav className="space-y-1.5 w-full overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3'} rounded-xl text-base transition-all duration-150 cursor-pointer active:scale-[0.97] hover:scale-[1.01] ${
                  isActive
                    ? getActiveItemClasses(currentModuleKey)
                    : 'text-gray-700 dark:text-gray-300 font-medium hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <div className="flex items-center space-x-3.5">
                <Icon className="w-5 h-5 flex-shrink-0 stroke-[2]" />
                {!isSidebarCollapsed && <span className="tracking-tight">{item.name}</span>}
              </div>
              {!isSidebarCollapsed && item.badge && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Action pinned at bottom */}
      <div className="pt-3 w-full border-t border-gray-200 dark:border-gray-800 mt-2">
        <button
          onClick={handleLogout}
          title={isSidebarCollapsed ? "Exit Portal" : undefined}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'space-x-3.5 px-4 py-3'} rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-[#171a22] border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 active:scale-[0.97] hover:scale-[1.01] cursor-pointer shadow-xs`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 stroke-[2]" />
          {!isSidebarCollapsed && <span>Exit Portal</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
