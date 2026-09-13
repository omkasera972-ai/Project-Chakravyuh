export const initialKPIs = {
  totalPersonnel: { value: '0', label: 'Total Person', subtext: 'Registered' },
  activeCameras: { value: '2', label: 'Active Cameras', subtext: 'Online' },
  activeAlerts: { value: '0', label: 'Active Alerts', subtext: 'Normal Status' },
  criminalsTracked: { value: '0', label: 'Criminals Tracked', subtext: 'In Watchlist' },
  missingChildren: { value: '0', label: 'Missing Children', subtext: 'Active Cases' },
};

export const initialCameras = [];

export const initialAlerts = [];

export const crimeOverviewData = [
  { name: 'Theft', count: 45, percentage: 28.8, color: '#6366f1' },
  { name: 'Assault', count: 30, percentage: 19.2, color: '#f43f5e' },
  { name: 'Fraud', count: 25, percentage: 16.0, color: '#f59e0b' },
  { name: 'Vandalism', count: 20, percentage: 12.8, color: '#10b981' },
  { name: 'Others', count: 36, percentage: 23.2, color: '#8b5cf6' },
];

export const incidentsOverTimeData = [
  { day: 'Mon', incidents: 42 },
  { day: 'Tue', incidents: 65 },
  { day: 'Wed', incidents: 38 },
  { day: 'Thu', incidents: 88 },
  { day: 'Fri', incidents: 72 },
  { day: 'Sat', incidents: 44 },
  { day: 'Sun', incidents: 66 },
];

export const initialPersonnel = [];

export const initialWatchlist = [];

export const initialVehicles = [];

export const initialMissingChildren = [];

export const initialDepotInventory = [];

export const initialMovementLogs = [];
