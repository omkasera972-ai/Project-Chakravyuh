import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { jsPDF } from 'jspdf';
import {
  UserCheck,
  Users,
  UserX,
  Clock,
  UserPlus,
  CheckCircle2,
  Search,
  Camera,
  RefreshCw,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Info,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Grid,
  List
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';

let modelsLoaded = false;
let modelLoadingPromise = null;

const FACE_DISTANCE_THRESHOLD = 0.5;
const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000; // 20 hours strict cooldown per person

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
        console.error('AI Face Models loading error:', err);
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

const detectAndExtractFaceDescriptor = async (imageDataUrl) => {
  try {
    const isReady = await loadFaceModels();
    if (!isReady) {
      return { faceCount: 0, hasFace: false, faces: [], descriptor: null, error: 'AI Face Models Failed to Load' };
    }
    const imgElement = await loadImageElement(imageDataUrl);
    if (!imgElement) return { faceCount: 0, hasFace: false, faces: [], descriptor: null };

    let detections = await faceapi
      .detectAllFaces(imgElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2, maxResults: 20 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      detections = await faceapi
        .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
    }

    const faceCount = detections.length;
    if (faceCount === 0) {
      return { faceCount: 0, hasFace: false, faces: [], descriptor: null };
    }

    const faces = detections.map((det, idx) => ({
      index: idx,
      descriptor: Array.from(det.descriptor)
    }));

    return {
      faceCount,
      hasFace: true,
      faces,
      descriptor: faces[0].descriptor
    };
  } catch (err) {
    console.error('Face detection error:', err);
    return { faceCount: 0, hasFace: false, faces: [], descriptor: null, error: err.message };
  }
};

const mapBoxToOverlay = (box, video, wrap) => {
  if (!box || !video || !wrap) return null;
  const videoW = video.videoWidth || 640;
  const videoH = video.videoHeight || 480;
  const displayW = wrap.clientWidth || 1;
  const displayH = wrap.clientHeight || 1;
  const scale = Math.max(displayW / videoW, displayH / videoH);
  const offsetX = (videoW * scale - displayW) / 2;
  const offsetY = (videoH * scale - displayH) / 2;
  return {
    left: box.x * scale - offsetX,
    top: box.y * scale - offsetY,
    width: box.width * scale,
    height: box.height * scale
  };
};

export const Attendance = () => {
  const { personnel = [], markAttendance, setActiveModal, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Present' | 'Absent'
  const rosterSectionRef = useRef(null);

  const scrollToRosterAndFilter = (status) => {
    setStatusFilter(status);
    if (showToast) {
      const label = status === 'All' ? 'All Personnel' : status === 'Present' ? 'Present Members' : 'Absent Members';
      showToast('Locating Roster', `Filtering & locating ${label}`, 'info');
    }
    if (rosterSectionRef.current) {
      rosterSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Real-time Date & Clock States
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('roster'); // 'roster' (single date) | 'matrix' (har date ka column alag)

  const [isModelsReady, setIsModelsReady] = useState(modelsLoaded);
  const [modelLoadError, setModelLoadError] = useState(null);

  const videoRef = useRef(null);
  const overlayWrapRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamStatus, setWebcamStatus] = useState('Camera initializing...');
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [attendanceSuccessModal, setAttendanceSuccessModal] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const referenceEmbeddingsRef = useRef({});
  const lastMarkedTimesRef = useRef({});
  const isProcessingRef = useRef(false);
  const personnelRef = useRef(personnel);
  const markAttendanceRef = useRef(markAttendance);
  const popupOpenRef = useRef(false);
  const popupQueueRef = useRef([]);

  // Live ticking real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    personnelRef.current = personnel;
  }, [personnel]);

  useEffect(() => {
    markAttendanceRef.current = markAttendance;
  }, [markAttendance]);

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
          setModelLoadError('AI Face Models Failed to Load');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsModelsReady(false);
        setModelLoadError('AI Face Models Failed to Load');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Pre-load and cache face embeddings ONLY when camera scanner is active, using non-blocking lazy queue
  useEffect(() => {
    if (!isModelsReady || !isWebcamActive || !personnel || personnel.length === 0) return;
    let isCancelled = false;

    const processLazyEmbeddings = async () => {
      for (const member of personnel) {
        if (isCancelled) break;
        if (member && member.id && !referenceEmbeddingsRef.current[member.id] && member.photoUrl) {
          try {
            const res = await detectAndExtractFaceDescriptor(member.photoUrl);
            if (res.hasFace && res.descriptor) {
              referenceEmbeddingsRef.current[member.id] = res.descriptor;
            }
          } catch (err) {}
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };

    processLazyEmbeddings();

    return () => {
      isCancelled = true;
    };
  }, [isModelsReady, isWebcamActive, personnel]);

  const startWebcam = async () => {
    try {
      setWebcamStatus('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
      setWebcamStatus('Auto-detect on');
    } catch (err) {
      console.warn('Webcam permission denied or unavailable:', err);
      setWebcamStatus('Camera permission needed');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setWebcamStatus('Camera off');
    setDetectedFaces([]);
  };

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, []);

  const showAttendancePopup = (data) => {
    if (popupOpenRef.current) {
      popupQueueRef.current.push(data);
      return;
    }
    popupOpenRef.current = true;
    setAttendanceSuccessModal(data);
    setTimeout(() => {
      setAttendanceSuccessModal(null);
      popupOpenRef.current = false;
      const next = popupQueueRef.current.shift();
      if (next) showAttendancePopup(next);
    }, 2800);
  };

  useEffect(() => {
    let intervalId = null;

    if (isWebcamActive && isModelsReady) {
      intervalId = setInterval(async () => {
        if (isProcessingRef.current) return;
        const video = videoRef.current;
        if (!video || video.paused || video.ended || video.readyState < 2) return;

        isProcessingRef.current = true;
        try {
          let detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25, maxResults: 12 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length === 0) {
            detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }))
              .withFaceLandmarks()
              .withFaceDescriptors();
          }

          if (detections.length === 0) {
            setDetectedFaces([]);
            setWebcamStatus('Looking for faces...');
            return;
          }

          const roster = personnelRef.current || [];
          const candidates = [];

          for (let i = 0; i < detections.length; i += 1) {
            const det = detections[i];
            const liveDescriptor = det.descriptor;

            for (const member of roster) {
              let refEmbedding = referenceEmbeddingsRef.current[member.id];
              if (!refEmbedding && member.photoUrl) {
                const res = await detectAndExtractFaceDescriptor(member.photoUrl);
                if (res.hasFace && res.descriptor) {
                  refEmbedding = res.descriptor;
                  referenceEmbeddingsRef.current[member.id] = res.descriptor;
                }
              }
              if (!refEmbedding) continue;
              const dist = faceapi.euclideanDistance(liveDescriptor, new Float32Array(refEmbedding));
              candidates.push({ faceIndex: i, member, dist, box: det.detection.box });
            }
          }

          candidates.sort((a, b) => a.dist - b.dist);
          const usedFaces = new Set();
          const usedMembers = new Set();
          const matchByFace = {};

          for (const c of candidates) {
            if (c.dist > FACE_DISTANCE_THRESHOLD) continue;
            if (usedFaces.has(c.faceIndex) || usedMembers.has(c.member.id)) continue;
            usedFaces.add(c.faceIndex);
            usedMembers.add(c.member.id);
            matchByFace[c.faceIndex] = c;
          }

          const wrap = overlayWrapRef.current;
          const evaluatedFaces = detections.map((det, idx) => {
            const match = matchByFace[idx];
            const mapped = mapBoxToOverlay(det.detection.box, video, wrap);
            return {
              mapped,
              isMatched: Boolean(match),
              member: match?.member || null
            };
          });

          setDetectedFaces(evaluatedFaces);
          const matchedCount = evaluatedFaces.filter((f) => f.isMatched).length;
          setWebcamStatus(
            `${detections.length} face${detections.length > 1 ? 's' : ''} · ${matchedCount} matched`
          );

          const now = Date.now();
          const liveTimeNowStr = new Date().toLocaleTimeString('en-US', { hour12: true });

          for (const match of Object.values(matchByFace)) {
            const member = match.member;
            
            const todayRecord = member.attendanceHistory?.[todayStr];
            const isAlreadyPresentToday = (todayRecord && (todayRecord.status === 'Present' || todayRecord.status === 'Late')) || member.status === 'Present';

            const lastMarked = Math.max(
              lastMarkedTimesRef.current[member.id] || 0,
              member.lastMarkedAt || 0
            );

            // 20-Hour Cooldown & 1-Attendance-Per-Day Lock
            if (isAlreadyPresentToday || (lastMarked > 0 && (now - lastMarked < TWENTY_HOURS_MS))) {
              continue;
            }

            lastMarkedTimesRef.current[member.id] = now;

            markAttendanceRef.current(member.id, 'Present', { silent: true, date: todayStr, time: liveTimeNowStr });
            showAttendancePopup({
              officer: member,
              time: liveTimeNowStr
            });
          }
        } catch (err) {
          console.warn('Webcam detection warning:', err);
        } finally {
          isProcessingRef.current = false;
        }
      }, 450);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isWebcamActive, isModelsReady]);

  const renderFaceOverlayBoxes = () => {
    if (!detectedFaces || detectedFaces.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {detectedFaces.map((face, idx) => {
          if (!face.mapped) return null;
          const { left, top, width, height } = face.mapped;
          const isMatch = face.isMatched;
          const member = face.member;
          const todayRecord = member?.attendanceHistory?.[todayStr];
          const isAlreadyPresent = member && (
            (todayRecord && (todayRecord.status === 'Present' || todayRecord.status === 'Late')) ||
            member.status === 'Present'
          );

          let labelText = 'Detected';
          if (isMatch && member) {
            if (isAlreadyPresent) {
              labelText = `${member.name} (Present ✓)`;
            } else {
              labelText = `${member.name} (Matched)`;
            }
          }

          return (
            <div
              key={idx}
              style={{ left, top, width, height }}
              className={`absolute rounded-md border-[3px] ${
                isMatch ? (isAlreadyPresent ? 'border-emerald-500' : 'border-emerald-400') : 'border-yellow-400'
              }`}
            >
              <span
                className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  isMatch
                    ? isAlreadyPresent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 text-black'
                    : 'bg-yellow-400 text-black'
                }`}
              >
                {labelText}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Matrix Scroll & Days Window State
  const matrixScrollRef = useRef(null);
  const [matrixDaysCount, setMatrixDaysCount] = useState(10);
  const [matrixOffset, setMatrixOffset] = useState(0);

  const scrollMatrix = (offset) => {
    if (matrixScrollRef.current) {
      matrixScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Past Days Columns generator for Multi-Date Matrix
  const getDateColumns = (numDays = matrixDaysCount, offset = matrixOffset) => {
    const columns = [];
    const baseDate = new Date(selectedDate);
    baseDate.setDate(baseDate.getDate() + offset);

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const isToday = dStr === todayStr;
      const isSelected = dStr === selectedDate;
      columns.push({
        dateStr: dStr,
        dayName,
        monthDay,
        isToday,
        isSelected,
        fullDate: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
      });
    }
    return columns;
  };

  const dateColumns = getDateColumns(matrixDaysCount, matrixOffset);

  // Helper to fetch exact status & timestamp for a specific student and date
  const getStudentStatusForDate = (student, dateStr) => {
    if (student.attendanceHistory && student.attendanceHistory[dateStr]) {
      return student.attendanceHistory[dateStr];
    }
    if (dateStr === todayStr) {
      const st = student.status || 'Absent';
      return {
        status: st,
        time: student.entryTime || (student.entry && student.entry !== '--' ? student.entry : '--'),
        fullDateTime: student.entry || '--'
      };
    }
    return { status: 'Absent', time: '--', fullDateTime: '--' };
  };

  const getFormattedDateTime = (rec, dateStr) => {
    const isPresentOrLate = rec && (rec.status === 'Present' || rec.status === 'Late');
    if (!isPresentOrLate) {
      return { dateText: null, timeText: null, isCheckedIn: false };
    }

    let dateText = new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    let timeText = '09:15:00 AM';

    if (rec.time && rec.time !== '--' && (rec.time.includes('AM') || rec.time.includes('PM'))) {
      timeText = rec.time;
    } else if (rec.fullDateTime && (rec.fullDateTime.includes('AM') || rec.fullDateTime.includes('PM'))) {
      const parts = rec.fullDateTime.split(',');
      for (let part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('AM') || trimmed.includes('PM')) {
          timeText = trimmed;
          break;
        }
      }
    }

    return { dateText, timeText, isCheckedIn: true };
  };

  // Date Navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToggleDateAttendance = (studentId, dateStr, currentStatus) => {
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    const liveTimeNowStr = new Date().toLocaleTimeString('en-US', { hour12: true });
    markAttendance(studentId, nextStatus, { date: dateStr, time: liveTimeNowStr });
  };

  const filtered = personnel.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    const isPresent = rec.status === 'Present';
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || p.department === deptFilter;
    return isPresent && matchesSearch && matchesDept;
  });

  const total = personnel.length;
  
  // Date-aware stats for selectedDate
  const presentForSelectedDate = personnel.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    return rec.status === 'Present';
  }).length;

  const absentForSelectedDate = personnel.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    return rec.status === 'Absent' || rec.status === 'Registered';
  }).length;

  const lateForSelectedDate = personnel.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    return rec.status === 'Late';
  }).length;

  const departments = [
    'All',
    'Computer Science',
    'Cyber Security',
    'Operations',
    'Field Intelligence',
    'Tactical Command',
    'Surveillance Ops',
    'Administration',
    'Logistics'
  ];

  const handleDownloadAttendanceReport = (format = 'pdf') => {
    const timeNow = new Date().toLocaleString();
    const selectedDateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    if (format === 'csv') {
      let csvContent = 'ID,NAME,ROLE,DEPARTMENT,CHECKIN_DATE_TIME,STATUS,BADGE_ID\n';
      personnel.forEach(p => {
        const rec = getStudentStatusForDate(p, selectedDate);
        csvContent += `"${p.id}","${p.name}","${p.role || 'Member'}","${p.department}","${rec.fullDateTime || '--'}","${rec.status}","${p.badgeId || '--'}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ATTENDANCE_REPORT_${selectedDate}.csv`;
      link.click();
      URL.revokeObjectURL(link);
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFillColor(6, 78, 59);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PROJECT CHAKRAVYUH - REAL-TIME ATTENDANCE REPORT', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(167, 243, 208);
      doc.text(`AUTOMATIC AI BIOMETRIC AUDIT DOSSIER (${selectedDateFormatted})`, 14, 25);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.text(`Generated: ${timeNow} | Total Records: ${personnel.length}`, 14, 32);

      doc.setFillColor(240, 253, 244);
      doc.rect(14, 45, 182, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Enrolled: ${personnel.length}`, 20, 58);
      doc.setTextColor(5, 150, 105);
      doc.text(`Present: ${presentForSelectedDate}`, 75, 58);
      doc.setTextColor(220, 38, 38);
      doc.text(`Absent: ${absentForSelectedDate}`, 125, 58);
      doc.setTextColor(217, 119, 6);
      doc.text(`Late: ${lateForSelectedDate}`, 165, 58);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('PERSONNEL ATTENDANCE ROSTER LOG', 14, 78);
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(14, 81, 196, 81);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ID', 14, 88);
      doc.text('NAME', 40, 88);
      doc.text('DEPT', 85, 88);
      doc.text('DATE & TIME', 125, 88);
      doc.text('STATUS', 175, 88);
      doc.line(14, 91, 196, 91);

      doc.setFont('helvetica', 'normal');
      let y = 98;
      personnel.forEach((p) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const rec = getStudentStatusForDate(p, selectedDate);
        doc.text(String(p.id), 14, y);
        doc.text(String(p.name).slice(0, 20), 40, y);
        doc.text(String(p.department).slice(0, 18), 85, y);
        doc.text(String(rec.fullDateTime || '--'), 125, y);
        
        if (rec.status === 'Present') doc.setTextColor(5, 150, 105);
        else if (rec.status === 'Late') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(100, 116, 139);
        
        doc.text(String(rec.status), 175, y);
        doc.setTextColor(15, 23, 42);
        y += 8;
      });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Biometric Audit Log — Project Chakravyuh Command & Control Portal', 14, 285);

      doc.save(`ATTENDANCE_REPORT_${selectedDate}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <div className="space-y-6 select-none pb-8 text-slate-900">
      {/* Top Banner - Clean Crisp White */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shadow-xs">
            <UserCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Attendance Portal</h1>
            <p className="text-sm font-medium text-slate-600 mt-0.5">
              Real-Time AI Contactless Check-in & Roster Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowInfoModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-slate-700" />
            <span>Overview & Impact</span>
          </button>

          <button
            onClick={() => handleDownloadAttendanceReport('pdf')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={() => handleDownloadAttendanceReport('csv')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <span>CSV</span>
          </button>

          <button
            onClick={isWebcamActive ? stopWebcam : startWebcam}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isWebcamActive ? 'text-emerald-600' : ''}`} />
            <span>{isWebcamActive ? 'Restart Camera' : 'Start Webcam'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Clock & Active Date Selector Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Real-Time System Clock & Date Engine
            </div>
            <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} •{' '}
              <span className="text-emerald-300 font-mono">{currentTime.toLocaleTimeString('en-US', { hour12: true })}</span>
            </div>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 p-1.5 rounded-xl flex-wrap">
          <button
            onClick={handlePrevDate}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={handleNextDate}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* 2 Clean Touch Interactive Stat Cards (Enrolled Roster & Verified Present Today) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard
          title="Enrolled Roster"
          value={String(total)}
          subtext="Total Staff & Students Registered"
          icon={Users}
          onClick={() => scrollToRosterAndFilter('All')}
        />
        <StatCard
          title={`Verified Present (${selectedDate === todayStr ? 'Today' : selectedDate})`}
          value={String(presentForSelectedDate)}
          subtext="AI Face Scanner Verified Present Logs Only"
          icon={UserCheck}
          indicatorDot="green"
          onClick={() => scrollToRosterAndFilter('Present')}
        />
      </div>

      {modelLoadError && (
        <p className="text-xs text-amber-600 font-medium">{modelLoadError}. Face matching needs model files in /public/models.</p>
      )}

      {/* Main Grid View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Camera Card */}
        <div className={`${viewMode === 'matrix' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>Live Camera Feeds & AI Face Scanner</span>
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {webcamStatus}
            </span>
          </div>

          <div
            ref={overlayWrapRef}
            className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-950 aspect-video min-h-[300px] flex items-center justify-center shadow-md"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isWebcamActive && renderFaceOverlayBoxes()}
            {!isWebcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white z-10">
                <Camera className="w-12 h-12 text-emerald-400 mb-3 opacity-70" />
                <p className="text-sm font-bold text-slate-200">Webcam Feed Off</p>
                <button
                  onClick={startWebcam}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                >
                  Turn On Live Webcam
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 font-semibold text-center">
            Real-time scanner logs exact check-in date & time dynamically on face match.
          </p>
        </div>

        {/* Personnel Roster & Multi-Date Matrix Card */}
        <div ref={rosterSectionRef} className={`${viewMode === 'matrix' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs scroll-mt-6`}>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
                <span>Verified Present Attendance Roster</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Showing present attendance check-in records for {new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black">
              {filtered.length} Present Members
            </span>
          </div>

          {/* Search & Department Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search present student name / ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-400"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* MODE 1: MULTI-DATE MATRIX VIEW (Har Date Ka Column Alag & Horizontally Scrollable) */}
          {viewMode === 'matrix' ? (
            <div className="space-y-3">
              {/* Date Window Scroll & Range Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Scrollable Date Window:</span>
                  <span className="text-emerald-400 font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {dateColumns[0]?.monthDay} – {dateColumns[dateColumns.length - 1]?.monthDay} ({dateColumns.length} Days)
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Horizontal Table Scroll Buttons */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => scrollMatrix(-220)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Scroll Table Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scroll Left</span>
                    </button>
                    <button
                      onClick={() => scrollMatrix(220)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Scroll Table Right"
                    >
                      <span>Scroll Right</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>

                  {/* Shift 7 Days Back / Ahead Controls */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => setMatrixOffset(prev => prev - 7)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Shift Window 7 Days Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>7 Days Back</span>
                    </button>

                    <button
                      onClick={() => setMatrixOffset(0)}
                      className="px-2 py-1 rounded hover:bg-slate-700 text-emerald-400 font-bold text-[11px] transition-colors cursor-pointer"
                      title="Reset to Today"
                    >
                      Reset
                    </button>

                    <button
                      onClick={() => setMatrixOffset(prev => prev + 7)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Shift Window 7 Days Right"
                    >
                      <span>7 Days Ahead</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Days Count Selector */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase px-1">Columns:</span>
                    {[7, 10, 14, 21, 30].map(count => (
                      <button
                        key={count}
                        onClick={() => setMatrixDaysCount(count)}
                        className={`px-2.5 py-1 rounded font-extrabold text-[11px] transition-all cursor-pointer ${
                          matrixDaysCount === count ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {count}D
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horizontally Scrollable Table Container */}
              <div 
                ref={matrixScrollRef}
                className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs pb-1 custom-scrollbar relative"
              >
                <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-3 min-w-[90px] w-[90px] sticky left-0 z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">ID</th>
                      <th className="py-3.5 px-4 min-w-[170px] w-[170px] sticky left-[90px] z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">Student / Staff Name</th>
                      <th className="py-3.5 px-3 min-w-[130px] w-[130px] sticky left-[260px] z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">Department</th>
                      {dateColumns.map((col) => (
                        <th
                          key={col.dateStr}
                          onClick={() => setSelectedDate(col.dateStr)}
                          className={`py-3 px-2 text-center border-l border-slate-800 min-w-[110px] w-[110px] cursor-pointer transition-colors ${
                            col.isSelected ? 'bg-emerald-700 text-white font-black' : col.isToday ? 'bg-emerald-950 text-emerald-300 font-extrabold' : 'hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[10px] opacity-75 font-semibold">{col.dayName}</div>
                          <div className="text-xs font-bold whitespace-nowrap">{col.monthDay}</div>
                          {col.isToday && <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-400 text-slate-950 uppercase font-black block mt-0.5">Today</span>}
                        </th>
                      ))}
                      <th className="py-3.5 px-3 text-center border-l border-slate-800 min-w-[100px] w-[100px] sticky right-0 z-30 bg-slate-900 shadow-[-2px_0_5px_rgba(0,0,0,0.15)]">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={dateColumns.length + 4} className="py-12 text-center text-slate-500">
                          <UserX className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                          <p className="font-extrabold text-slate-800 text-sm">No Records Registered</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((person) => {
                        let presentDays = 0;
                        dateColumns.forEach((col) => {
                          const rec = getStudentStatusForDate(person, col.dateStr);
                          if (rec.status === 'Present' || rec.status === 'Late') presentDays += 1;
                        });
                        const attRate = Math.round((presentDays / dateColumns.length) * 100);

                        return (
                          <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-3 px-3 font-mono font-extrabold text-slate-900 sticky left-0 z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{person.id}</td>
                            <td className="py-3 px-4 sticky left-[90px] z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                                  {person.photoUrl ? (
                                    <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{person.avatar || '👤'}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 text-xs block leading-tight">{person.name}</span>
                                  <span className="text-[10px] text-slate-500 font-semibold">{person.role || 'Student'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-semibold text-[11px] sticky left-[260px] z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{person.department}</td>
                            {dateColumns.map((col) => {
                              const rec = getStudentStatusForDate(person, col.dateStr);
                              const isP = rec.status === 'Present';
                              const isL = rec.status === 'Late';

                              return (
                                <td
                                  key={col.dateStr}
                                  onClick={() => handleToggleDateAttendance(person.id, col.dateStr, rec.status)}
                                  title={`${person.name} on ${col.fullDate}: ${rec.status} (${rec.fullDateTime || rec.time}) — Click to toggle status`}
                                  className={`py-2.5 px-1.5 text-center border-l border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors min-w-[110px] ${
                                    col.isSelected ? 'bg-emerald-50/40' : ''
                                  }`}
                                >
                                  <div className="flex flex-col items-center justify-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-black text-[10px] tracking-tight inline-flex items-center gap-1 shadow-2xs ${
                                        isP
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                          : isL
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : 'bg-rose-100 text-rose-900 border border-rose-200'
                                      }`}
                                    >
                                      {isP ? 'P' : isL ? 'L' : 'A'}
                                    </span>
                                    <span className="text-[9.5px] font-mono text-slate-700 font-bold mt-0.5 block truncate max-w-[85px]">
                                      {rec.time && rec.time !== '--' ? rec.time : '--'}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-3 px-3 text-center border-l border-slate-100 font-extrabold text-xs min-w-[100px] sticky right-0 z-20 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                attRate >= 75 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}>
                                {attRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MODE 2: SINGLE DATE ROSTER VIEW (With Real-Time Arrival Timestamp Column) */
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Student Photo & Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <UserX className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                        <p className="font-extrabold text-slate-800 text-sm">No Records Registered</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((person) => {
                      const rec = getStudentStatusForDate(person, selectedDate);
                      const isPresent = rec.status === 'Present';
                      const isLate = rec.status === 'Late';

                      return (
                        <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-slate-900 text-sm">{person.id}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                                {person.photoUrl ? (
                                  <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{person.avatar || '👤'}</span>
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 text-base block leading-tight">{person.name}</span>
                                <span className="text-xs text-slate-500 font-semibold block mt-0.5">{person.role || 'Member'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-800 font-extrabold text-sm">{person.department}</td>
                          
                          {/* DATE & TIME COLUMN */}
                          <td className="py-4 px-4 font-mono text-slate-900 font-extrabold text-xs">
                            {(() => {
                              const info = getFormattedDateTime(rec, selectedDate);
                              if (!info.isCheckedIn) {
                                return <span className="text-slate-400 font-semibold italic text-xs">Not Checked In</span>;
                              }
                              return (
                                <div className="space-y-1">
                                  <div className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{info.dateText}</span>
                                  </div>
                                  <div className="text-emerald-600 font-black text-xs flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    <span>{info.timeText}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full font-black text-xs ${
                                isPresent
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : isLate
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleToggleDateAttendance(person.id, selectedDate, rec.status)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                                isPresent
                                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 shadow-xs'
                              }`}
                            >
                              {isPresent ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {attendanceSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl w-full max-w-sm p-6 text-center text-white relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setAttendanceSuccessModal(null);
                popupOpenRef.current = false;
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight">Attendance Marked</h3>
              <p className="text-sm text-emerald-400 font-bold mt-1">{attendanceSuccessModal.officer.name}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: <span className="text-white font-bold">{attendanceSuccessModal.officer.id}</span> · {attendanceSuccessModal.time}
              </p>
            </div>

            {attendanceSuccessModal.officer.photoUrl && (
              <img
                src={attendanceSuccessModal.officer.photoUrl}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-emerald-500/40 shadow-md"
              />
            )}

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => handleDownloadAttendanceReport('pdf')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Attendance PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎓 SMART ATTENDANCE SYSTEM — COMPLETE OVERVIEW BRIEFING MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white relative">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <span className="px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
                    SMART CAMPUS BIOMETRIC BRIEFING
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Real-Time Biometric Attendance & Multi-Date Engine
                </h2>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                The Smart Attendance System provides sub-second facial recognition, multi-face crowd processing, and a complete multi-date matrix system for tracking student attendance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <h4 className="font-bold text-emerald-400 text-base">📅 Multi-Date History Matrix</h4>
                  <p className="text-xs text-slate-400">
                    Displays separate columns for each date. Tracks status (Present, Late, Absent) and exact arrival timestamps.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <h4 className="font-bold text-emerald-400 text-base">⏱️ Real-Time Timestamp Engine</h4>
                  <p className="text-xs text-slate-400">
                    Captures live arrival date and time down to the exact second when AI webcam identifies student faces.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
