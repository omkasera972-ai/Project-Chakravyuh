import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  ScanFace, 
  Upload, 
  Camera, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  FileText,
  Cpu,
  Fingerprint,
  Phone,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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

const COUNTRY_CODES = [
  { code: '+91', country: '🇮🇳 +91 (India)' },
  { code: '+1', country: '🇺🇸 +1 (USA)' },
  { code: '+44', country: '🇬🇧 +44 (UK)' },
  { code: '+971', country: '🇦🇪 +971 (UAE)' },
  { code: '+65', country: '🇸🇬 +65 (Singapore)' }
];

export const AddMissingChild = () => {
  const { addMissingChild, showToast, activeModule } = useApp();
  const navigate = useNavigate();

  const [countryCode, setCountryCode] = useState('+91');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '8',
    gender: 'Male',
    guardianName: '',
    contactNumber: '',
    address: '',
    missingDate: new Date().toISOString().slice(0, 10),
    lastSeenLocation: '',
    description: '',
    identificationMarks: '',
    photoUrl: ''
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
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      showToast("Camera Error", "Could not access webcam device.", "error");
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

  const capturePhotoFromWebcam = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    handleImageSelected(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleImageSelected(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelected = async (dataUrl) => {
    setPhotoUrl(dataUrl);
    setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
    setIsExtracting(true);
    setAiResult(null);

    try {
      const loaded = await loadFaceModels();
      if (!loaded) {
        setAiResult({ success: false, message: 'Could not load AI biometric engine models.' });
        setIsExtracting(false);
        return;
      }

      const img = await loadImageElement(dataUrl);
      if (!img) {
        setAiResult({ success: false, message: 'Invalid image format.' });
        setIsExtracting(false);
        return;
      }

      let detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.15 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
      }

      if (detection) {
        setAiResult({
          success: true,
          descriptor: Array.from(detection.descriptor),
          confidence: (detection.detection.score * 100).toFixed(1)
        });
      } else {
        setAiResult({
          success: false,
          message: 'No clear face detected in image. Please provide a clear front-facing portrait photo.'
        });
      }
    } catch (err) {
      console.error("AI Face extraction error:", err);
      setAiResult({ success: false, message: 'Failed to process AI face vector.' });
    }
    setIsExtracting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter full child/person name.');
      return;
    }
    if (!formData.lastSeenLocation.trim()) {
      setFormError('Please enter last seen location.');
      return;
    }

    setIsSubmitting(true);
    const caseId = `MC-2026-${Math.floor(100 + Math.random() * 900)}`;

    const fullContact = formData.contactNumber 
      ? (formData.contactNumber.startsWith('+') ? formData.contactNumber : `${countryCode} ${formData.contactNumber}`)
      : '+91 9876543210';

    const caseObj = {
      id: caseId,
      name: formData.name.trim(),
      age: parseInt(formData.age) || 8,
      gender: formData.gender,
      guardianName: formData.guardianName.trim() || 'Parent / Guardian',
      contactNumber: fullContact,
      address: formData.address.trim() || 'Central District',
      missingDate: formData.missingDate || new Date().toISOString().slice(0, 10),
      lastSeenLocation: formData.lastSeenLocation.trim(),
      description: formData.description.trim() || 'No description provided.',
      identificationMarks: formData.identificationMarks.trim(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80',
      embedding: aiResult?.success ? aiResult.descriptor : null,
      status: 'Searching',
      lat: 22.7250,
      lng: 75.8650
    };

    const res = await addMissingChild(caseObj);
    setIsSubmitting(false);

    if (res && res.success) {
      showToast('🟢 Missing Child Registered', `${formData.name} added to Missing_children database!`, 'success');
      navigate(`/portal/${activeModule || 'missing-child'}/missing-child`);
    } else {
      setFormError(res?.error || 'Failed to save case to Missing_children database.');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none pb-12 text-gray-900 dark:text-white">
      {/* 🟢 TOP HEADER LANDSCAPE BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl text-white border border-purple-500/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/portal/${activeModule || 'missing-child'}/missing-child`)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
            title="Back to Missing Children Portal"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <Heart className="w-7 h-7 text-purple-400 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Register Missing Child / Person Case</h1>
            </div>
            <p className="text-sm sm:text-base text-purple-200 mt-1 font-medium">
              Official Search & Rescue Entry Form • Saved to <code className="bg-purple-950/80 px-2 py-0.5 rounded font-mono text-purple-300">Missing_children.registered_data</code>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/portal/${activeModule || 'missing-child'}/missing-child`)}
          className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 font-extrabold text-sm flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center"
        >
          <FileText className="w-5 h-5" />
          <span>View Active Search Cases</span>
        </button>
      </div>

      {/* 🟢 FULL PAGE LANDSCAPE MAIN CONTAINER */}
      <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 7 COLUMNS: FORM INPUT FIELDS WITH BIG READABLE FONTS */}
        <div className="lg:col-span-7 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>Personal Identity & Guardian Information</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please enter clear and accurate information for quick biometric identification.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-bold text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Grid Layout for Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {/* Full Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Child / Person Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Samar Verma"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Age (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g. 8"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Father / Guardian Name */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Father / Guardian Full Name
              </label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="e.g. Ramesh Verma"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Emergency Contact Number */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Emergency Contact Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-sm font-extrabold text-gray-900 dark:text-white"
                >
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
                />
              </div>
            </div>

            {/* Last Seen Location / City / Village */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Last Seen Location / City / Village <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastSeenLocation}
                onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                placeholder="e.g. Vijay Nagar Square, Indore or Palia Village, Ujjain"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Residential Address & Missing Date */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. House No. 42, Scheme 54, Indore"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Missing Date
              </label>
              <input
                type="date"
                value={formData.missingDate}
                onChange={(e) => setFormData({ ...formData, missingDate: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Description & Clothing Details */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Clothing & Appearance Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Wearing red cotton t-shirt, dark blue jeans, carrying yellow school bag..."
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none shadow-xs"
              />
            </div>

            {/* Identification Marks */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-200">
                Physical Identification Marks / Distinguishing Features
              </label>
              <input
                type="text"
                value={formData.identificationMarks}
                onChange={(e) => setFormData({ ...formData, identificationMarks: e.target.value })}
                placeholder="e.g. Birthmark on left wrist, scar on forehead..."
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#171a24] border border-gray-300 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: LANDSCAPE PHOTO CAPTURE & AI BIOMETRIC EMBEDDING CARD */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ScanFace className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>Portrait Photo & AI Biometrics</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload photo or capture live webcam portrait to generate 128D AI face vector.
            </p>
          </div>

          {/* Capture Tab Switcher */}
          <div className="flex bg-gray-100 dark:bg-[#171a24] p-1.5 rounded-2xl border border-gray-300 dark:border-gray-700 text-sm font-extrabold">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setCaptureTab('upload');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                captureTab === 'upload' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCaptureTab('camera');
                startCamera();
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                captureTab === 'camera' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Webcam</span>
            </button>
          </div>

          {/* Photo Display Screen */}
          <div className="relative rounded-3xl border-2 border-dashed border-purple-400/60 bg-gray-50 dark:bg-[#151822] min-h-[320px] flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
            {captureTab === 'upload' ? (
              photoUrl ? (
                <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-purple-500/40 group">
                  <img src={photoUrl} alt="Selected Child" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      setFormData(prev => ({ ...prev, photoUrl: '' }));
                      setAiResult(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-500 transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center space-y-3 cursor-pointer p-6 hover:opacity-80 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto shadow-md">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Click to Upload Portrait Photo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports JPG, PNG, WEBP files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )
            ) : (
              <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive ? (
                  <div className="text-center p-4 space-y-3">
                    <Camera className="w-10 h-10 text-purple-400 mx-auto" />
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                    >
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={capturePhotoFromWebcam}
                    className="absolute bottom-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Snapshot</span>
                  </button>
                )}
              </div>
            )}

            {/* AI Vector Extraction Status Badge */}
            {isExtracting && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                <Cpu className="w-10 h-10 text-purple-400 animate-spin" />
                <span className="text-sm font-extrabold tracking-wider">Extracting 128D Face Vector Mesh...</span>
              </div>
            )}
          </div>

          {/* AI Result Feedback Box */}
          {aiResult && (
            <div className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${
              aiResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
            }`}>
              <div className="flex items-center gap-2 text-sm font-extrabold">
                {aiResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span>{aiResult.success ? 'Biometric Face Mesh Generated' : 'AI Biometric Notice'}</span>
              </div>
              <p className="pl-7 font-mono">
                {aiResult.success 
                  ? `Precision Confidence: ${aiResult.confidence}% • 128D Embeddings Ready` 
                  : aiResult.message
                }
              </p>
            </div>
          )}

          {/* Submit Registration Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Heart className="w-6 h-6 fill-white" />
            <span>{isSubmitting ? 'Saving Case to Database...' : 'Register Case & Activate Search'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddMissingChild;
