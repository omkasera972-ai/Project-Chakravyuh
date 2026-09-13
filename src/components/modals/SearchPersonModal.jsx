import React, { useState } from 'react';
import { X, UserSearch, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const SearchPersonModal = () => {
  const { activeModal, setActiveModal, personnel, watchlist } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  if (activeModal !== 'searchPerson') return null;

  const filteredPersonnel = personnel.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWatchlist = watchlist.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.crimeType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121419] border border-[#272b36] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[#21252f] flex items-center justify-between bg-[#0e1014]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#1d2028] border border-[#2c313d] flex items-center justify-center text-white">
              <UserSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Biometric & Personnel Lookup</h3>
              <p className="text-neutral-400 text-xs">Search active officers, staff registry, or high-risk watchlist</p>
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
            placeholder="Type name, badge ID, or keyword (e.g. Rahul, Shadow, W-9021)..."
            className="w-full px-4 py-2.5 bg-[#171922] border border-[#2c313e] rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-400 font-sans"
          />
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Watchlist Section */}
          <div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-2">
              Watchlist Matches ({filteredWatchlist.length})
            </span>
            {filteredWatchlist.length === 0 ? (
              <p className="text-neutral-500 italic">No watchlist targets found matching query.</p>
            ) : (
              <div className="space-y-2">
                {filteredWatchlist.map((target) => (
                  <div
                    key={target.id}
                    onClick={() => {
                      setActiveModal(null);
                      navigate('/criminal-tracking');
                    }}
                    className="p-3 rounded-lg bg-[#18151b] border border-red-950/60 hover:border-red-500/60 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-red-950 border border-red-800/80 flex items-center justify-center text-base">
                        {target.photo}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-[13px]">{target.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold text-[10px]">
                            {target.riskLevel}
                          </span>
                        </div>
                        <span className="text-neutral-400 text-xs">{target.crimeType} • Last seen: {target.lastSeen}</span>
                      </div>
                    </div>
                    <span className="text-neutral-400 text-xs font-mono">{target.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personnel Section */}
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Authorized Personnel Registry ({filteredPersonnel.length})
            </span>
            {filteredPersonnel.length === 0 ? (
              <p className="text-neutral-500 italic">No personnel found.</p>
            ) : (
              <div className="space-y-2">
                {filteredPersonnel.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => {
                      setActiveModal(null);
                      navigate('/attendance');
                    }}
                    className="p-3 rounded-lg bg-[#15171e] border border-[#242833] hover:border-neutral-400 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#20242d] border border-[#2e3340] flex items-center justify-center text-base">
                        {person.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-[13px]">{person.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium text-[10px]">
                            {person.status}
                          </span>
                        </div>
                        <span className="text-neutral-400 text-xs">{person.role} • {person.department}</span>
                      </div>
                    </div>
                    <span className="text-neutral-400 text-xs font-mono">{person.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
