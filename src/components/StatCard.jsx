import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CameraBgSvg,
  AlertBgSvg,
  AttendanceBgSvg,
  VehicleBgSvg,
  ChildSearchBgSvg,
  ShieldBgSvg,
  MapBgSvg,
  CpuBgSvg,
  WatchlistBgSvg,
  ReportBgSvg
} from './common/CardBackgroundIcons';

export const StatCard = ({ title, value, subtext, icon: Icon, onClick, indicatorDot = null }) => {
  const isHighPriority = subtext === 'High Priority';
  const { showToast, activeModule } = useApp();

  const getHoverClasses = () => {
    switch (activeModule) {
      case 'missing-child':
        return 'hover:border-purple-500 group-hover:bg-purple-600';
      case 'criminal-tracking':
        return 'hover:border-rose-500 group-hover:bg-rose-600';
      case 'anpr':
        return 'hover:border-amber-500 group-hover:bg-amber-600';
      case 'defence':
        return 'hover:border-blue-500 group-hover:bg-blue-600';
      default:
        return 'hover:border-emerald-500 group-hover:bg-emerald-600';
    }
  };

  const hoverClasses = getHoverClasses();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (showToast) {
      showToast(title, `${title}: ${value} (${subtext}) - Live Telemetry Active`, 'info');
    }
  };

  // Helper to pick matching SVG illustration
  const renderBgIllustration = () => {
    const t = (title || '').toLowerCase();
    if (t.includes('camera') || t.includes('node') || t.includes('cctv')) return <CameraBgSvg className="w-12 h-12 text-blue-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('alert') || t.includes('threat') || strokeRed(t)) return <AlertBgSvg className="w-12 h-12 text-red-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('attend') || t.includes('present') || t.includes('employee')) return <AttendanceBgSvg className="w-12 h-12 text-emerald-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('vehicle') || t.includes('anpr') || t.includes('speed') || t.includes('toll')) return <VehicleBgSvg className="w-12 h-12 text-amber-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('child') || t.includes('missing') || t.includes('rescue')) return <ChildSearchBgSvg className="w-12 h-12 text-purple-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('defence') || t.includes('radar') || t.includes('shield') || t.includes('target')) return <ShieldBgSvg className="w-12 h-12 text-blue-600 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('map') || t.includes('location') || t.includes('zone')) return <MapBgSvg className="w-12 h-12 text-emerald-600 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('latency') || t.includes('engine') || t.includes('ai') || t.includes('cpu')) return <CpuBgSvg className="w-12 h-12 text-indigo-500 opacity-80 group-hover:scale-110 transition-transform" />;
    if (t.includes('watchlist') || t.includes('suspect') || t.includes('fir')) return <WatchlistBgSvg className="w-12 h-12 text-amber-600 opacity-80 group-hover:scale-110 transition-transform" />;
    return <ReportBgSvg className="w-12 h-12 text-slate-500 opacity-80 group-hover:scale-110 transition-transform" />;
  };

  const strokeRed = (txt) => txt.includes('warning') || txt.includes('critical');

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={`relative overflow-hidden bg-white dark:bg-[#11141c] border-2 border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between transition-all duration-200 shadow-xs cursor-pointer select-none hover:scale-[1.03] active:scale-[0.96] hover:shadow-lg ${hoverClasses.split(' ')[0]} group`}
    >
      <div className="flex flex-col justify-between relative z-10">
        <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200 tracking-tight flex items-center mb-1.5 uppercase">
          {title}
          {indicatorDot === 'green' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2 inline-block animate-pulse" />
          )}
          {indicatorDot === 'red' && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ml-2 inline-block animate-pulse" />
          )}
        </span>
        <div className="flex flex-col">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-none mb-1">
            {value}
          </span>
          <span className={`text-xs font-semibold leading-none ${
            (subtext === 'Critical Priority' || subtext === 'Critical')
              ? 'text-red-500 font-extrabold'
              : (subtext === 'High Priority' || subtext === 'High')
              ? 'text-amber-500 font-extrabold'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {subtext}
          </span>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 flex-shrink-0 relative z-10 ${hoverClasses.split(' ')[1]} group-hover:text-white transition-all shadow-xs`}>
        {Icon && <Icon className="w-6 h-6 stroke-[2]" />}
      </div>
      {renderBgIllustration()}
    </div>
  );
};
