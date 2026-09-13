import React, { useState } from 'react';
import { Menu, Shield, Search, Bell, User as UserIcon, ChevronDown, CheckCircle2, AlertTriangle, Car, ScanFace, Sun, Moon, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';

export const Topbar = () => {
  const { user, alerts = [], theme, toggleTheme, toggleSidebar, activeModule, logout } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { moduleId } = useParams();

  const handleExitPortal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    logout();
    window.location.href = '/';
  };

  // Determine current active module strictly (same pattern as Dashboard.jsx)
  const currentModule = moduleId || activeModule || 'criminal-tracking';

  // Filter active alerts strictly by currentModule (100% Data & Notification Isolation)
  const moduleActiveAlerts = (alerts || [])
    .filter(a => {
      if (a.status !== 'Active') return false;

      const text = ((a.title || '') + ' ' + (a.type || '') + ' ' + (a.description || '')).toLowerCase();
      if (a.module === 'missing-child' || text.includes('missing') || text.includes('child') || text.includes('case mc-')) {
        return currentModule === 'missing-child';
      }

      if (a.module) return a.module === currentModule;

      if (text.includes('breach') || text.includes('armory') || text.includes('vault') || text.includes('perimeter') || a.icon === 'Shield') {
        return currentModule === 'defence';
      }
      if (text.includes('anpr') || text.includes('speed') || text.includes('vehicle') || text.includes('challan') || a.icon === 'Car') {
        return currentModule === 'anpr';
      }
      if (text.includes('attendance') || a.icon === 'UserCheck') {
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

  const getModuleColor = (modKey) => {
    switch (modKey) {
      case 'attendance':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'criminal-tracking':
        return 'text-rose-600 dark:text-rose-400';
      case 'anpr':
        return 'text-amber-600 dark:text-amber-400';
      case 'missing-child':
        return 'text-purple-600 dark:text-purple-400';
      case 'defence':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-indigo-600 dark:text-indigo-400';
    }
  };

  const moduleColorClass = getModuleColor(currentModule);

  return (
    <header className="h-16 flex-shrink-0 bg-white dark:bg-[#111318] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between z-30 select-none transition-colors">
      {/* Brand Identity - Left */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-1 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          <Shield className={`w-7 h-7 ${moduleColorClass} stroke-[2]`} />
          <div className="flex flex-col">
            <h1 className="text-gray-900 dark:text-white text-lg font-extrabold tracking-tight leading-none">
              Chakravyuh
            </h1>
            <span className={`${moduleColorClass} text-xs font-semibold tracking-wide mt-1 leading-none uppercase`}>
              {currentModule ? `${currentModule.replace('-', ' ')} PORTAL` : 'Security Command Platform'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Notifications, Theme Toggle & Super Admin Profile */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center relative group"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 stroke-[2] transition-transform duration-300 rotate-0 group-hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 stroke-[2] transition-transform duration-300 rotate-0 group-hover:-rotate-12" />
          )}
          <span className="sr-only">Toggle Theme</span>
        </button>

        {/* Notification Bell Dropdown (Scoped by currentModule) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`System Alerts for ${currentModule}`}
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {moduleActiveAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                {moduleActiveAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Flyout (Module Isolated) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {currentModule.replace('-', ' ')} Alerts ({moduleActiveAlerts.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(`/portal/${currentModule}/alerts`);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  View All
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {moduleActiveAlerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No active alerts for {currentModule.replace('-', ' ')}
                  </div>
                ) : (
                  moduleActiveAlerts.slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/portal/${currentModule}/alerts`);
                      }}
                      className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{alert.title}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{alert.timeAgo}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{alert.description}</p>
                      <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">{alert.location}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 cursor-pointer group pl-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-gray-800 border border-indigo-200 dark:border-gray-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {user?.name || user?.username || 'Admin'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">
                {user?.role || 'Super Admin'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-1 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(`/portal/${currentModule}/settings`);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-2 transition-colors"
              >
                <span>Settings & Profile</span>
              </button>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button
                onClick={handleExitPortal}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[2]" />
                <span>Exit Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
