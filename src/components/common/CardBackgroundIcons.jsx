import React from 'react';

// Faint corner watermark wrapper (opacity 0.08, bottom: 8px, right: 8px)
export const CardBgWrapper = ({ children, className = "" }) => (
  <div className={`absolute bottom-2 right-2 pointer-events-none z-0 opacity-[0.08] transition-opacity group-hover:opacity-[0.14] ${className}`}>
    {children}
  </div>
);

// 1. Camera Network: CCTV Lens & Multi-Channel Viewfield Cone
export const CameraBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <rect x="6" y="12" width="24" height="20" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 18l12-8v24l-12-8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="22" r="5" strokeLinecap="round" />
      <path d="M6 38h36M12 42h24" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  </CardBgWrapper>
);

// 2. Alert & Incident Triage: Waveform Signal & Alert Warning Pulse
export const AlertBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M24 6L42 38H6L24 6Z" strokeLinejoin="round" />
      <line x1="24" y1="18" x2="24" y2="28" strokeLinecap="round" />
      <circle cx="24" cy="33" r="1.5" fill="currentColor" />
      <path d="M4 42c8-4 12 4 20 0s12-4 20 0" strokeLinecap="round" opacity="0.6" />
    </svg>
  </CardBgWrapper>
);

// 3. Bell Icon: Threat Bell Alert
export const BellBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M36 18A12 12 0 0012 18c0 14-6 18-6 18h36s-6-4-6-18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27.46 42a4 4 0 01-6.92 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </CardBgWrapper>
);

// 4. Watchlist & Target Dossier: Target Crosshair Reticle
export const WatchlistBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <circle cx="24" cy="24" r="18" />
      <circle cx="24" cy="24" r="11" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.4" />
      <line x1="24" y1="2" x2="24" y2="10" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="46" strokeLinecap="round" />
      <line x1="2" y1="24" x2="10" y2="24" strokeLinecap="round" />
      <line x1="38" y1="24" x2="46" y2="24" strokeLinecap="round" />
    </svg>
  </CardBgWrapper>
);

// 5. CPU / AI Engine: Microchip Matrix & Neural Traces
export const CpuBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <rect x="10" y="10" width="28" height="28" rx="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="18" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4v6M24 4v6M32 4v6M16 38v6M24 38v6M32 38v6" strokeLinecap="round" />
      <path d="M4 16h6M4 24h6M4 32h6M38 16h6M38 24h6M38 32h6" strokeLinecap="round" />
    </svg>
  </CardBgWrapper>
);

// 6. Criminal Tracking / Biometrics: Facial Biometric Mesh Scan Frame
export const AttendanceBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M6 14V8a2 2 0 012-2h6M34 6h6a2 2 0 012 2v6M42 34v6a2 2 0 01-2 2h-6M14 42H8a2 2 0 01-2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="18" r="7" />
      <path d="M14 36c0-6 4.5-10 10-10s10 4 10 10" strokeLinecap="round" />
    </svg>
  </CardBgWrapper>
);

// 7. Geospatial Map: Topo Map Contour & Location Pin Grid
export const MapBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M40 18c0 12-16 24-16 24S8 30 8 18a16 16 0 0132 0z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="18" r="5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="24" cy="42" rx="14" ry="3" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  </CardBgWrapper>
);

// 8. Vehicle & ANPR: Speed Corridor Radar & License Plate Frame
export const VehicleBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M8 28l6-12h20l6 12v12H8V28Z" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="32" width="20" height="6" rx="1" />
      <circle cx="14" cy="28" r="2.5" />
      <circle cx="34" cy="28" r="2.5" />
      <path d="M4 44h40" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  </CardBgWrapper>
);

// 9. Missing Child Rescue: Sonar Search Sweep & Magnifier Radar
export const ChildSearchBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <circle cx="20" cy="20" r="14" />
      <line x1="30" y1="30" x2="42" y2="42" strokeLinecap="round" strokeWidth="2" />
      <circle cx="20" cy="16" r="4" />
      <path d="M12 28c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  </CardBgWrapper>
);

// 10. Defence & Tactical Command: Shield Crest & Armory Radar
export const ShieldBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <path d="M24 4L40 12V24C40 34 24 44 24 44C24 44 8 34 8 24V12L24 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 14v16M16 22h16" strokeLinecap="round" />
    </svg>
  </CardBgWrapper>
);

// 11. Intelligence Reports: Audit Document & Telemetry Trend Lines
export const ReportBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <rect x="10" y="6" width="28" height="36" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="14" x2="32" y2="14" strokeLinecap="round" />
      <line x1="16" y1="20" x2="32" y2="20" strokeLinecap="round" />
      <path d="M16 32l5-6 6 3 7-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </CardBgWrapper>
);

// 12. System Settings: Microchip Node & Gear Tuning Outline
export const SettingsBgSvg = ({ className = "w-12 h-12" }) => (
  <CardBgWrapper>
    <svg viewBox="0 0 48 48" fill="none" className={`stroke-current stroke-[1.5] ${className}`}>
      <circle cx="24" cy="24" r="6" />
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </CardBgWrapper>
);
