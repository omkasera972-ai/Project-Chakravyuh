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
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      // Direct all production API calls to same-origin relative path (/api/...)
      // This completely eliminates external Render CORS blockages and uses Vercel native serverless API rewrites
      return '';
    }
  }
  return 'http://127.0.0.1:8000';
};

export const compressImageDataUrl = (dataUrl, maxDim = 400, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') return resolve(dataUrl);
    if (!dataUrl.startsWith('data:image')) return resolve(dataUrl);
    // Skip if already small (< 80 KB)
    if (dataUrl.length < 80000) return resolve(dataUrl);

    // Fail-safe timeout: resolve with original dataUrl after 1500ms max
    const timer = setTimeout(() => {
      resolve(dataUrl);
    }, 1500);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        clearTimeout(timer);
        try {
          let width = img.width || maxDim;
          let height = img.height || maxDim;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(dataUrl);
      };
      img.src = dataUrl;
    } catch (err) {
      clearTimeout(timer);
      resolve(dataUrl);
    }
  });
};
