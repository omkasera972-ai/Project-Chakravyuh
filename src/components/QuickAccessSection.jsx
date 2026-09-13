import React from 'react';
import { BellPlus, UserSearch, Car, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const QuickAccessSection = () => {
  const { setActiveModal } = useApp();
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'add-alert',
      label: 'Add Alert',
      icon: BellPlus,
      color: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      action: () => setActiveModal('addAlert')
    },
    {
      id: 'search-person',
      label: 'Search Person',
      icon: UserSearch,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      action: () => setActiveModal('searchPerson')
    },
    {
      id: 'search-vehicle',
      label: 'Search Vehicle',
      icon: Car,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      action: () => setActiveModal('searchVehicle')
    },
    {
      id: 'view-map',
      label: 'View Map',
      icon: MapPin,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      action: () => navigate('/maps')
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      action: () => setActiveModal('generateReport')
    }
  ];

  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">
          Quick Access
        </h2>
        <span className="text-xs text-gray-400 font-medium">Command Shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1 flex-1 items-center">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-gray-50/60 dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-xs transition-all cursor-pointer text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color} group-hover:scale-110 transition-transform mb-2 shadow-2xs`}>
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
