import React, { useState } from 'react';
import { X, Car, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const SearchVehicleModal = () => {
  const { activeModal, setActiveModal, vehicles } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  if (activeModal !== 'searchVehicle') return null;

  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121419] border border-[#272b36] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[#21252f] flex items-center justify-between bg-[#0e1014]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#1d2028] border border-[#2c313d] flex items-center justify-center text-white">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">ANPR Vehicle Search</h3>
              <p className="text-neutral-400 text-xs">Lookup vehicle registration plates, flagged tags, and intercept history</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-[#21252f]">
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type license number plate (e.g. MP09-AB-1234, Scorpio)..."
            className="w-full px-4 py-2.5 bg-[#171922] border border-[#2c313e] rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-400 font-mono"
          />
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {filteredVehicles.length === 0 ? (
            <p className="text-neutral-500 italic text-center py-6">No vehicle records found matching plate or keyword.</p>
          ) : (
            filteredVehicles.map((veh) => (
              <div
                key={veh.id}
                className="p-3.5 rounded-lg bg-[#15171e] border border-[#242833] hover:border-neutral-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2.5 mb-1">
                    <span className="px-2.5 py-0.5 rounded bg-black border border-neutral-700 text-white font-mono font-bold text-xs tracking-wider">
                      {veh.plate}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      veh.status === 'Blacklisted'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : veh.status === 'Suspicious'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {veh.status}
                    </span>
                  </div>
                  <p className="text-white font-medium text-xs">{veh.type}</p>
                  <p className="text-neutral-400 text-[11px]">{veh.reason} • Last scanned at {veh.lastDetected}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      navigate('/maps');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#1f232d] hover:bg-neutral-700 text-neutral-200 hover:text-white border border-[#2b303c] transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Track Route</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      navigate('/anpr');
                    }}
                    className="px-3 py-1.5 rounded-md bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
