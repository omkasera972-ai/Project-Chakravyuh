import React from 'react';
import { AlertTriangle, Car, User, Shield, ScanFace } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const RecentAlertsSection = () => {
  const { alerts } = useApp();
  const navigate = useNavigate();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Suspicious Activity':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 flex items-center justify-center text-red-500 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2] fill-red-500/20" />
          </div>
        );
      case 'ANPR Hit':
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200 flex-shrink-0">
            <Car className="w-5 h-5 stroke-[1.75]" />
          </div>
        );
      case 'Missing Child Reported':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
            <User className="w-5 h-5 stroke-[1.75]" />
          </div>
        );
      case 'Perimeter Breach':
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-white flex-shrink-0">
            <Shield className="w-5 h-5 stroke-[1.75]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200 flex-shrink-0">
            <ScanFace className="w-5 h-5 stroke-[1.75]" />
          </div>
        );
    }
  };

  const displayAlerts = [...(alerts || [])].sort((a, b) => {
    const getTs = (alt) => {
      const t = alt.timestamp || alt.createdAt || alt.created_at || alt.time;
      if (!t) return 0;
      const ms = new Date(t).getTime();
      return isNaN(ms) ? 0 : ms;
    };
    return getTs(b) - getTs(a);
  }).slice(0, 4);

  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-4 flex flex-col justify-between h-full shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">
          Recent Alerts
        </h2>
        <button
          onClick={() => navigate('/alerts')}
          className="px-3 py-1 rounded-lg bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-all shadow-2xs"
        >
          View All
        </button>
      </div>

      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        {displayAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 italic">
            No active alerts detected. Run camera scan to trigger real-time alerts.
          </div>
        ) : (
          displayAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => navigate('/alerts')}
              className="group p-2.5 rounded-xl bg-white dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {getAlertIcon(alert.type)}

                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {alert.title}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {alert.location}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap pl-2">
                {alert.timeAgo}
              </span>
            </div>
          ))
        )}
      </div>
    </div>

  );
};
