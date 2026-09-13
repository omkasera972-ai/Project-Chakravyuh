// --- Uniform Frontend IST Formatting & Utility Helpers (Asia/Kolkata) ---

export const formatISTDate = (inputVal) => {
  if (!inputVal || inputVal === '--') return '--';
  try {
    const d = new Date(inputVal);
    if (isNaN(d.getTime())) return inputVal;
    const day = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'Asia/Kolkata' }).format(d);
    const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Kolkata' }).format(d);
    const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Kolkata' }).format(d);
    return `${day} ${month} ${year}`;
  } catch (e) {
    return inputVal;
  }
};

export const formatISTTime = (inputVal) => {
  if (!inputVal || inputVal === '--') return '--';
  try {
    const d = new Date(inputVal);
    if (isNaN(d.getTime())) return inputVal;
    const tf = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(d);
    return `${tf} IST`;
  } catch (e) {
    return inputVal;
  }
};

export const safeSetLocalStorage = (key, value) => {
  try {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valStr);
  } catch (e) {
    console.warn(`[localStorage] Quota limit prevented saving "${key}"`, e);
  }
};

export const getApiBaseUrl = () => {
  if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
  }
  return 'http://127.0.0.1:8000';
};
