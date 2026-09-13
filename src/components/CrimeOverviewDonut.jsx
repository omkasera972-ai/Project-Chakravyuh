import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { crimeOverviewData } from '../data/mockData';

export const CrimeOverviewDonut = () => {
  const total = crimeOverviewData.reduce((acc, curr) => acc + curr.count, 0);

  // Vibrant modern color palette for crime overview chart
  const VIBRANT_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">
          Crime Overview <span className="text-gray-400 font-normal text-xs">(This Week)</span>
        </h2>
      </div>

      <div className="flex items-center justify-between gap-2 py-1">
        {/* Donut Chart with Center Total */}
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={crimeOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={65}
                paddingAngle={3}
                dataKey="count"
                stroke="none"
              >
                {crimeOverviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg shadow-md text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
                        <p className="text-gray-600 dark:text-gray-300 font-semibold">{data.count} incidents ({data.percentage}%)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">Total</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{total}</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="space-y-2 pl-2 flex-1">
          {crimeOverviewData.map((item, index) => (
            <div key={item.name} className="flex flex-col text-xs leading-snug">
              <div className="flex items-center space-x-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color || VIBRANT_COLORS[index % VIBRANT_COLORS.length] }}
                />
                <span className="font-bold text-gray-900 dark:text-white tracking-tight text-xs">{item.name}</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 pl-4.5 font-semibold">
                {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
