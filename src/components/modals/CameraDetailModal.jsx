import React, { useState } from 'react';
import { X, Video, Play, Pause, Radio, Shield, ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CctvView } from '../CctvView';

export const CameraDetailModal = () => {
  const { selectedCameraForModal, setSelectedCameraForModal, toggleCameraStatus, alerts, showToast } = useApp();
  const [filterMode, setFilterMode] = useState('monochrome');
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!selectedCameraForModal) return null;

  const cam = selectedCameraForModal;
  const relatedAlerts = alerts.filter(a => a.camera === cam.id);

  const handlePTZ = (direction) => {
    showToast('PTZ Control', `Adjusting camera angle: ${direction} on ${cam.id}`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121419] border border-[#272b36] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#21252f] flex items-center justify-between bg-[#0e1014]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#1b1e26] border border-[#2b303c] flex items-center justify-center text-white">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white text-sm font-bold">{cam.code}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  cam.status === 'Online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {cam.status}
                </span>
              </div>
              <p className="text-neutral-400 text-xs">{cam.zone} • {cam.type}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleCameraStatus(cam.id)}
              className="px-3 py-1 text-xs rounded bg-[#1d2028] border border-[#2b303c] hover:border-neutral-400 text-neutral-200 hover:text-white"
            >
              {cam.status === 'Online' ? 'Simulate Disconnect' : 'Reconnect Camera'}
            </button>
            <button
              onClick={() => setSelectedCameraForModal(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Stream View */}
            <div className="lg:col-span-2 space-y-3">
              <div className="overflow-hidden rounded-lg border border-[#242833]">
                <CctvView
                  cameraCode={cam.code}
                  location={cam.name}
                  isLive={cam.status === 'Online'}
                  aspectRatio="aspect-[16/9]"
                  filterMode={filterMode}
                  interactive={false}
                  boundingBoxes={[
                    { top: 40, left: 45, width: 22, height: 35, label: 'VEHICLE', confidence: '96%' }
                  ]}
                />
              </div>

              {/* Camera Controls & Stream Filters */}
              <div className="p-3 rounded-lg bg-[#161820] border border-[#232731] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-400">Filter:</span>
                  {['monochrome', 'thermal', 'night-vision'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilterMode(mode)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                        filterMode === mode
                          ? 'bg-white text-black font-semibold'
                          : 'bg-[#1e222b] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handlePTZ('Pan Left')}
                    className="px-2 py-1 bg-[#1e222b] rounded hover:bg-neutral-700 text-neutral-300"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => handlePTZ('Tilt Up')}
                    className="px-2 py-1 bg-[#1e222b] rounded hover:bg-neutral-700 text-neutral-300"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handlePTZ('Tilt Down')}
                    className="px-2 py-1 bg-[#1e222b] rounded hover:bg-neutral-700 text-neutral-300"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handlePTZ('Pan Right')}
                    className="px-2 py-1 bg-[#1e222b] rounded hover:bg-neutral-700 text-neutral-300"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => handlePTZ('Reset PTZ')}
                    className="p-1 bg-[#1e222b] rounded hover:bg-neutral-700 text-neutral-300"
                    title="Reset Angle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Details & Activity Log */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#161820] border border-[#232731] space-y-2.5 text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block border-b border-[#232731] pb-1.5">
                  Camera Specifications
                </span>
                <div className="flex justify-between text-neutral-400">
                  <span>Resolution:</span>
                  <span className="font-mono text-neutral-200">{cam.resolution}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>GPS Coords:</span>
                  <span className="font-mono text-neutral-200">{cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>AI Detections:</span>
                  <span className="text-white font-semibold">{cam.aiDetections} Objects</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Active Alerts:</span>
                  <span className="text-red-400 font-semibold">{relatedAlerts.length} Flagged</span>
                </div>
              </div>

              {/* Recent Camera Activity */}
              <div className="p-3.5 rounded-lg bg-[#161820] border border-[#232731] space-y-2 text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block border-b border-[#232731] pb-1.5">
                  Recent Telemetry
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <div className="p-2 rounded bg-[#101217] border border-[#20232c]">
                    <div className="flex justify-between text-[11px] text-neutral-300 font-medium">
                      <span>Vehicle OCR Scan</span>
                      <span className="text-neutral-500 font-mono">1 min ago</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">MP09-AB-1234 matched blacklist.</p>
                  </div>
                  <div className="p-2 rounded bg-[#101217] border border-[#20232c]">
                    <div className="flex justify-between text-[11px] text-neutral-300 font-medium">
                      <span>Optical Flow Steady</span>
                      <span className="text-neutral-500 font-mono">4 min ago</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Frame bitrate 4.8 Mbps, 0 packet loss.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
