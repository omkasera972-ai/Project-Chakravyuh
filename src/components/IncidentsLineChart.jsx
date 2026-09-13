import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { incidentsOverTimeData } from '../data/mockData';

export const IncidentsLineChart = () => {
  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">
            Incidents Over Time
          </h2>
          <p className="text-xs text-gray-400 font-medium">Weekly trend telemetry analysis</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
          Weekly Activity
        </span>
      </div>

      <div className="flex-1 w-full pt-3 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={incidentsOverTimeData}
            margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-800" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl shadow-lg text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-extrabold">{payload[0].value} Incidents</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="incidents"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#incidentGradient)"
              dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
