import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Package, Crosshair, Box, CheckCircle2, AlertTriangle, Play, Shield, RefreshCw, Search, Radar, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { useNavigate } from 'react-router-dom';

export const DefenceTracker = () => {
  const { depotInventory, movementLogs, updateDepotMovement, triggerMovementBreach, showToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Armory Simulation State
  const [simMode, setSimMode] = useState(null); // 'authorized', 'unauthorized', null
  const [simStep, setSimStep] = useState(0);

  const navigate = useNavigate();

  const totalWeapons = depotInventory.filter(i => i.category === 'Weapon').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmmo = depotInventory.filter(i => i.category === 'Ammunition').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCrates = depotInventory.filter(i => i.category === 'Storage').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalItems = depotInventory.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSimulateAuthorized = () => {
    setSimMode('authorized');
    setSimStep(1);
    setTimeout(() => {
      setSimStep(2);
      setTimeout(() => {
        setSimStep(3);
        updateDepotMovement('DEP-01', 'Authorized Armory Transfer (2x Rifles)', -2);
        showToast('Movement Audited', 'Authorized armory transfer logged to FastAPI database', 'success');
      }, 1000);
    }, 1000);
  };

  const handleSimulateUnauthorized = () => {
    setSimMode('unauthorized');
    setSimStep(1);
    setTimeout(() => {
      setSimStep(2);
      setTimeout(() => {
        setSimStep(3);
        triggerMovementBreach('Defense Zone 3 - Armory Vault Gate 2', 'Perimeter sensor tripped outside scheduled access window. Armed guard units dispatched.');
        showToast('PERIMETER BREACH!', 'Unauthorized intruder detected in Armory Vault Gate 2', 'error');
      }, 1000);
    }, 1000);
  };

  const filteredInventory = depotInventory.filter(i => {
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch = i.item?.toLowerCase().includes(q) ||
                          i.category?.toLowerCase().includes(q) ||
                          i.location?.toLowerCase().includes(q) ||
                          i.status?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 select-none pb-6 text-slate-100">
      {/* Military Radar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-950 border border-teal-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Defence Command & Asset Tracker</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Top Secret Clearance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Garrison Tactical Radar, Armory Munitions Audit & Geofence Security</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Perimeter Radar Active</span>
          </span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Total Armory Inventory" value={String(totalItems)} subtext="Audited Items" icon={Package} />
        <StatCard title="Assault Rifles" value={String(totalWeapons)} subtext="Armory Vault 1" icon={Crosshair} />
        <StatCard title="Ammunition Crates" value={String(totalAmmo)} subtext="Sealed Storage" icon={Box} />
        <StatCard title="Storage Crates" value={String(totalCrates)} subtext="Level IV Armor" icon={Shield} />
        <StatCard title="Breach Alerts" value="0" subtext="Past 24 Hours" icon={ShieldAlert} indicatorDot="green" />
      </div>

      {/* Main Grid: Armory Radar Radar Sweep (Left) & Inventory Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Tactical Armory Radar Feed */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Radar className="w-4 h-4 text-teal-400 animate-spin" />
              <span>Armory Thermal Surveillance</span>
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
              simMode === 'unauthorized' && simStep === 3
                ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                : 'bg-teal-500/10 border border-teal-500/30 text-teal-400'
            }`}>
              {simMode === 'unauthorized' && simStep === 3 ? 'BREACH ACTIVE' : 'VAULT GATE 2'}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex flex-col items-center justify-center p-4">
            {!simMode ? (
              <div className="text-center space-y-2">
                <Radar className="w-12 h-12 text-teal-400/60 mx-auto animate-spin" />
                <h3 className="text-xs font-bold text-slate-200">Thermal Perimeter Radar Active</h3>
                <p className="text-[10px] text-slate-500">Monitoring Armory Gate 2 sensor grid for thermal motion signatures</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border ${simMode === 'unauthorized' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-teal-500/20 border-teal-500 text-teal-400'}`}>
                  {simMode === 'unauthorized' ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>

                <div>
                  <h3 className={`text-sm font-bold ${simMode === 'unauthorized' ? 'text-red-400' : 'text-teal-400'}`}>
                    {simMode === 'unauthorized' && simStep === 1 && 'Intruder Target Detected'}
                    {simMode === 'unauthorized' && simStep === 2 && 'Thermal Sensor Tripped'}
                    {simMode === 'unauthorized' && simStep === 3 && 'CRITICAL PERIMETER BREACH!'}

                    {simMode === 'authorized' && simStep === 1 && 'Scanning Biometric RFID'}
                    {simMode === 'authorized' && simStep === 2 && 'Authorized Transfer In Progress'}
                    {simMode === 'authorized' && simStep === 3 && 'Armory Log Completed'}
                  </h3>
                </div>

                {simMode === 'unauthorized' && simStep === 3 && (
                  <button
                    onClick={() => navigate(`/portal/defence/alerts`)}
                    className="w-full mt-2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                  >
                    View Critical Alert Log
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSimulateAuthorized}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Transfer</span>
            </button>
            <button
              onClick={handleSimulateUnauthorized}
              className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Trigger Breach</span>
            </button>
          </div>
        </div>

        {/* Right: Armory Inventory Table */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">Garrison Armory Inventory</h2>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search armory item..."
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />

              <div className="flex items-center gap-1">
                {['All', 'Weapon', 'Ammunition', 'Storage'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Item Description</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Quantity</th>
                  <th className="py-3 px-3.5">Depot Location</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-white">{item.item}</td>
                    <td className="py-3 px-3.5 text-slate-400">{item.category}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-teal-400">{item.quantity}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">{item.location}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DefenceTracker;
