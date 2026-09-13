import React, { useEffect, useRef } from 'react';
import { Video, ShieldAlert, Scan, Radio } from 'lucide-react';

export const CctvView = ({
  cameraCode = 'Cam 01 - MG Road',
  location = 'MG Road',
  isLive = true,
  isThermal = false,
  aspectRatio = 'aspect-[16/10]',
  showOverlays = true,
  interactive = true,
  onClick,
  overlayText = null,
  boundingBoxes = [],
  filterMode = 'realistic',
  imageSrc = null,
  videoUrl = null,
  feedUrl = null,
  isWebcam = false
}) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Live Desktop Webcam Initialization
  useEffect(() => {
    let activeStream = null;
    if (isWebcam || feedUrl === 'webcam') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            activeStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.warn("Webcam access error in CctvView:", err);
          });
      }
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isWebcam, feedUrl]);

  // Map camera codes to School & College Campus CCTV images if not explicitly provided
  let resolvedImage = imageSrc;
  if (!resolvedImage && !isWebcam && feedUrl !== 'webcam') {
    if (cameraCode.includes('02') || cameraCode.includes('Gate') || cameraCode.includes('Entrance')) {
      resolvedImage = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1000&auto=format&fit=crop&q=80';
    } else if (cameraCode.includes('03') || cameraCode.includes('Science') || cameraCode.includes('Academic') || cameraCode.includes('Wing')) {
      resolvedImage = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1000&auto=format&fit=crop&q=80';
    } else if (cameraCode.includes('04') || cameraCode.includes('Library') || cameraCode.includes('Quad')) {
      resolvedImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&auto=format&fit=crop&q=80';
    } else if (cameraCode.includes('05') || cameraCode.includes('Cafeteria') || cameraCode.includes('Lounge')) {
      resolvedImage = 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1000&auto=format&fit=crop&q=80';
    } else if (cameraCode.includes('06') || cameraCode.includes('Sports') || cameraCode.includes('Ground')) {
      resolvedImage = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1000&auto=format&fit=crop&q=80';
    } else {
      resolvedImage = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1000&auto=format&fit=crop&q=80';
    }
  }

  useEffect(() => {
    if (isWebcam || feedUrl === 'webcam' || resolvedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let frame = 0;

    const vehicles = [
      { x: 140, y: 70, speed: 1.5, size: 20, color: '#f8fafc', label: 'ANPR: MP09-AB-1234' },
      { x: 190, y: 110, speed: 1.1, size: 26, color: '#94a3b8', label: 'SPEED: 58 KM/H' },
      { x: 250, y: 55, speed: 1.8, size: 16, color: '#cbd5e1', label: 'VEHICLE PASS' },
      { x: 70, y: 90, speed: 1.3, size: 22, color: '#e2e8f0', label: 'PEDESTRIAN SAFE' },
    ];

    const render = () => {
      frame++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      if (isLive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLive, isWebcam, feedUrl, resolvedImage]);

  const activeVideoUrl = videoUrl || (feedUrl && feedUrl.startsWith('http') ? feedUrl : null);

  return (
    <div
      onClick={onClick}
      className={`relative group bg-gray-900 rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800 ${aspectRatio} ${
        interactive ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600' : ''
      }`}
    >
      {isWebcam || feedUrl === 'webcam' ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover block"
        />
      ) : activeVideoUrl ? (
        <video
          src={activeVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover block filter brightness-95 contrast-105"
        />
      ) : resolvedImage ? (
        <img
          src={resolvedImage}
          alt={cameraCode}
          className="w-full h-full object-cover block filter brightness-95 contrast-105 group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={360}
          height={220}
          className="w-full h-full object-cover block filter brightness-95 contrast-105"
        />
      )}

      {/* Subtle overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/40" />

      {showOverlays && (
        <>
          {/* Top Bar inside Feed: Camera Name (Left) & LIVE Status (Right) */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 text-[11px] font-medium tracking-wide">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
              <span className="font-semibold">{cameraCode}</span>
            </div>

            {isLive ? (
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
                <span className="text-[10px] tracking-wider uppercase font-semibold">LIVE</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-900/80 text-red-100">
                <span className="text-[10px] uppercase font-semibold">OFFLINE</span>
              </div>
            )}
          </div>

          {/* AI Bounding Boxes overlay if any */}
          {boundingBoxes.map((box, idx) => (
            <div
              key={idx}
              style={{
                top: `${box.top || 30}%`,
                left: `${box.left || 35}%`,
                width: `${box.width || 30}%`,
                height: `${box.height || 40}%`
              }}
              className="absolute border border-emerald-400 bg-emerald-500/10 pointer-events-none rounded flex flex-col justify-between p-1 animate-pulse"
            >
              <span className="bg-emerald-500 text-black text-[9px] font-bold px-1 py-0.2 rounded-xs w-max">
                {box.label || 'DETECTION'} {box.confidence || '94%'}
              </span>
            </div>
          ))}

          {/* Center Overlay Text if provided */}
          {overlayText && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 text-white text-xs font-medium tracking-wide shadow-lg">
                {overlayText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
