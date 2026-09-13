import React from 'react';
import { CctvView } from './CctvView';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const CameraFeedSection = () => {
  const { cameras, setSelectedCameraForModal } = useApp();
  const navigate = useNavigate();

  // Top 4 real video cameras for Dashboard 2x2 grid
  const displayCameras = cameras.slice(0, 4);

  return (
    <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">
            Live Camera Feeds
          </h2>
          <p className="text-xs text-gray-400 font-medium">4 Real-Time Surveillance Channels</p>
        </div>
        <button
          onClick={() => navigate('/cameras')}
          className="px-3 py-1 rounded-lg bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-all shadow-2xs"
        >
          View All Cameras
        </button>
      </div>

      {/* 2x2 Real Video Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {displayCameras.map((cam) => (
          <CctvView
            key={cam.id}
            cameraCode={cam.code}
            location={cam.name}
            isLive={cam.status === 'Online'}
            feedUrl={cam.feedUrl}
            imageSrc={cam.imageSrc}
            isWebcam={cam.feedUrl === 'webcam'}
            aspectRatio="aspect-[16/10]"
            onClick={() => setSelectedCameraForModal(cam)}
          />
        ))}
      </div>
    </div>
  );
};
