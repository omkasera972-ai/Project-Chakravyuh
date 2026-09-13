import React, { useState } from 'react';
import { X, BellPlus, AlertTriangle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AddAlertModal = () => {
  const { activeModal, setActiveModal, addAlert, cameras } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    type: 'Suspicious Activity',
    priority: 'High',
    location: 'MG Road, Indore',
    camera: 'CAM-01',
    description: ''
  });

  if (activeModal !== 'addAlert') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addAlert(formData);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121419] border border-[#272b36] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#21252f] flex items-center justify-between bg-[#0e1014]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#1d2028] border border-[#2c313d] flex items-center justify-center text-white">
              <BellPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Dispatch Security Alert</h3>
              <p className="text-neutral-400 text-xs">Broadcast high-priority incident to command units</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Alert Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Unidentified Cargo Vehicle at Perimeter"
              className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 text-xs font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Alert Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white focus:outline-none focus:border-neutral-400 text-xs"
              >
                <option value="Suspicious Activity">Suspicious Activity</option>
                <option value="Perimeter Breach">Perimeter Breach</option>
                <option value="ANPR Hit">ANPR Hit</option>
                <option value="Missing Child Reported">Missing Child Reported</option>
                <option value="Watchlist Match">Watchlist Match</option>
                <option value="Weapon Transit">Weapon Transit</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white focus:outline-none focus:border-neutral-400 text-xs"
              >
                <option value="Critical">Critical (Immediate Red)</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Surveillance Camera</label>
              <select
                value={formData.camera}
                onChange={(e) => setFormData({ ...formData, camera: e.target.value })}
                className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white focus:outline-none focus:border-neutral-400 text-xs"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Location Name</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Sector 4 Checkpoint"
                className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Description & Field Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter incident context, dispatch details, or license tags..."
              className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 text-xs font-sans resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#21252f]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-lg bg-[#191b22] border border-[#272b35] hover:border-neutral-400 text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
            >
              Dispatch Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
