import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { jsPDF } from 'jspdf';
import { 
  ScanFace, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert, 
  Play, 
  Plus, 
  Eye, 
  AlertCircle, 
  Upload, 
  Camera, 
  Search, 
  UserX, 
  User, 
  ShieldCheck, 
  CheckCircle2,
  X, 
  FileText, 
  Download,
  RefreshCw,
  Sparkles,
  Zap,
  Video,
  VideoOff,
  Radio,
  Users,
  Trash2,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getApiBaseUrl, compressImageDataUrl } from '../utils/dateUtils';
import { StatCard } from '../components/StatCard';
import { CctvView } from '../components/CctvView';
import { CriminalMapSection } from '../components/CriminalMapSection';
import { useNavigate } from 'react-router-dom';

// ------------------------------------------------------------------
// PRETRAINED FACE RECOGNITION ENGINE (@vladmandic/face-api ResNet-34)
// ------------------------------------------------------------------

let modelsLoaded = false;
let modelLoadingPromise = null;

const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  if (!modelLoadingPromise) {
    modelLoadingPromise = (async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        return true;
      } catch (err) {
        console.error("AI Face Models loading error:", err);
        modelsLoaded = false;
        return false;
      }
    })();
  }
  return modelLoadingPromise;
};

// Image loader for faceapi processing
const loadImageElement = (imageDataUrl) => {
  return new Promise((resolve) => {
    if (!imageDataUrl) return resolve(null);
    if (typeof imageDataUrl !== 'string') return resolve(imageDataUrl);
    const img = new Image();
    if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

// Multi-Face Detection & ResNet Descriptor Extraction Engine (High Accuracy for Distant Faces)
const detectAndExtractFaceDescriptor = async (imageDataUrl) => {
  try {
    const isReady = await loadFaceModels();
    if (!isReady) {
      return { faceCount: 0, hasFace: false, faces: [], descriptor: null, error: "AI Face Models Failed to Load" };
    }
    const imgElement = await loadImageElement(imageDataUrl);
    if (!imgElement) return { faceCount: 0, hasFace: false, faces: [], descriptor: null };

    // Primary SSD MobileNet V1 scan with low confidence threshold for instant face detection
    let detections = await faceapi
      .detectAllFaces(imgElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.10, maxResults: 100 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Fallback: If SSD misses small distant face, run Tiny Face Detector
    if (detections.length === 0) {
      detections = await faceapi
        .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.10 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
    }

    const faceCount = detections.length;

    if (faceCount === 0) {
      return { faceCount: 0, hasFace: false, faces: [], descriptor: null, message: "No Face Detected — Position face closer to camera or increase lighting" };
    }

    const imgW = imgElement.width || imgElement.naturalWidth || 640;
    const imgH = imgElement.height || imgElement.naturalHeight || 480;

    const faces = detections.map((det, idx) => ({
      index: idx,
      descriptor: Array.from(det.descriptor),
      box: det.detection.box,
      imageWidth: imgW,
      imageHeight: imgH
    }));

    return {
      faceCount,
      hasFace: true,
      faces,
      descriptor: faces[0].descriptor,
      box: faces[0].box
    };
  } catch (err) {
    console.error("Face detection/descriptor extraction error:", err);
    return { faceCount: 0, hasFace: false, faces: [], descriptor: null, error: err.message };
  }
};

export const CriminalTracking = () => {
  const { watchlist, addToWatchlist, removeFromWatchlist, clearCustomWatchlist, resetWatchlist, addAlert, addCriminalDetection, showToast, alerts = [], cameras = [], dispatchPhoneNumbers = [], userLocation, authFetch } = useApp();
  const navigate = useNavigate();

  const [isModelsReady, setIsModelsReady] = useState(modelsLoaded);
  const [modelLoadError, setModelLoadError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [modalFormError, setModalFormError] = useState(null);
  const [watchlistSearchTerm, setWatchlistSearchTerm] = useState('');

  // Mode for Main Scanner: 'camera' (Live Webcam) | 'cctv' (CCTV Camera Stream) | 'upload' (Photo Upload) | 'preset'
  const [scanTab, setScanTab] = useState('camera'); 
  const [scanImage, setScanImage] = useState(null);
  const [scanTargetId, setScanTargetId] = useState('AUTO_DETECT');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  // Screen Alert Popup Overlay & Toggle State
  const [isScreenAlertEnabled, setIsScreenAlertEnabled] = useState(true);
  const [screenDetectionAlert, setScreenDetectionAlert] = useState(null);
  const isScreenAlertEnabledRef = useRef(true);

  useEffect(() => {
    isScreenAlertEnabledRef.current = isScreenAlertEnabled;
  }, [isScreenAlertEnabled]);

  const handleConfirmDelete = () => {
    if (!profileToDelete) return;
    const idToDelete = profileToDelete.id;

    // Clean up in-memory descriptor cache if present
    if (referenceEmbeddingsRef.current[idToDelete]) {
      delete referenceEmbeddingsRef.current[idToDelete];
    }

    if (selectedProfile && selectedProfile.id === idToDelete) {
      setSelectedProfile(null);
    }

    removeFromWatchlist(idToDelete);
    setProfileToDelete(null);
  };

  // Reference Face Embeddings Cache
  const referenceEmbeddingsRef = useRef({});

  useEffect(() => {
    let isMounted = true;
    loadFaceModels()
      .then((ready) => {
        if (!isMounted) return;
        if (ready) {
          setIsModelsReady(true);
          setModelLoadError(null);
        } else {
          setIsModelsReady(false);
          setModelLoadError("AI Face Models Failed to Load");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Model loading hook error:", err);
        setIsModelsReady(false);
        setModelLoadError("AI Face Models Failed to Load");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getReferenceEmbedding = (target) => {
    if (!target) return null;
    if (referenceEmbeddingsRef.current[target.id]) {
      return referenceEmbeddingsRef.current[target.id];
    }
    if (Array.isArray(target.embedding) && target.embedding.length === 128) {
      return target.embedding;
    }
    return null;
  };

  const getOrFetchReferenceEmbedding = async (target) => {
    if (!target) return null;
    const existing = getReferenceEmbedding(target);
    if (existing) return existing;

    if (target.photoUrl) {
      try {
        const res = await detectAndExtractFaceDescriptor(target.photoUrl);
        if (res.hasFace && res.descriptor) {
          referenceEmbeddingsRef.current[target.id] = res.descriptor;
          return res.descriptor;
        }
      } catch (err) {
        console.warn(`Error extracting embedding for ${target.name}:`, err);
      }
    }
    return null;
  };

  // Main Live Camera Stream State (Scanner)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // CCTV Camera Selector State for Scanner
  const [selectedCctvId, setSelectedCctvId] = useState('CAM-03');
  const [selectedCctvCode, setSelectedCctvCode] = useState('Cam 03 - Highway');
  const [selectedCctvLocation, setSelectedCctvLocation] = useState('Highway Expressway');

  useEffect(() => {
    if (watchlist.length > 0) {
      const startTime = window.__app_mount_time || performance.now();
      const totalMs = performance.now() - startTime;
      console.log(`[PERF] Total time until data visible: ${totalMs.toFixed(2)} ms (Items count: ${watchlist.length})`);
    }
  }, [watchlist]);

  // Pre-load and cache face embeddings ONLY when camera scanner is active, using non-blocking lazy queue
  useEffect(() => {
    if (!isModelsReady || !isCameraActive || !watchlist || watchlist.length === 0) return;
    let isCancelled = false;

    const processLazyEmbeddings = async () => {
      for (const target of watchlist) {
        if (isCancelled) break;
        if (target && target.id) {
          if (Array.isArray(target.embedding) && target.embedding.length > 0) {
            referenceEmbeddingsRef.current[target.id] = target.embedding;
          } else if (!referenceEmbeddingsRef.current[target.id] && target.photoUrl) {
            try {
              const res = await detectAndExtractFaceDescriptor(target.photoUrl);
              if (res.hasFace && res.descriptor) {
                referenceEmbeddingsRef.current[target.id] = res.descriptor;
              }
            } catch (err) {}
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    };

    processLazyEmbeddings();

    return () => {
      isCancelled = true;
    };
  }, [isModelsReady, isCameraActive, watchlist]);

  const fileInputRef = useRef(null);
  const scanFileInputRef = useRef(null);

  // Form State for Adding New Criminal
  const [newFormData, setNewFormData] = useState({
    name: '',
    riskLevel: 'Criminal',
    crimeType: 'Criminal Offense',
    lastSeen: 'CAM-03 Highway',
    age: 32,
    details: '',
    photoUrl: ''
  });
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);

  // Camera Intercept Simulation State (Highway CCTV)
  const [simState, setSimState] = useState({
    active: false,
    step: 0,
    confidence: '94%',
    camera: 'CAM-03',
    location: 'Highway - North Toll Corridor',
    target: null
  });

  const highRiskCount = watchlist.filter(w => w.riskLevel === 'Criminal' || w.riskLevel === 'Critical Criminal' || w.riskLevel === 'High Risk' || w.riskLevel === 'Critical').length;
  const userAddedTargets = watchlist.filter(w => w.isUserAdded);

  // -------------------------------------------------------------
  // CAMERA HELPERS FOR MAIN SCANNER
  // -------------------------------------------------------------
  const startMainCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access live webcam. Check browser permissions.");
      setIsCameraActive(false);
    }
  };

  const stopMainCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopMainCamera();
    };
  }, []);

  const captureMainCameraPhoto = () => {
    if (!videoRef.current || !isCameraActive) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setScanImage(dataUrl);
    return dataUrl;
  };

  const handleAddPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result;
        const compressed = await compressImageDataUrl(rawDataUrl, 400, 0.85);
        setNewPhotoPreview(compressed);
        setNewFormData(prev => ({ ...prev, photoUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (scanTab === 'camera') {
      startMainCamera();
    } else {
      stopMainCamera();
    }
    return () => {
      stopMainCamera();
    };
  }, [scanTab]);

  // -------------------------------------------------------------
  // HANDLERS & PRETRAINED BIOMETRIC EMBEDDING MATCHING LOGIC
  // -------------------------------------------------------------
  const handlePhotoUpload = (e) => {
    setModalFormError(null);
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result;
        const compressed = await compressImageDataUrl(rawDataUrl, 400, 0.85);
        setNewPhotoPreview(compressed);
        setNewFormData(prev => ({ ...prev, photoUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    setModalFormError(null);

    if (!newFormData.name.trim()) {
      setModalFormError("Please enter the suspect's full name or alias.");
      return;
    }

    if (!newPhotoPreview) {
      setModalFormError("Please upload a valid criminal reference photo.");
      return;
    }

    setIsRegistering(true);

    try {
      // Soft face descriptor extraction (Biometric enhancement)
      let descriptor = null;
      try {
        const result = await detectAndExtractFaceDescriptor(newPhotoPreview);
        if (result && result.hasFace && result.descriptor) {
          descriptor = result.descriptor;
        }
      } catch (faceErr) {
        console.warn("Face descriptor extraction notice:", faceErr);
      }

      const newTargetId = `W-USER-${Math.floor(1000 + Math.random() * 9000)}`;

      if (descriptor) {
        referenceEmbeddingsRef.current[newTargetId] = descriptor;
      }

      const res = await addToWatchlist({
        ...newFormData,
        crimeType: newFormData.crimeType.trim() || 'Criminal Offense',
        lastSeen: newFormData.lastSeen.trim() || 'CAM-03 Highway',
        riskLevel: newFormData.riskLevel || 'Criminal',
        id: newTargetId,
        isUserAdded: true,
        photoUrl: newPhotoPreview,
        embedding: descriptor
      });

      if (res && res.success) {
        setIsAddingNew(false);
        setNewFormData({
          name: '',
          riskLevel: 'Criminal',
          crimeType: 'Criminal Offense',
          lastSeen: 'CAM-03 Highway',
          age: 32,
          details: '',
          photoUrl: ''
        });
        setNewPhotoPreview(null);
      } else {
        setModalFormError(res?.error || "Registration failed. Please ensure you are logged in.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setModalFormError("Registration failed: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleScanFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickPreset = (target, customPhotoUrl, isCriminal = true) => {
    stopMainCamera();
    if (isCriminal && target) {
      setScanImage(target.photoUrl || customPhotoUrl);
      setScanTargetId(target.id);
    } else {
      setScanImage(customPhotoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80');
      setScanTargetId('CLEAN_CITIZEN');
    }
    setScanResult(null);
  };

  const isProcessingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const isAutoScanningRef = useRef(false);
  const lastAlertTimeByTargetRef = useRef({});
  const lastMatchHoldRef = useRef(null);
  const detectedTargetIdsRef = useRef(new Set()); // One-time detection lock per suspect

  const resetDetectionLock = () => {
    detectedTargetIdsRef.current.clear();
    lastAlertTimeByTargetRef.current = {};
    lastMatchHoldRef.current = null;
    setScanResult(null);
    if (showToast) showToast("Scanner Memory Reset", "Detection lock cleared. System ready for new face scans.", "info");
  };

  // AUTOMATIC WEBCAM SCAN LOOP (Ultra-Fast 250ms Real-Time Multi-Face Matcher)
  const SCAN_COOLDOWN_MS = 250;

  useEffect(() => {
    let intervalId = null;

    if (scanTab === 'camera' && isCameraActive && isModelsReady) {
      intervalId = setInterval(async () => {
        if (isProcessingRef.current) return;
        if (isAutoScanningRef.current) return;
        if (Date.now() - lastScanTimeRef.current < SCAN_COOLDOWN_MS) return;
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        isAutoScanningRef.current = true;
        try {
          let detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.08, maxResults: 200 })
          );

          if (detections.length === 0) {
            detections = await faceapi.detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.08 })
            );
          }

          const faceCount = detections.length;

          if (faceCount === 0) {
            // Only update to NO_FACE_DETECTED if match hold has expired
            if (!lastMatchHoldRef.current || Date.now() - lastMatchHoldRef.current.timestamp > 3000) {
              lastMatchHoldRef.current = null;
              setScanResult(prev => {
                if (prev?.status === 'NO_FACE_DETECTED') return prev;
                return {
                  status: 'NO_FACE_DETECTED',
                  hasFace: false,
                  message: 'FACE NOT DETECTED'
                };
              });
            }
          } else if (faceCount >= 1) {
            // 1 or more faces detected! Automatically capture frame and run silent multi-face matching
            const capturedPhoto = captureMainCameraPhoto();
            if (capturedPhoto) {
              lastScanTimeRef.current = Date.now();
              await runFaceMatchAnalysis(capturedPhoto, true);
            }
          }
        } catch (err) {
          console.warn("Auto-scan detection check warning:", err);
        } finally {
          isAutoScanningRef.current = false;
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [scanTab, isCameraActive, isModelsReady]);

  const runFaceMatchAnalysis = async (imageToAnalyze, isSilentAutoScan = false) => {
    const img = imageToAnalyze || scanImage;
    if (!img && scanTab !== 'cctv') return;

    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    if (!isSilentAutoScan) {
      setIsScanning(true);
      setScanProgress(10);
      setScanResult(null);
    }

    try {
      if (!isModelsReady) {
        setScanResult({
          status: 'MODEL_ERROR',
          hasFace: false,
          message: 'AI Face Models Failed to Load'
        });
        return;
      }

      if (!isSilentAutoScan) setScanProgress(30);
      // 1. Detect ALL faces on live verification frame
      const liveResult = await detectAndExtractFaceDescriptor(img);

      if (liveResult.error) {
        setScanResult({
          status: 'MODEL_ERROR',
          hasFace: false,
          message: liveResult.error
        });
        return;
      }

      // STATE 1: NO FACE DETECTED
      if (!liveResult.hasFace || liveResult.faceCount === 0) {
        if (scanTab !== 'cctv') {
          if (!lastMatchHoldRef.current || Date.now() - lastMatchHoldRef.current.timestamp > 3000) {
            lastMatchHoldRef.current = null;
            setScanResult({
              status: 'NO_FACE_DETECTED',
              hasFace: false,
              message: 'FACE NOT DETECTED'
            });
          }
          return;
        }
      }

      if (!isSilentAutoScan) setScanProgress(50);

      // Optimized Biometric Threshold (0.58): Ultra-fast high-accuracy ResNet-34 face match
      const FACE_DISTANCE_THRESHOLD = 0.58;
      const rawEvaluatedFaces = [];

      for (const f of liveResult.faces) {
        const liveDescriptor = new Float32Array(f.descriptor);
        let bestCandidateForFace = null;
        let minDistanceForFace = Infinity;

        if (scanTargetId === 'CLEAN_CITIZEN') {
          bestCandidateForFace = null;
        } else if (scanTargetId && scanTargetId !== 'AUTO_DETECT') {
          const selectedTarget = watchlist.find(w => w.id === scanTargetId);
          const refEmbedding = await getOrFetchReferenceEmbedding(selectedTarget);
          if (refEmbedding) {
            try {
              const refFloat32 = new Float32Array(refEmbedding);
              const dist = faceapi.euclideanDistance(liveDescriptor, refFloat32);
              minDistanceForFace = dist;
              if (dist <= FACE_DISTANCE_THRESHOLD) {
                bestCandidateForFace = selectedTarget;
              }
            } catch (err) {
              console.warn(`Error evaluating selected target ${selectedTarget?.name}:`, err);
            }
          }
        } else {
          // AUTO DETECT MODE: Compare this face against every profile in watchlist
          for (const target of watchlist) {
            const refEmbedding = await getOrFetchReferenceEmbedding(target);
            if (!refEmbedding) continue;

            try {
              const refFloat32 = new Float32Array(refEmbedding);
              const dist = faceapi.euclideanDistance(liveDescriptor, refFloat32);
              if (dist < minDistanceForFace) {
                minDistanceForFace = dist;
                if (dist <= FACE_DISTANCE_THRESHOLD) {
                  bestCandidateForFace = target;
                }
              }
            } catch (err) {
              continue;
            }
          }
        }

        const isCandidate = Boolean(bestCandidateForFace && minDistanceForFace <= FACE_DISTANCE_THRESHOLD);

        rawEvaluatedFaces.push({
          index: f.index,
          box: f.box,
          imageWidth: f.imageWidth,
          imageHeight: f.imageHeight,
          isCandidate,
          target: isCandidate ? bestCandidateForFace : null,
          rawDistance: minDistanceForFace,
          distance: minDistanceForFace < Infinity ? minDistanceForFace.toFixed(2) : '1.00'
        });
      }

      // PER-FRAME UNIQUENESS RESOLUTION:
      // A single criminal target ID can ONLY match at most 1 face per frame (the face with the absolute lowest distance).
      // If multiple faces in the frame claim the same criminal ID, only the face with the minimum distance keeps the match!
      const targetMinDistances = {};
      rawEvaluatedFaces.forEach(rf => {
        if (rf.isCandidate && rf.target) {
          const tid = rf.target.id;
          if (targetMinDistances[tid] === undefined || rf.rawDistance < targetMinDistances[tid]) {
            targetMinDistances[tid] = rf.rawDistance;
          }
        }
      });

      const facesEvaluated = rawEvaluatedFaces.map(rf => {
        const isUniqueCriminal = Boolean(
          rf.isCandidate &&
          rf.target &&
          rf.rawDistance === targetMinDistances[rf.target.id]
        );
        return {
          index: rf.index,
          box: rf.box,
          imageWidth: rf.imageWidth,
          imageHeight: rf.imageHeight,
          isCriminal: isUniqueCriminal,
          target: isUniqueCriminal ? rf.target : null,
          distance: rf.distance,
          label: isUniqueCriminal ? `CRIMINAL MATCH: ${rf.target.name}` : `CIVILIAN / SAFE`
        };
      });

      setScanProgress(80);

      const criminalMatches = facesEvaluated.filter(f => f.isCriminal);
      const civilianCount = facesEvaluated.length - criminalMatches.length;

      // DEBUG LOGGING
      console.group("=== AI MULTI-FACE RECOGNITION DIAGNOSTICS (@vladmandic/face-api) ===");
      console.log("Models loaded: true");
      console.log(`Live faces evaluated in frame: ${facesEvaluated.length}`);
      console.log(`Criminal Matches: ${criminalMatches.length}`);
      console.log(`Safe Civilians: ${civilianCount}`);
      facesEvaluated.forEach((fe, i) => {
        console.log(`  Face #${i+1}: ${fe.isCriminal ? `🔴 CRIMINAL MATCH (${fe.target.name})` : '🟢 CIVILIAN / SAFE'} | Distance: ${fe.distance}`);
      });
      console.groupEnd();

      setScanProgress(100);

      if (criminalMatches.length > 0) {
        const primaryMatch = criminalMatches[0];
        const matchResultObj = {
          status: 'MATCH_DETECTED',
          hasFace: true,
          isMatch: true,
          target: primaryMatch.target,
          distance: primaryMatch.distance,
          totalFaces: facesEvaluated.length,
          criminalCount: criminalMatches.length,
          civilianCount: civilianCount,
          facesEvaluated: facesEvaluated,
          cctvChannel: scanTab === 'cctv' ? selectedCctvCode : null
        };

        // Cache match hold result for 1500ms stability
        lastMatchHoldRef.current = {
          result: matchResultObj,
          timestamp: Date.now()
        };

        setScanResult(matchResultObj);

        // ONE-TIME DETECTION LOCK: Trigger alert & WhatsApp/Gmail dispatch EXACTLY ONCE per suspect
        if (!detectedTargetIdsRef.current.has(primaryMatch.target.id)) {
          detectedTargetIdsRef.current.add(primaryMatch.target.id);
          lastAlertTimeByTargetRef.current[primaryMatch.target.id] = Date.now();

          const targetRiskStr = String(primaryMatch.target.riskLevel || '').toLowerCase();
          const alertPriority = (targetRiskStr.includes('critical') || targetRiskStr.includes('criminal'))
            ? 'Critical'
            : (targetRiskStr.includes('high') ? 'High' : 'Medium');

          addAlert({
            type: 'Watchlist Match',
            title: `WATCHLIST MATCH DETECTED: ${primaryMatch.target.name}`,
            location: scanTab === 'cctv' ? selectedCctvLocation : 'Facial Scanner Station',
            camera: scanTab === 'cctv' ? selectedCctvId : 'SCAN-CAM-01',
            priority: alertPriority,
            description: `Watchlist suspect ${primaryMatch.target.name} (${primaryMatch.target.id}) recognized (${criminalMatches.length} criminal match out of ${facesEvaluated.length} faces in frame).`
          });

          addCriminalDetection({
            targetId: primaryMatch.target.id,
            targetName: primaryMatch.target.name,
            riskLevel: primaryMatch.target.riskLevel || 'Critical',
            camera: scanTab === 'cctv' ? selectedCctvId : 'CAM-01',
            location: scanTab === 'cctv' ? selectedCctvLocation : 'Live Webcam',
            confidence: `${((1 - parseFloat(primaryMatch.distance || 0.4)) * 100).toFixed(1)}%`
          });

          // Dispatch Backend Email Alert to Registered Officers via authFetch
          const dispatchBackendEmailAlert = async () => {
            try {
              const res = await authFetch(`${getApiBaseUrl()}/api/criminal/dispatch-alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  criminal_id: primaryMatch.target.id,
                  criminal_name: primaryMatch.target.name,
                  photo_url: primaryMatch.target.photoUrl || primaryMatch.target.photo,
                  risk_level: primaryMatch.target.riskLevel || 'Critical Risk',
                  crime_details: primaryMatch.target.details || primaryMatch.target.crimeType || 'Under Active Watchlist Surveillance',
                  ipc_charges: primaryMatch.target.charges || primaryMatch.target.ipcCharges || 'IPC 302 / 395',
                  age: primaryMatch.target.age || '32',
                  cam_id: scanTab === 'cctv' ? (selectedCctvId || 'WEB-Cam01') : 'WEB-Cam01',
                  location: scanTab === 'cctv' ? selectedCctvLocation : 'Sandhalpur, Nemawar Highway, MP, India',
                  lat: userLocation?.lat || 22.504429,
                  lng: userLocation?.lng || 76.979752,
                  force: true
                })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.status === 'success') {
                  showToast('Alert Email Sent', 'Alert email sent successfully to registered officers.', 'success');
                } else if (data.status === 'suppressed') {
                  console.log('[ALERT DUP] Duplicate alert suppressed by backend cooldown.');
                } else {
                  showToast('Alert Notice', data.message || 'Alert processed.', 'info');
                }
              } else {
                const errData = await res.json().catch(() => ({}));
                showToast('Alert Email Warning', errData.detail || errData.message || 'Could not dispatch alert email.', 'error');
              }
            } catch (err) {
              console.error('Error dispatching backend alert email:', err);
              showToast('Alert Email Error', 'Network error sending alert email.', 'error');
            }
          };
          dispatchBackendEmailAlert();

          // Trigger On-Screen Centered Alert Modal if toggle is ON
          if (isScreenAlertEnabledRef.current) {
            const suspectPhoto = primaryMatch.target.photoUrl || primaryMatch.target.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
            setScreenDetectionAlert({
              name: primaryMatch.target.name,
              id: primaryMatch.target.id,
              riskLevel: primaryMatch.target.riskLevel || 'Critical Risk',
              crimeDetails: primaryMatch.target.details || primaryMatch.target.crimeType || 'Under Active Watchlist Surveillance',
              ipcCharges: primaryMatch.target.charges || primaryMatch.target.ipcCharges || primaryMatch.target.ipcSection || primaryMatch.target.details || 'IPC 302 / 395',
              age: primaryMatch.target.age || '32',
              photoUrl: suspectPhoto,
              confidence: `${((1 - parseFloat(primaryMatch.distance || 0.4)) * 100).toFixed(1)}%`,
              cameraNode: scanTab === 'cctv' ? (selectedCctvId || 'CAM-01') : 'CAM-01 (Live Webcam)',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              lat: userLocation?.lat || 22.7240,
              lng: userLocation?.lng || 75.8650,
              target: primaryMatch.target
            });
          }

          // 📲 AUTOMATIC SILENT SERVER-SIDE BACKGROUND DISPATCH VIA BACKEND API (NO BROWSER POPUPS)
          authFetch(`${getApiBaseUrl()}/api/alerts/dispatch-auto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetName: primaryMatch.target.name,
              targetId: primaryMatch.target.id,
              crimeType: primaryMatch.target.details || primaryMatch.target.crimeType,
              risk_level: primaryMatch.target.riskLevel || 'Critical Risk',
              age: primaryMatch.target.age || '32',
              ipc_charges: primaryMatch.target.charges || primaryMatch.target.ipcCharges || primaryMatch.target.crimeType,
              photo_url: primaryMatch.target.photoUrl,
              cameraNode: scanTab === 'cctv' ? selectedCctvLocation : 'Live Webcam - Primary Station',
              confidence: `${((1 - parseFloat(primaryMatch.distance || 0.4)) * 100).toFixed(1)}%`,
              incidentDateTime: primaryMatch.target.incidentDateTime || new Date().toLocaleString(),
              lat: userLocation?.lat || 22.7240,
              lng: userLocation?.lng || 75.8650
            })
          }).then(r => r.json()).then(res => {
            showToast(
              "🚨 Alert Auto-Dispatched",
              "Alert Auto-Dispatched to Active Contacts via Background API",
              "success"
            );
          }).catch(e => console.warn("Background dispatch API warning:", e));


          // Automatic PDF download on laptop disabled per user request (alerts sent via WhatsApp & Gmail)
        }
      } else {
        // MATCH HYSTERESIS HOLD: If target was matched within last 3000ms, hold the match state so camera doesn't flicker/drop like a bulb
        if (lastMatchHoldRef.current && Date.now() - lastMatchHoldRef.current.timestamp < 3000) {
          setScanResult(lastMatchHoldRef.current.result);
        } else {
          lastMatchHoldRef.current = null;
          setScanResult({
            status: 'NO_MATCH',
            hasFace: true,
            isMatch: false,
            distance: facesEvaluated[0]?.distance || '1.00',
            totalFaces: facesEvaluated.length,
            criminalCount: 0,
            civilianCount: civilianCount,
            facesEvaluated: facesEvaluated
          });
        }
      }
    } catch (err) {
      console.error("Face matching failed:", err);
      setScanResult({
        status: 'MODEL_ERROR',
        hasFace: false,
        message: 'Face verification failed: ' + err.message
      });
    } finally {
      setIsScanning(false);
      isProcessingRef.current = false;
    }
  };

  const generateMatchDossierPDF = (resultOrTarget) => {
    const target = resultOrTarget?.target || resultOrTarget;
    if (!target) return;
    const timeNow = new Date().toLocaleString();
    const distanceVal = resultOrTarget?.distance || '0.42';
    const cctvLoc = resultOrTarget?.cctvChannel || (scanTab === 'cctv' ? selectedCctvLocation : 'Facial Scanner Station - CAM-01');

    try {
      showToast('Generating PDF Dossier', `Building official dossier for ${target.name}...`, 'info');
      const doc = new jsPDF();

      // Top Red Official Security Header
      doc.setFillColor(153, 27, 27); // Dark red
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('PROJECT CHAKRAVYUH - LAW ENFORCEMENT & CRIMINAL INTERCEPT DOSSIER', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(254, 202, 202);
      doc.text('OFFICIAL AI FACIAL RECOGNITION BIOMETRIC MATCH REPORT', 14, 26);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.text(`Generated: ${timeNow} | Security Level: RESTRICTED / TOP SECRET`, 14, 34);

      // Warning Banner
      doc.setFillColor(254, 226, 226);
      doc.rect(14, 48, 182, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28);
      doc.text(`CRIMINAL MATCH CONFIRMED: ${target.name.toUpperCase()} (${target.id})`, 20, 58);

      // Suspect Details Table
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 70, 182, 90, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 70, 182, 90, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('BIOMETRIC & INCIDENT TELEMETRY DATA', 20, 82);
      doc.setLineWidth(0.5);
      doc.setDrawColor(185, 28, 28);
      doc.line(20, 85, 190, 85);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Suspect Full Name:`, 20, 95);
      doc.setFont('helvetica', 'normal');
      doc.text(`${target.name}`, 75, 95);

      doc.setFont('helvetica', 'bold');
      doc.text(`Watchlist Profile ID:`, 20, 103);
      doc.setFont('helvetica', 'normal');
      doc.text(`${target.id}`, 75, 103);

      doc.setFont('helvetica', 'bold');
      doc.text(`Risk Severity Rating:`, 20, 111);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(185, 28, 28);
      doc.text(`${target.riskLevel || 'Critical Criminal'}`, 75, 111);
      doc.setTextColor(15, 23, 42);

      doc.setFont('helvetica', 'bold');
      doc.text(`Offense Category:`, 20, 119);
      doc.setFont('helvetica', 'normal');
      doc.text(`${target.crimeType || 'Criminal Offense'}`, 75, 119);

      doc.setFont('helvetica', 'bold');
      doc.text(`Intercept Node / Zone:`, 20, 127);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cctvLoc}`, 75, 127);

      doc.setFont('helvetica', 'bold');
      doc.text(`AI Biometric Confidence:`, 20, 135);
      doc.setFont('helvetica', 'normal');
      doc.text(`Match Confirmed (Euclidean Distance: ${distanceVal})`, 75, 135);

      doc.setFont('helvetica', 'bold');
      doc.text(`Dispatch Status:`, 20, 143);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(185, 28, 28);
      doc.text(`QRT Intercept Mobile Unit Dispatched to Node`, 75, 143);
      doc.setTextColor(15, 23, 42);

      doc.setFont('helvetica', 'bold');
      doc.text(`Target Details:`, 20, 151);
      doc.setFont('helvetica', 'normal');
      doc.text(`${target.details || 'Wanted suspect flagged on AI facial recognition watchlist.'}`, 75, 151);

      // Official Stamp Footer
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 170, 182, 45, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('COMMAND OFFICER CLEARANCE & DISPATCH STAMP', 20, 182);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('This official AI Criminal Intercept Dossier was generated by Project Chakravyuh Command Engine.', 20, 191);
      doc.text('Biometric descriptors verified via 128-D ResNet-34 facial recognition embeddings.', 20, 198);

      // Signature Line
      doc.setDrawColor(71, 85, 105);
      doc.line(135, 203, 185, 203);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Duty Command Officer', 135, 207);

      // Footer Page
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Project Chakravyuh v2.0 AI Enterprise Security Command • Confidential Dossier', 14, 285);

      doc.save(`CHAKRAVYUH_CRIMINAL_INTERCEPT_DOSSIER_${target.id}.pdf`);
      showToast('Dossier PDF Saved', `Official PDF Dossier generated for ${target.name}.`, 'success');
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast('PDF Generation Error', 'Failed to build PDF: ' + err.message, 'error');
    }
  };

  const handleSimulateDetection = () => {
    const target = watchlist.find(w => w.id === 'W-9021') || watchlist[0];
    setSimState({
      active: true,
      step: 1,
      confidence: '94%',
      camera: 'CAM-03',
      location: 'Highway - North Toll Corridor',
      target
    });

    setTimeout(() => {
      setSimState(prev => ({ ...prev, step: 2 }));
    }, 1500);
    setTimeout(() => {
      setSimState(prev => ({ ...prev, step: 3 }));
    }, 3000);
    setTimeout(() => {
      setSimState(prev => ({ ...prev, step: 4 }));
    }, 4500);
    setTimeout(() => {
      setSimState(prev => ({ ...prev, step: 5 }));
      addAlert({
        type: 'CCTV Intercept Alert',
        title: `INTERCEPT ALERT: ${target.name}`,
        location: 'Highway Expressway',
        camera: 'CAM-03',
        priority: 'Critical',
        description: `Surveillance Camera CAM-03 auto-detected target ${target.name} (${target.id}) with high confidence.`
      });
    }, 6000);
  };

  const renderFaceOverlayBoxes = (facesEvaluated) => {
    if (!facesEvaluated || !Array.isArray(facesEvaluated) || facesEvaluated.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {facesEvaluated.map((face, idx) => {
          if (!face.box) return null;
          const imgW = face.imageWidth || 640;
          const imgH = face.imageHeight || 480;

          const leftPercent = Math.max(0, (face.box.x / imgW) * 100);
          const topPercent = Math.max(0, (face.box.y / imgH) * 100);
          const widthPercent = Math.min(100 - leftPercent, (face.box.width / imgW) * 100);
          const heightPercent = Math.min(100 - topPercent, (face.box.height / imgH) * 100);

          return (
            <div
              key={idx}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`
              }}
              className={`absolute border-2 rounded-xl transition-all duration-300 flex flex-col justify-between p-1 ${
                face.isCriminal
                  ? 'border-red-500 bg-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse'
                  : 'border-emerald-400 bg-emerald-400/20 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-md ${
                  face.isCriminal ? 'bg-red-600 text-white font-black' : 'bg-emerald-600 text-white font-bold'
                }`}>
                  {face.isCriminal ? `🚨 CRIMINAL MATCH` : `🟢 CIVILIAN / SAFE`}
                </span>
                <span className="text-[9px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded">
                  Dist: {face.distance}
                </span>
              </div>

              <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded truncate shadow-sm mt-1 ${
                face.isCriminal ? 'bg-red-950 text-red-200 border border-red-500' : 'bg-emerald-950 text-emerald-200 border border-emerald-500'
              }`}>
                {face.isCriminal ? `MATCH: ${face.target?.name}` : `Safe Citizen (No Match)`}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none pb-8">
      {/* 🚀 Sleek Command Header Banner */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border border-red-800/60 p-5 sm:p-6 rounded-3xl shadow-xl text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg border border-red-400/40">
            <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Criminal Tracking System</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
            </h1>
            <p className="text-xs text-red-200/80 font-medium">Real-Time Facial Recognition & Threat Interception Engine</p>
          </div>
        </div>

        {/* 🔔 Screen Alert Modal Toggle Control */}
        <div className="flex items-center space-x-3 bg-red-900/40 border border-red-500/40 px-4 py-2.5 rounded-2xl shadow-inner backdrop-blur-sm">
          <ShieldAlert className={`w-5 h-5 ${isScreenAlertEnabled ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-200">Screen Alert Modal</span>
            <span className={`text-[10px] font-extrabold font-mono ${isScreenAlertEnabled ? 'text-emerald-400' : 'text-gray-400'}`}>
              {isScreenAlertEnabled ? '● POPUP ACTIVE' : '○ POPUP OFF'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsScreenAlertEnabled(!isScreenAlertEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              isScreenAlertEnabled ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isScreenAlertEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>


      {/* Real Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Watchlist Records"
          value={String(watchlist.length)}
          subtext="Active Criminal Profiles"
          icon={ScanFace}
          onClick={() => {
            const el = document.getElementById('watchlist-table');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Active Alerts"
          value={String(alerts.filter(a => a.status === 'Active').length)}
          subtext="Live Critical Alerts"
          indicatorDot="red"
          icon={AlertTriangle}
          onClick={() => navigate('/portal/criminal-tracking/alerts')}
        />
        <StatCard
          title="Recent Matches"
          value={String(alerts.filter(a => a.type?.includes('Criminal') || a.type?.includes('Hit') || a.type?.includes('Match')).length)}
          subtext="Verified Targets"
          icon={UserCheck}
          onClick={() => {
            const el = document.getElementById('watchlist-table');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="High Risk Targets"
          value={String(watchlist.filter(w => w.riskLevel === 'High Risk' || w.riskLevel === 'Critical' || w.riskLevel === 'Criminal').length)}
          subtext="Critical Priority"
          icon={ShieldAlert}
          onClick={() => {
            setWatchlistSearchTerm('High Risk');
            const el = document.getElementById('watchlist-table');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* AI FACE MATCHING & VERIFICATION HUB */}
      <div className="bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
                <ScanFace className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">AI Face Verification & Matcher</h2>
              {!isModelsReady ? (
                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold rounded-lg text-[11px] animate-pulse">
                  AI Face Models Loading...
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold rounded-lg text-[11px]">
                  AI Face Models Ready (@vladmandic/face-api)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Verify faces using Device Webcam, Live CCTV Feed, or Uploaded Photos against the Criminal Database.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-[#1a1d26] p-1 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 flex-wrap gap-y-1">
            <button
              onClick={() => setScanTab('camera')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${scanTab === 'camera' ? 'bg-white dark:bg-[#252a36] text-gray-900 dark:text-white shadow-2xs font-bold' : 'hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Camera className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>📸 Live Webcam</span>
            </button>
            <button
              onClick={() => setScanTab('cctv')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${scanTab === 'cctv' ? 'bg-white dark:bg-[#252a36] text-gray-900 dark:text-white shadow-2xs font-bold' : 'hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>📹 CCTV Camera Feed</span>
            </button>
            <button
              onClick={() => setScanTab('upload')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${scanTab === 'upload' ? 'bg-white dark:bg-[#252a36] text-gray-900 dark:text-white shadow-2xs font-bold' : 'hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📁 Upload Photo</span>
            </button>
            <button
              onClick={() => setScanTab('preset')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${scanTab === 'preset' ? 'bg-white dark:bg-[#252a36] text-gray-900 dark:text-white shadow-2xs font-bold' : 'hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>✨ Presets</span>
            </button>
          </div>
        </div>

        {/* TARGET MATCH MODE CONTROLLER */}
        <div className="bg-gray-50 dark:bg-[#161922] p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700 dark:text-gray-300">🎯 Match Target Database Mode:</span>
            {userAddedTargets.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                {userAddedTargets.length} Custom Profile Registered
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={scanTargetId}
              onChange={(e) => setScanTargetId(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#1f232d] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:border-gray-900 dark:focus:border-white"
            >
              <option value="AUTO_DETECT">
                🔍 AI Face Recognition — ResNet-34 Face Distance Matcher
              </option>
              {watchlist.map(t => (
                <option key={t.id} value={t.id}>
                  👤 Match Target: {t.name} ({t.id}) {t.isUserAdded ? '★ My Uploaded Profile' : ''}
                </option>
              ))}
              <option value="CLEAN_CITIZEN">🟢 Clean Citizen (Force No Watchlist Match)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Input Selection (Webcam / CCTV / Upload / Presets) */}
          <div className="lg:col-span-5 space-y-3">
            {scanTab === 'camera' ? (
              /* Live Webcam Camera Mode */
              <div className="space-y-3">
                <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-gray-950 border-2 border-gray-900 shadow-md flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Multi-Face Bounding Box Overlay */}
                  {scanResult && scanResult.facesEvaluated && renderFaceOverlayBoxes(scanResult.facesEvaluated)}

                  {!isCameraActive && scanImage && (
                    <img src={scanImage} alt="Live Snap" className="w-full h-full object-cover" />
                  )}

                  {isCameraActive && (!scanResult || !scanResult.facesEvaluated || scanResult.facesEvaluated.length === 0) && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                        <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-bounce top-1/2" />
                        
                        <span className="text-[10px] font-mono text-emerald-400 bg-black/70 px-2.5 py-0.5 rounded-md font-black uppercase tracking-widest absolute bottom-2 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>AI MULTI-FACE RECOGNITION</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {!isCameraActive && !scanImage && (
                    <div className="p-5 text-center text-gray-400 dark:text-gray-500 space-y-2">
                      <VideoOff className="w-10 h-10 mx-auto text-gray-600 dark:text-gray-500" />
                      <p className="text-xs font-semibold text-gray-300 dark:text-gray-400">
                        {cameraError || "Camera is turned off"}
                      </p>
                      <button
                        onClick={startMainCamera}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Start Live Camera
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {isCameraActive ? (
                    <div className="col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Multi-Face Scanner: Flags matching uploaded criminal</span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black">Active</span>
                      </div>
                      <button
                        onClick={() => {
                          const capturedData = captureMainCameraPhoto();
                          if (capturedData) {
                            lastScanTimeRef.current = Date.now();
                            runFaceMatchAnalysis(capturedData);
                          }
                        }}
                        disabled={isScanning}
                        className="w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span>📸 SNAP & RE-SCAN NOW (MANUAL OVERRIDE)</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={startMainCamera}
                        className="py-2.5 px-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Video className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span>Restart Webcam</span>
                      </button>
                      <button
                        onClick={() => scanFileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : scanTab === 'cctv' ? (
              /* Live CCTV Camera Stream Mode */
              <div className="space-y-3">
                <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border-2 border-gray-900 shadow-md">
                  <CctvView
                    cameraCode={selectedCctvCode}
                    location={selectedCctvLocation}
                    isLive={true}
                    aspectRatio="aspect-[4/3]"
                    interactive={false}
                    boundingBoxes={
                      isScanning
                        ? [{ top: 25, left: 35, width: 30, height: 45, label: 'SCANNING CCTV FEED', confidence: '96%' }]
                        : []
                    }
                  />
                </div>

                {/* CCTV Selector Dropdown */}
                <div className="space-y-1 text-xs">
                  <label className="block text-gray-700 dark:text-gray-300 font-bold">Select Active CCTV Surveillance Channel:</label>
                  <select
                    value={selectedCctvId}
                    onChange={(e) => {
                      setSelectedCctvId(e.target.value);
                      const foundCam = cameras.find(c => c.id === e.target.value);
                      if (foundCam) {
                        setSelectedCctvCode(foundCam.code);
                        setSelectedCctvLocation(foundCam.name);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1d24] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:border-gray-900 dark:focus:border-white"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>
                        📹 {cam.code} ({cam.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => runFaceMatchAnalysis()}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>📹 SCAN LIVE CCTV SURVEILLANCE FEED NOW</span>
                </button>
              </div>
            ) : scanTab === 'upload' ? (
              /* Photo Upload Mode */
              <div className="space-y-3">
                <div
                  onClick={() => scanFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white bg-gray-50/70 dark:bg-[#151720] hover:bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px] relative overflow-hidden"
                >
                  <input
                    type="file"
                    ref={scanFileInputRef}
                    onChange={handleScanFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {scanImage ? (
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-gray-900 shadow-md group">
                      <img src={scanImage} alt="Scan Target" className="w-full h-full object-cover" />
                      {scanResult && scanResult.facesEvaluated && renderFaceOverlayBoxes(scanResult.facesEvaluated)}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold z-30">
                        Change Photo
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center justify-center mx-auto text-gray-700 dark:text-gray-200">
                        <Upload className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Click to Upload Photo for Verification</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Supports JPG, PNG, WEBP formats (Single or Multiple faces)</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => runFaceMatchAnalysis()}
                  disabled={!scanImage || isScanning}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Verify Uploaded Face & Search Database</span>
                </button>
              </div>
            ) : (
              /* Presets Demo Mode */
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Pick a Test Preset Face:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePickPreset(watchlist[0], null, true)}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center transition-all ${
                      scanImage === watchlist[0]?.photoUrl ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 shadow-xs' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <img src={watchlist[0]?.photoUrl} alt="Target" className="w-12 h-12 rounded-lg object-cover mb-1 border border-gray-300 dark:border-gray-700" />
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 truncate w-full text-center">Rohan (Criminal)</span>
                  </button>

                  <button
                    onClick={() => handlePickPreset(watchlist[3] || watchlist[1], null, true)}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center transition-all ${
                      scanImage === (watchlist[3]?.photoUrl || watchlist[1]?.photoUrl) ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 shadow-xs' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <img src={watchlist[3]?.photoUrl || watchlist[1]?.photoUrl} alt="Target" className="w-12 h-12 rounded-lg object-cover mb-1 border border-gray-300 dark:border-gray-700" />
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 truncate w-full text-center">Tanya (Criminal)</span>
                  </button>

                  <button
                    onClick={() => handlePickPreset(null, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', false)}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center transition-all ${
                      scanTargetId === 'CLEAN_CITIZEN' ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80" alt="Citizen" className="w-12 h-12 rounded-lg object-cover mb-1 border border-gray-300 dark:border-gray-700" />
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate w-full text-center">Clean Citizen</span>
                  </button>
                </div>

                <button
                  onClick={() => runFaceMatchAnalysis()}
                  disabled={!scanImage || isScanning}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Verify Preset & Search Database</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Scan Result & Status Output */}
          <div className="lg:col-span-7 bg-gray-50 dark:bg-[#12151e] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 min-h-[240px] flex flex-col justify-center">
            {isScanning ? (
              <div className="space-y-4 text-center p-4">
                <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-red-600 shadow-xl">
                  {scanTab === 'cctv' ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white font-mono text-xs font-bold">
                      {selectedCctvCode}
                    </div>
                  ) : (
                    <img src={scanImage} alt="Scanning Target" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                  <div className="absolute inset-x-0 h-1 bg-red-500 shadow-[0_0_10px_#ef4444] animate-bounce top-1/2" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">
                    {scanProgress <= 20 && "Detecting faces in frame..."}
                    {scanProgress > 20 && scanProgress <= 40 && "Extracting ResNet-34 face descriptors..."}
                    {scanProgress > 40 && scanProgress <= 75 && "Evaluating registered 128-D biometric embeddings..."}
                    {scanProgress > 75 && scanProgress < 100 && "Evaluating all detected faces independently against criminal database..."}
                    {scanProgress === 100 && "Verification complete."}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                    Computing Euclidean face distances (Threshold: 0.60) — Stage {scanProgress}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : scanResult ? (
              scanResult.status === 'MODEL_ERROR' ? (
                /* MODEL LOAD ERROR STATE */
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-red-700 dark:text-red-400 font-black block">
                          SYSTEM ERROR
                        </span>
                        <h3 className="text-sm font-black text-red-900 dark:text-red-200">AI Face Models Failed to Load</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs shadow-2xs">
                      MODEL UNLOADED
                    </span>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-red-200 dark:border-red-800 shadow-2xs space-y-1 text-xs text-red-950 dark:text-red-200">
                    <p className="font-bold">AI Face Recognition models could not be loaded into memory.</p>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                      {scanResult.message || "Please verify that pretrained model files are present in /public/models/ and reload."}
                    </p>
                  </div>
                </div>
              ) : scanResult.status === 'NO_FACE_DETECTED' ? (
                /* STATE: FACE NOT DETECTED */
                <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-800 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <UserX className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-black block">
                          DETECTION STATUS
                        </span>
                        <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">FACE NOT DETECTED</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs shadow-2xs">
                      NO FACE IN FRAME
                    </span>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs space-y-1 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold">No valid human face recognized in the captured frame.</p>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                      The scanner could not locate human facial features. Match state has been reset. Please ensure a face is clearly positioned in front of the camera lens.
                    </p>
                  </div>
                </div>
              ) : scanResult.status === 'NO_MATCH' ? (
                /* STATE 1: NO MATCH -> NO CRIMINAL RECORD FOUND */
                <div className="bg-emerald-50 dark:bg-[#0e1914] border-2 border-emerald-400 dark:border-emerald-800 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-black block">
                          VERIFICATION RESULT
                        </span>
                        <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">🟢 NO CRIMINAL RECORD FOUND</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono font-black text-xs shadow-2xs">
                      Evaluated: {scanResult.totalFaces || 1} Face(s)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3.5 bg-white dark:bg-[#141b17] p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-black text-gray-900 dark:text-white text-xs">
                        All {scanResult.totalFaces || 1} detected face(s) evaluated as Safe Civilians.
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                        The facial descriptors were checked against all registered surveillance entries. Minimum calculated face distance ({scanResult.distance}) is outside the match threshold (0.60).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* STATE 2: MATCH FOUND -> CRIMINAL RECORD FOUND */
                <div className="bg-gradient-to-br from-rose-50/90 via-white to-red-50/50 dark:from-[#1e1114] dark:via-[#14161f] dark:to-[#1a0f12] border-2 border-red-500/60 dark:border-red-600/60 rounded-2xl p-5 space-y-4 shadow-xl">
                  {/* Top Header & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200/80 dark:border-red-900/60 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2">
                          <span>🔴 CRIMINAL RECORD FOUND</span>
                        </h3>
                        {scanResult.cctvChannel && (
                          <span className="text-xs text-red-700 dark:text-red-300 font-semibold">
                            Surveillance Feed: {scanResult.cctvChannel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono shadow-xs flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>WHATSAPP & GMAIL ACTIVE</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs font-bold font-mono shadow-xs">
                        Face Distance: {scanResult.distance}
                      </span>
                    </div>
                  </div>

                  {/* Integrated Emergency Dispatch Alert Status Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-red-500/10 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-1.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>⚡ Alert Auto-Dispatched via Background API</span>
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        Recipient: {scanResult.target.policeNumber || 'Registered Command Number'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                      Live GPS payload dispatched with nearest Police Station (736m) & Hospital (700m) telemetry via active WhatsApp & Gmail notification services.
                    </p>
                  </div>

                  {/* Multi-Face Crowd Sweep Summary (if applicable) */}
                  {scanResult.facesEvaluated && scanResult.facesEvaluated.length > 1 && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/40 dark:to-red-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            👥 Multi-Face Crowd Sweep Active
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {scanResult.facesEvaluated.length} Faces In Frame
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 p-1.5 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400 block text-[9px]">TOTAL FACES</span>
                          <span className="text-gray-900 dark:text-white text-xs">{scanResult.facesEvaluated.length}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 p-1.5 rounded-lg">
                          <span className="text-red-500 dark:text-red-400 block text-[9px]">CRIMINAL MATCHES</span>
                          <span className="text-red-600 dark:text-red-400 text-xs font-black">
                            {scanResult.facesEvaluated.filter(f => f.isCriminal).length}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 p-1.5 rounded-lg">
                          <span className="text-emerald-600 dark:text-emerald-400 block text-[9px]">SAFE CIVILIANS</span>
                          <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            {scanResult.facesEvaluated.filter(f => !f.isCriminal).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Profile Section */}
                  <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white dark:bg-[#191c28] p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-md text-center sm:text-left">
                    <img
                      src={scanResult.target.photoUrl || scanImage}
                      alt={scanResult.target.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                      }}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-red-500 shadow-md flex-shrink-0 mx-auto sm:mx-0"
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                          {scanResult.target.name}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                          {scanResult.target.riskLevel || 'Critical Risk'}
                        </span>
                        {scanResult.target.isUserAdded && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-700">
                            ★ Custom Profile
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold">
                          ID: {scanResult.target.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                          Offense: {scanResult.target.crimeType || 'Fraud'}
                        </span>
                      </div>

                      {scanResult.target.details && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                          {scanResult.target.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar: Re-Trigger Dispatch & Download PDF */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <button
                      onClick={async () => {
                        try {
                          const res = await authFetch(`${getApiBaseUrl()}/api/criminal/dispatch-alert`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              criminal_id: scanResult.target.id,
                              criminal_name: scanResult.target.name,
                              photo_url: scanResult.target.photoUrl || scanResult.target.photo,
                              risk_level: scanResult.target.riskLevel || 'Critical Risk',
                              crime_details: scanResult.target.details || scanResult.target.crimeType || 'Under Active Watchlist Surveillance',
                              ipc_charges: scanResult.target.charges || scanResult.target.ipcCharges || 'IPC 302 / 395',
                              age: scanResult.target.age || '32',
                              cam_id: scanTab === 'cctv' ? (selectedCctvId || 'WEB-Cam01') : 'WEB-Cam01',
                              location: scanTab === 'cctv' ? selectedCctvLocation : 'Sandhalpur, Nemawar Highway, MP, India',
                              lat: userLocation?.lat || 22.504429,
                              lng: userLocation?.lng || 76.979752,
                              force: true
                            })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const stationName = data.nearest_police_station?.police_station_name || 'Station HQ';
                            const emails = data.dispatched_officers || data.nearest_police_station?.officer_emails || [];
                            showToast("🚨 Alert Dispatched", `Email Alert Sent to ${emails.join(', ') || 'Registered Officers'} (${stationName})`, "success");
                          } else {
                            showToast("Alert Dispatch Warning", "Could not complete alert dispatch.", "error");
                          }
                        } catch (e) {
                          console.error("Re-trigger alert error:", e);
                          showToast("Alert Dispatch Error", "Failed to dispatch email alert.", "error");
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-98"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
                      <span>Re-Trigger Background Dispatch API</span>
                    </button>

                    <button
                      onClick={() => generateMatchDossierPDF(scanResult)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer border border-red-400/40 active:scale-98"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Download PDF Dossier</span>
                    </button>
                  </div>

                  {/* Clean Face Evaluation Breakdown List with faint neutral borders */}
                  {scanResult.facesEvaluated && scanResult.facesEvaluated.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-red-200/60 dark:border-red-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                        Individual Face Evaluation Breakdown ({scanResult.facesEvaluated.length} Total):
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {scanResult.facesEvaluated.map((fe, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs font-bold ${
                              fe.isCriminal
                                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                fe.isCriminal ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span>
                                {fe.isCriminal ? (
                                  <span className="text-red-700 dark:text-red-300">🔴 MATCH: {fe.target?.name}</span>
                                ) : (
                                  <span className="text-emerald-700 dark:text-emerald-300">🟢 Safe Civilian (No Match)</span>
                                )}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] bg-black/10 dark:bg-black/40 px-2 py-0.5 rounded font-bold">
                              Dist: {fe.distance}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span>Watchlist Intercept Alert dispatched to Command & Patrol network.</span>
                  </p>
                </div>
              )
            ) : (
              <div className="text-center p-6 text-gray-400 dark:text-gray-500 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Verification Hub Ready</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                  Select <strong>Live Webcam</strong>, <strong>CCTV Camera Feed</strong>, or <strong>Upload Photo</strong> on the left to run AI Facial Recognition search.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Criminal Map Section removed from UI as requested - Proximity & Distance Telemetry sent directly in WhatsApp & Gmail payload */}

      {/* Active Criminal Watchlist Registry — Full Width Landscape Layout */}
      <div id="watchlist-table" className="w-full bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-gray-900 dark:text-white text-sm font-bold tracking-tight">Active Criminal Watchlist Registry</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider">
                  AI ResNet-34 128D Armed
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{watchlist.length} Registered Suspects</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={watchlistSearchTerm}
                  onChange={(e) => setWatchlistSearchTerm(e.target.value)}
                  placeholder="Search suspect / ID / IPC..."
                  className="pl-8 pr-3 py-1.5 bg-[#f8f9fa] dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setWatchlistSearchTerm('')}
              className={`px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                !watchlistSearchTerm ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              All Targets ({watchlist.length})
            </button>
            <button
              onClick={() => setWatchlistSearchTerm('Critical')}
              className={`px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                watchlistSearchTerm === 'Critical' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              🔴 Critical Risk
            </button>
            <button
              onClick={() => setWatchlistSearchTerm('High')}
              className={`px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                watchlistSearchTerm === 'High' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              ⚠️ High Risk
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#181b24] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Criminal Photo</th>
                  <th className="py-3 px-3.5">Name</th>
                  <th className="py-3 px-3.5">Risk Level</th>
                  <th className="py-3 px-3.5">Crime Category</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {watchlist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserX className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        <p className="font-bold text-sm text-gray-700 dark:text-gray-300">No Criminal Targets Registered</p>
                        <p className="text-xs text-gray-400">Click "+ New Criminal" to add real criminal profiles into the database.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  [...watchlist]
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                    .filter(target => {
                      const q = watchlistSearchTerm.toLowerCase();
                      return (
                        target.name?.toLowerCase().includes(q) ||
                        target.id?.toLowerCase().includes(q) ||
                        target.crimeCategory?.toLowerCase().includes(q) ||
                        target.crimeType?.toLowerCase().includes(q) ||
                        target.riskLevel?.toLowerCase().includes(q)
                      );
                    })
                    .map((target) => (
                    <tr
                      key={target.id}
                      onClick={() => setSelectedProfile(target)}
                      className="hover:bg-red-50/40 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {target.photoUrl ? (
                            <img
                              src={target.photoUrl}
                              alt={target.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base">{target.photo || '👤'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <span>{target.name}</span>
                          {target.isUserAdded && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold" title="Custom Uploaded Suspect">★</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{target.id}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          String(target.riskLevel || '').toLowerCase().includes('critical') || String(target.riskLevel || '').toLowerCase().includes('criminal')
                            ? 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold'
                            : String(target.riskLevel || '').toLowerCase().includes('high')
                            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        }`}>
                          {target.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-gray-600 dark:text-gray-300 font-medium">{target.crimeType}</td>
                      <td className="py-3 px-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setScanImage(target.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
                            setScanTargetId(target.id);
                            setScanTab('preset');
                            setScanResult(null);
                            window.scrollTo({ top: 150, behavior: 'smooth' });
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold transition-colors"
                        >
                          Scan Test
                        </button>
                        <button
                          onClick={() => setSelectedProfile(target)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-semibold text-gray-800 dark:text-gray-200 transition-colors shadow-2xs"
                        >
                          View Profile
                        </button>
                        {target.isUserAdded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileToDelete(target);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors border border-red-200 dark:border-red-800 shadow-2xs"
                            title={`Delete custom profile ${target.name} (${target.id})`}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Target Profile Dossier Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-gray-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-gray-900 dark:text-white font-bold text-sm">Watchlist Dossier: {selectedProfile.id}</h3>
              <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs font-semibold">Close</button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {selectedProfile.photoUrl ? (
                  <img
                    src={selectedProfile.photoUrl}
                    alt={selectedProfile.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{selectedProfile.photo}</span>
                )}
              </div>
              <div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">{selectedProfile.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedProfile.crimeType}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] font-bold">
                  {selectedProfile.riskLevel}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d26] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between"><span>Age:</span><span className="text-gray-900 dark:text-white font-mono font-semibold">{selectedProfile.age} yrs</span></div>
              <div className="flex justify-between"><span>Last Known Location:</span><span className="text-gray-900 dark:text-white font-semibold">{selectedProfile.lastSeen}</span></div>
              <div className="flex justify-between"><span>Details / Incident:</span><span className="text-gray-800 dark:text-gray-200 font-medium">{selectedProfile.details || selectedProfile.crimeType}</span></div>
              <div className="flex justify-between"><span>Record Date:</span><span className="text-gray-500 dark:text-gray-400 font-mono">{selectedProfile.recordDate}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => generateMatchDossierPDF(selectedProfile)}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>📄 Download PDF</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProfile(null);
                  setScanImage(selectedProfile.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
                  setScanTargetId(selectedProfile.id);
                  setScanTab('preset');
                  setScanResult(null);
                  window.scrollTo({ top: 150, behavior: 'smooth' });
                }}
                className="py-2.5 px-3 bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold rounded-xl text-xs hover:bg-black dark:hover:bg-gray-100 transition-colors shadow-xs"
              >
                Test Face Matcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Criminal Record Modal (PURE PHOTO FILE UPLOAD ONLY) */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-gray-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-gray-900 font-bold text-sm">Add Criminal / Suspect to Watchlist</h3>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{modalFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Photo Input: PURE FILE UPLOAD ONLY */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Upload Criminal Photo <span className="text-red-500">*</span>
                </label>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-gray-900 bg-gray-50/80 hover:bg-gray-50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {newPhotoPreview ? (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-gray-900 shadow-md group">
                      <img src={newPhotoPreview} alt="Uploaded Criminal" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Change Photo
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center mx-auto text-gray-700">
                        <Upload className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Click or Drag & Drop Criminal Photo</p>
                      <p className="text-[10px] text-gray-500">Supports JPG, PNG, WEBP formats</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Target Full Name / Alias</label>
                <input
                  type="text"
                  required
                  value={newFormData.name}
                  onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                  placeholder="e.g. Vikramaditya Rao ('Vikram')"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-gray-400 font-medium"
                />
              </div>

              {/* Risk Level & Age */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Risk Level</label>
                  <select
                    value={newFormData.riskLevel}
                    onChange={(e) => setNewFormData({ ...newFormData, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-gray-400 font-bold text-red-700"
                  >
                    <option value="Criminal">🚨 Criminal</option>
                    <option value="Critical Criminal">Critical Criminal</option>
                    <option value="High Risk">High Risk</option>
                    <option value="Medium Risk">Medium Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={newFormData.age}
                    onChange={(e) => setNewFormData({ ...newFormData, age: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-gray-200 rounded-xl text-gray-900 font-mono focus:outline-none focus:bg-white focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Incident / Crime Details */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Crime Category / Offense Details</label>
                <input
                  type="text"
                  value={newFormData.crimeType}
                  onChange={(e) => setNewFormData({ ...newFormData, crimeType: e.target.value })}
                  placeholder="e.g. Bank Heist & Firearms Smuggling"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-gray-400 font-medium"
                />
              </div>

              {/* Last Seen Location */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Last Known Location</label>
                <input
                  type="text"
                  value={newFormData.lastSeen}
                  onChange={(e) => setNewFormData({ ...newFormData, lastSeen: e.target.value })}
                  placeholder="e.g. Zone 2 Highway Checkpoint"
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-2 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-colors shadow-md flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{isRegistering ? "Detecting Face & Extracting ResNet Descriptor..." : "Save Criminal Profile & Arm Watchlist"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center space-x-3 text-red-600 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Delete Custom Profile?</h3>
                <p className="text-[11px] text-gray-500 font-mono">{profileToDelete.id}</p>
              </div>
            </div>

            <div className="text-xs text-gray-700 space-y-1">
              <p>Are you sure you want to delete profile <strong className="text-gray-900">{profileToDelete.name}</strong>?</p>
              <p className="text-gray-500 text-[11px]">This will permanently remove this record and its 128-D face recognition embedding from the watchlist database.</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setProfileToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 7-FIELD REAL-TIME CRIMINAL DETECTION SCREEN ALERT MODAL OVERLAY */}
      {screenDetectionAlert && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-text">
          <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-red-500/90 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(239,68,68,0.6)] space-y-5 text-white overflow-hidden">
            {/* Top Glowing Siren Header */}
            <div className="flex items-center justify-between border-b border-red-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg border border-red-400/40 animate-pulse">
                  <ShieldAlert className="w-7 h-7 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-red-500 tracking-wide uppercase flex items-center gap-2">
                    <span>🚨 CRIMINAL MATCH DETECTED</span>
                  </h2>
                  <p className="text-xs text-gray-300 font-mono">
                    Real-Time Biometric Facial Recognition • {screenDetectionAlert.time}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreenDetectionAlert(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Suspect Photograph & Key Badge Row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-red-900/70 shadow-inner">
              <img
                src={screenDetectionAlert.photoUrl || screenDetectionAlert.target?.photoUrl || screenDetectionAlert.target?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={screenDetectionAlert.name || 'Suspect'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                }}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-red-600 shadow-2xl flex-shrink-0"
              />
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-black text-white">{screenDetectionAlert.name}</h3>
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                    {screenDetectionAlert.riskLevel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                    ID: {screenDetectionAlert.id}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold">
                    Match Confidence: {screenDetectionAlert.confidence}
                  </span>
                </div>

                <p className="text-xs text-gray-300 line-clamp-2">
                  <strong className="text-gray-400 font-semibold">Crime Description: </strong>
                  {screenDetectionAlert.crimeDetails}
                </p>
              </div>
            </div>

            {/* Strictly Display All 7 Real-Time Fields */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">1. Suspect Full Name</span>
                  <span className="text-white font-bold text-sm">{screenDetectionAlert.name}</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">2. Threat Risk Level</span>
                  <span className="text-red-400 font-bold text-sm">{screenDetectionAlert.riskLevel}</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">3. Crime Record / Summary</span>
                  <span className="text-gray-200 font-semibold text-xs">{screenDetectionAlert.crimeDetails}</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">4. Age</span>
                  <span className="text-amber-300 font-bold text-sm">{screenDetectionAlert.age} Years</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">5. IPC Penal Charges</span>
                  <span className="text-yellow-400 font-bold text-xs">{screenDetectionAlert.ipcCharges}</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-gray-400 font-medium block text-[11px]">6. Live Location & GPS</span>
                  <span className="text-sky-400 font-bold text-xs">
                    {screenDetectionAlert.cameraNode} ({screenDetectionAlert.lat}, {screenDetectionAlert.lng})
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-gray-400 font-medium text-[11px]">7. Criminal Photograph</span>
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Photo Attached</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await authFetch(`${getApiBaseUrl()}/api/criminal/dispatch-alert`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        criminal_id: screenDetectionAlert.id,
                        criminal_name: screenDetectionAlert.name,
                        photo_url: screenDetectionAlert.photoUrl,
                        risk_level: screenDetectionAlert.riskLevel,
                        crime_details: screenDetectionAlert.crimeDetails,
                        ipc_charges: screenDetectionAlert.ipcCharges,
                        age: screenDetectionAlert.age,
                        cam_id: scanTab === 'cctv' ? (selectedCctvId || 'WEB-Cam01') : 'WEB-Cam01',
                        location: screenDetectionAlert.cameraNode,
                        lat: screenDetectionAlert.lat,
                        lng: screenDetectionAlert.lng,
                        force: true
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const stationName = data.nearest_police_station?.police_station_name || 'Station HQ';
                      const emails = data.dispatched_officers || data.nearest_police_station?.officer_emails || [];
                      showToast("🚨 Alert Dispatched", `Email Alert Sent to ${emails.join(', ') || 'Registered Officers'} (${stationName})`, "success");
                    } else {
                      showToast("Alert Dispatch Warning", "Could not complete alert dispatch.", "error");
                    }
                  } catch (e) {
                    console.error("Re-trigger alert error:", e);
                    showToast("Alert Dispatch Error", "Failed to dispatch email alert.", "error");
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Re-Trigger Email & Alert Dispatch</span>
              </button>

              <a
                href={`https://www.google.com/maps?q=${screenDetectionAlert.lat},${screenDetectionAlert.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Open Live Map</span>
              </a>

              <button
                type="button"
                onClick={() => setScreenDetectionAlert(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
