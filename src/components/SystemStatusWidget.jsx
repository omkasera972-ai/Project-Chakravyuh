import React from 'react';
import { ShieldCheck, Cpu, Activity, Zap } from 'lucide-react';
import { CpuBgSvg } from './common/CardBackgroundIcons';

export const SystemStatusWidget = () => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-4 shadow-xs transition-colors flex flex-col justify-between flex-1 group">
      <div className="relative z-10 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[2]" />
            <h2 className="text-gray-900 dark:text-white text-xs font-bold tracking-tight">
              AI Diagnostics & Radar
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Secure</span>
          </div>
        </div>

        {/* Main Status Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="bg-gray-50 dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
            <Cpu className="w-4 h-4 text-indigo-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Latency</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">14 ms</span>
          </div>

          <div className="bg-gray-50 dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
            <Zap className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Frame Rate</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">60 FPS</span>
          </div>

          <div className="bg-gray-50 dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
            <Activity className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Precision</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">99.4%</span>
          </div>
        </div>

        {/* Model Status Bar */}
        <div className="mt-1 bg-gray-50 dark:bg-[#161922] border border-gray-200/80 dark:border-gray-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">ResNet-34 Face Model</span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ACTIVE</span>
        </div>
      </div>

      <CpuBgSvg className="w-24 h-24 text-emerald-500" />
    </div>
  );
};
