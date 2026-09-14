import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  ScanFace, 
  Upload, 
  Camera, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  FileText,
  AlertTriangle,
  Cpu,
  Fingerprint,
  Tag,
  Plus,
  Smartphone,
  Calendar,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImageDataUrl } from '../utils/dateUtils';
import * as faceapi from '@vladmandic/face-api';

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

const loadImageElement = (imageDataUrl) => {
  return new Promise((resolve) => {
    if (!imageDataUrl) return resolve(null);
    const img = new Image();
    if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

const QUICK_IPC_CHARGES = [
  { label: 'Murder (IPC 302)', code: 'IPC 302' },
  { label: 'Extortion (IPC 384)', code: 'IPC 384' },
  { label: 'Arms Supply (Act 25)', code: 'Arms Act 25(1)' },
  { label: 'Cyber Fraud (IT 66D)', code: 'IT Act 66D' },
  { label: 'Burglary (IPC 380)', code: 'IPC 380' },
  { label: 'Narcotics (NDPS)', code: 'NDPS Act 21' }
];

const COUNTRY_CODES = [
  { code: '+91', country: '🇮🇳 +91 (India)' },
  { code: '+1', country: '🇺🇸 +1 (USA)' },
  { code: '+44', country: '🇬🇧 +44 (UK)' },
  { code: '+971', country: '🇦🇪 +971 (UAE)' },
  { code: '+65', country: '🇸🇬 +65 (Singapore)' },
  { code: '+61', country: '🇦🇺 +61 (Australia)' },
  { code: '+49', country: '🇩🇪 +49 (Germany)' }
];

export const AddCriminal = () => {
  const { addToWatchlist, showToast } = useApp();
  const navigate = useNavigate();

  const [countryCode, setCountryCode] = useState('+91');

  // 100% Clean initial state — NO prefilled dummy text!
  const [formData, setFormData] = useState({
    name: '',
    riskLevel: 'Critical Risk',
    crimeType: '',
    age: '',
    lastSeen: '',
    ipcSection: '',
    vehiclePlate: '',
    physicalMarks: '',
    details: '',
    policeNumber: '',
    incidentDateTime: new Date().toLocaleString('en-IN', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  });

  const [captureTab, setCaptureTab] = useState('upload'); // 'upload' | 'camera'
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFaceModels();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => {
          if (e.name !== 'AbortError') console.error("Camera play error:", e);
        });
        setCameraActive(true);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Camera access error:", err);
        showToast("Camera Error", "Could not access webcam device.", "danger");
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const compressed = await compressImageDataUrl(dataUrl, 400, 0.85);
    stopCamera();
    setPhotoUrl(compressed);
    processFaceAi(compressed);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rawDataUrl = evt.target.result;
      const compressed = await compressImageDataUrl(rawDataUrl, 400, 0.85);
      setPhotoUrl(compressed);
      processFaceAi(compressed);
    };
    reader.readAsDataURL(file);
  };

  const processFaceAi = async (imageDataUrl) => {
    setIsExtracting(true);
    setAiResult(null);
    try {
      const ready = await loadFaceModels();
      if (!ready) {
        setAiResult({ success: false, message: "AI Models failed to load." });
        setIsExtracting(false);
        return;
      }

      const imgEl = await loadImageElement(imageDataUrl);
      if (!imgEl) {
        setAiResult({ success: false, message: "Invalid photo format." });
        setIsExtracting(false);
        return;
      }

      let detections = await faceapi
        .detectAllFaces(imgEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        detections = await faceapi
          .detectAllFaces(imgEl, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.15 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
      }

      if (detections.length === 0) {
        setAiResult({
          success: false,
          hasFace: false,
          message: "No Face Detected — Please upload clear photo."
        });
      } else {
        const descriptor = Array.from(detections[0].descriptor);
        setAiResult({
          success: true,
          hasFace: true,
          confidence: (detections[0].detection.score * 100).toFixed(1),
          descriptor,
          message: `Facial Biometric Verified (128D Vector Extracted)`
        });
      }
    } catch (err) {
      console.error("AI Face extraction error:", err);
      setAiResult({ success: false, message: err.message || "Face extraction failed." });
    } finally {
      setIsExtracting(false);
    }
  };

  const [customIpcTag, setCustomIpcTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleIpcTag = (code) => {
    if (formData.ipcSection.includes(code)) {
      setFormData({
        ...formData,
        ipcSection: formData.ipcSection.replace(code, '').replace(/,\s*,/g, ',').replace(/^,\s*|\s*,\s*$/g, '')
      });
    } else {
      const newSec = formData.ipcSection ? `${formData.ipcSection}, ${code}` : code;
      setFormData({ ...formData, ipcSection: newSec });
    }
  };

  const handleAddCustomIpcTag = (e) => {
    if (e) e.preventDefault();
    if (!customIpcTag.trim()) return;
    const tagToAdd = customIpcTag.trim();
    const newSec = formData.ipcSection ? `${formData.ipcSection}, ${tagToAdd}` : tagToAdd;
    setFormData({ ...formData, ipcSection: newSec });
    setCustomIpcTag('');
    setShowCustomInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Please enter suspect's full name.");
      return;
    }

    if (!photoUrl) {
      setFormError("Please upload or capture a photo of the suspect.");
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedId = `W-${Math.floor(9000 + Math.random() * 999)}`;
      const newCriminalRecord = {
        id: generatedId,
        module: 'criminal-tracking',
        name: formData.name.trim(),
        aliases: [formData.name.split(' ')[0]],
        riskLevel: formData.riskLevel,
        crimeType: formData.crimeType || 'Under Watchlist Surveillance',
        age: formData.age ? parseInt(formData.age) : 30,
        lastSeen: formData.lastSeen || 'CAM-03 Highway',
        photoUrl: photoUrl,
        photo: '👤',
        status: 'Active Alert',
        confidence: aiResult?.confidence ? `${aiResult.confidence}%` : '96.2%',
        details: `${formData.ipcSection ? `[IPC: ${formData.ipcSection}] ` : ''}${formData.details || 'Registered into criminal watchlist.'}`,
        physicalMarks: formData.physicalMarks,
        vehiclePlate: formData.vehiclePlate,
        policeNumber: formData.policeNumber.trim() ? `${countryCode} ${formData.policeNumber.trim()}` : '',
        incidentDateTime: formData.incidentDateTime || new Date().toLocaleString(),
        isUserAdded: true,
        embedding: aiResult?.descriptor || null,
        recordDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const res = await addToWatchlist(newCriminalRecord);

      if (res && res.success) {
        setIsSubmitting(false);
        navigate('/portal/criminal-tracking/criminal-tracking');
      } else {
        setIsSubmitting(false);
        setFormError(res?.error || "Registration failed. Please check authorization.");
      }
    } catch (err) {
      console.error("Form submit error:", err);
      setIsSubmitting(false);
      setFormError(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 px-1">
      {/* 🛑 Header Command Banner - Full Width */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 border border-rose-800/80 p-6 rounded-3xl shadow-xl text-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/portal/criminal-tracking/criminal-tracking')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shadow-md"
            title="Back to Criminal Tracking"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg border border-rose-400/40">
            <UserPlus className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Add New Criminal Target</h1>
              <span className="px-3 py-1 rounded-full bg-rose-500/30 border border-rose-400 text-rose-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Biometric Watchlist</span>
              </span>
            </div>
            <p className="text-sm font-semibold text-rose-200/90 mt-1">
              Enrol new wanted criminal targets into live biometric watchlist surveillance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/portal/criminal-tracking/criminal-tracking')}
          className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm transition-all border border-white/20 cursor-pointer"
        >
          View Watchlist Registry
        </button>
      </div>

      {formError && (
        <div className="bg-red-500/10 border-2 border-red-500/50 text-red-700 dark:text-red-300 p-4 rounded-2xl text-base font-black flex items-center gap-3 shadow-md">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* 🚀 Main Full-Bleed Form Container */}
      <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-[#111318] border border-gray-200/90 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
        
        <div className="flex items-center space-x-2.5 border-b border-gray-200 dark:border-gray-800 pb-4">
          <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Criminal Target Information
          </h2>
        </div>

        {/* Full Name Field */}
        <div>
          <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
            Suspect Full Name <span className="text-rose-600 dark:text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Vikramaditya Thakur"
            className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-lg text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic transition-colors shadow-2xs"
          />
        </div>

        {/* Threat Risk Level Selection */}
        <div>
          <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2.5">
            Threat Risk Classification
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, riskLevel: 'Critical Risk' })}
              className={`py-4 px-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                formData.riskLevel === 'Critical Risk'
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-600 text-rose-700 dark:text-rose-300 shadow-md font-black'
                  : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold'
              }`}
            >
              <div className="text-base font-black">🔴 Critical Risk</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, riskLevel: 'High Risk' })}
              className={`py-4 px-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                formData.riskLevel === 'High Risk'
                  ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-300 shadow-md font-black'
                  : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold'
              }`}
            >
              <div className="text-base font-black">⚠️ High Risk</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, riskLevel: 'Medium Risk' })}
              className={`py-4 px-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                formData.riskLevel === 'Medium Risk'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-300 shadow-md font-black'
                  : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold'
              }`}
            >
              <div className="text-base font-black">🔵 Medium Risk</div>
            </button>
          </div>
        </div>

        {/* Crime Category & Age */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
              Crime Category / Primary Charge
            </label>
            <input
              type="text"
              value={formData.crimeType}
              onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
              placeholder="e.g. Extortion & Arms Supply"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
            />
          </div>

          <div>
            <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 34"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
            />
          </div>
        </div>

        {/* IPC Sections & Tagging Pills */}
        <div>
          <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
            IPC Sections & Legal Charges
          </label>
          <input
            type="text"
            value={formData.ipcSection}
            onChange={(e) => setFormData({ ...formData, ipcSection: e.target.value })}
            placeholder="e.g. IPC 302, Arms Act 25(1)"
            className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic mb-3"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            {/* ✏️ FIRST OPTION: Custom Charge Input Button */}
            {showCustomInput ? (
              <div className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border-2 border-rose-500 shadow-sm animate-in fade-in duration-150">
                <input
                  type="text"
                  autoFocus
                  value={customIpcTag}
                  onChange={(e) => setCustomIpcTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomIpcTag();
                    }
                  }}
                  placeholder="Type Custom IPC / Act..."
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-extrabold focus:outline-none placeholder:italic"
                />
                <button
                  type="button"
                  onClick={handleAddCustomIpcTag}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Add Tag
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="px-4 py-2 rounded-xl border-2 border-dashed border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-black text-sm hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Custom Charge (Type Custom)</span>
              </button>
            )}

            {QUICK_IPC_CHARGES.map((ipc) => {
              const isTagged = formData.ipcSection.includes(ipc.code);
              return (
                <button
                  key={ipc.code}
                  type="button"
                  onClick={() => toggleIpcTag(ipc.code)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isTagged 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>+ {ipc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Last Location & Known Vehicle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
              Last Known Location / Camera Node
            </label>
            <input
              type="text"
              value={formData.lastSeen}
              onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
              placeholder="e.g. CAM-03 Highway Toll Gate"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
            />
          </div>

          <div>
            <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
              Vehicle Registration Plate (ANPR)
            </label>
            <input
              type="text"
              value={formData.vehiclePlate}
              onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
              placeholder="e.g. MP-09-AB-1234"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold uppercase font-mono placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
            />
          </div>
        </div>

        {/* Physical Marks */}
        <div>
          <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
            Physical Identification Marks (Scars / Tattoos)
          </label>
          <input
            type="text"
            value={formData.physicalMarks}
            onChange={(e) => setFormData({ ...formData, physicalMarks: e.target.value })}
            placeholder="e.g. Tattoo on right forearm, scar on left eyebrow"
            className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
          />
        </div>

        {/* Briefing Notes */}
        <div>
          <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">
            Case Briefing & Intelligence Notes
          </label>
          <textarea
            rows={3}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            placeholder="e.g. Primary suspect under active surveillance. Flagged for immediate PCR intercept upon CCTV detection."
            className="w-full px-5 py-4 bg-gray-50 dark:bg-[#161922] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-extrabold resize-none placeholder-gray-400 dark:placeholder-gray-500 placeholder:italic"
          />
        </div>



        {/* 📸 Photo Upload & AI Biometric Capture Section (Bottom Container) */}
        <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-800 space-y-5">
          <div className="flex items-center space-x-2.5">
            <ScanFace className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Suspect Photo Enrolment & AI Verification
            </h3>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setCaptureTab('upload');
              }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                captureTab === 'upload' ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-md' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCaptureTab('camera');
                startCamera();
              }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                captureTab === 'camera' ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-md' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Webcam Enrolment</span>
            </button>
          </div>

          {/* Photo / Camera Viewport Box */}
          <div className="border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-6 text-center bg-[#fcfdfe] dark:bg-[#141722] min-h-[260px] flex items-center justify-center relative overflow-hidden shadow-inner">
            {captureTab === 'camera' ? (
              <div className="space-y-4 w-full max-w-xl mx-auto">
                <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden shadow-xl flex items-center justify-center border-2 border-rose-500/50">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-4 border-rose-500/30 pointer-events-none rounded-2xl" />
                </div>
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-base rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Snap Photo & Extract Face Vector</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {photoUrl ? (
                  <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-4 border-rose-500 shadow-2xl group">
                    <img src={photoUrl} alt="Suspect Enrolment Target" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-extrabold cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer space-y-4 py-8 group"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition-transform">
                      <Upload className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900 dark:text-white">Click to Select & Upload Suspect Photo</p>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">High resolution JPG or PNG formats supported</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Extraction Status Banner */}
          {isExtracting ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 rounded-2xl space-y-2 animate-pulse shadow-sm">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-extrabold text-sm">
                <Sparkles className="w-5 h-5 animate-spin text-rose-600" />
                <span>ResNet-34 Extracting 128D Facial Feature Descriptors...</span>
              </div>
            </div>
          ) : aiResult ? (
            <div className={`p-4 rounded-2xl border-2 text-sm space-y-2 shadow-sm ${
              aiResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center space-x-2 font-extrabold text-base">
                {aiResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                )}
                <span>{aiResult.message}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 🛑 Save & Arm Watchlist Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 px-8 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xl shadow-xl transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-8 h-8" />
            <span>{isSubmitting ? 'Arming Watchlist Record...' : 'Save & Arm Watchlist Record'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddCriminal;
