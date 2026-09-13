import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  GraduationCap,
  Briefcase,
  Crown,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  ChevronDown,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  CalendarDays
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';

// Helper to convert image URL/Data URL to Base64 for jsPDF
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (typeof url === 'string' && url.startsWith('data:image')) return resolve(url);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 150;
        canvas.height = img.height || 150;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataURL);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const StudentInformation = () => {
  const { personnel = [], markAttendance } = useApp();
  const [activeTab, setActiveTab] = useState('students');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  // Real-time Date & 12-Hour Clock State
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('roster'); // 'roster' (single date) | 'matrix' (har date ka column alag)

  // Live ticking 12-hour clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCategory = (p) => {
    if (p.category) return p.category;
    const r = (p.role || '').toLowerCase();
    if (r.includes('dean') || r.includes('director') || r.includes('hod') || r.includes('officer')) {
      return 'leadership';
    }
    if (r.includes('teacher') || r.includes('professor') || r.includes('faculty')) {
      return 'faculties';
    }
    return 'students';
  };

  // Helper to resolve student status & 12-hour timestamp for any date
  const getStudentStatusForDate = (student, dateStr) => {
    if (student.attendanceHistory && student.attendanceHistory[dateStr]) {
      const rec = student.attendanceHistory[dateStr];
      return {
        status: rec.status,
        time: rec.time,
        fullDateTime: rec.fullDateTime
      };
    }
    if (dateStr === todayStr) {
      const st = (student.status && student.status !== 'Absent') ? student.status : (student.todayStatus || student.status || 'Absent');
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

  // Date Navigation Handlers
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

  // Matrix Scroll & Days Window State
  const matrixScrollRef = useRef(null);
  const [matrixDaysCount, setMatrixDaysCount] = useState(10);
  const [matrixOffset, setMatrixOffset] = useState(0);

  const scrollMatrix = (offset) => {
    if (matrixScrollRef.current) {
      matrixScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Date Columns Generator for Multi-Date Matrix
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

  const handleToggleDateAttendance = (personId, dateStr, currentStatus) => {
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    const liveTime12Hr = new Date().toLocaleTimeString('en-US', { hour12: true });
    markAttendance(personId, nextStatus, { date: dateStr, time: liveTime12Hr });
  };

  const categoryFiltered = personnel.filter((p) => {
    const pCategory = getCategory(p);
    return activeTab === 'all' || pCategory === activeTab;
  });

  const filteredList = categoryFiltered.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    const pStatus = (rec.status || 'Absent').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'present' && pStatus === 'present') ||
      (statusFilter === 'absent' && (pStatus === 'absent' || pStatus === 'registered')) ||
      (statusFilter === 'late' && pStatus === 'late');

    const nameStr = String(p.name || '').toLowerCase();
    const idStr = String(p.id || '').toLowerCase();
    const deptStr = String(p.department || '').toLowerCase();
    const q = (searchTerm || '').toLowerCase();

    const matchesSearch = nameStr.includes(q) || idStr.includes(q) || deptStr.includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalInTab = categoryFiltered.length;
  const presentCount = categoryFiltered.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    return (rec.status || '').toLowerCase() === 'present';
  }).length;

  const absentCount = categoryFiltered.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    const st = (rec.status || '').toLowerCase();
    return st === 'absent' || st === 'registered' || st === '';
  }).length;

  const lateCount = categoryFiltered.filter((p) => {
    const rec = getStudentStatusForDate(p, selectedDate);
    return (rec.status || '').toLowerCase() === 'late';
  }).length;

  // --- PDF Export 1: Summarized Executive Overview PDF ---
  const handleDownloadSummaryPDF = async () => {
    setIsGeneratingPdf(true);
    setShowPdfMenu(false);
    try {
      const doc = new jsPDF();
      const timeNow12Hr = new Date().toLocaleString('en-US', { hour12: true });

      const students = personnel.filter(p => getCategory(p) === 'students');
      const faculties = personnel.filter(p => getCategory(p) === 'faculties');
      const leadership = personnel.filter(p => getCategory(p) === 'leadership');

      const getPresentCount = (list) => list.filter(p => {
        const rec = getStudentStatusForDate(p, selectedDate);
        return (rec.status || '').toLowerCase() === 'present';
      }).length;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('PROJECT CHAKRAVYUH — EXECUTIVE INSTITUTIONAL SUMMARY REPORT', 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${timeNow12Hr}  |  Date: ${selectedDate}  |  Total Records: ${personnel.length}`, 14, 28);

      // Section 1: Key Telemetry Metrics Cards
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 46, 182, 34, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 46, 182, 34, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('INSTITUTIONAL OVERVIEW STATS (12-HOUR TIMESTAMP SYSTEM)', 20, 56);

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Total Students: ${students.length} (Present: ${getPresentCount(students)})`, 20, 66);
      doc.text(`Total Faculties: ${faculties.length} (Present: ${getPresentCount(faculties)})`, 20, 73);
      doc.text(`Executive Deans / HODs: ${leadership.length} (Present: ${getPresentCount(leadership)})`, 105, 66);
      doc.text(`Overall Attendance Rate: ${personnel.length > 0 ? Math.round((personnel.filter(p => (getStudentStatusForDate(p, selectedDate).status || '').toLowerCase() === 'present').length / personnel.length) * 100) : 0}%`, 105, 73);

      // Section 2: Detailed Category Summaries with Member Photos
      let y = 92;
      const categoriesToSummary = [
        { name: 'STUDENTS SUMMARY & TOP RECORD', items: students },
        { name: 'FACULTIES SUMMARY & STAFF RECORD', items: faculties },
        { name: 'EXECUTIVE DEANS & LEADERSHIP RECORD', items: leadership }
      ];

      for (const cat of categoriesToSummary) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(cat.name, 14, y);
        doc.line(14, y + 2, 196, y + 2);
        y += 8;

        if (cat.items.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('No registered personnel in this category.', 14, y);
          y += 10;
          continue;
        }

        for (let i = 0; i < Math.min(cat.items.length, 3); i += 1) {
          const item = cat.items[i];
          const rec = getStudentStatusForDate(item, selectedDate);

          if (item.photoUrl) {
            try {
              const base64Photo = await loadImageAsBase64(item.photoUrl);
              if (base64Photo) {
                doc.addImage(base64Photo, 'JPEG', 14, y - 4, 12, 12);
              }
            } catch (e) {
              // ignore
            }
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`${item.name} (${item.id})`, 32, y + 2);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Dept: ${item.department} | Status: ${rec.status} | Time: ${rec.fullDateTime || rec.time}`, 32, y + 7);

          y += 15;
        }

        y += 4;
      }

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Executive Summary Report — Project Chakravyuh Command Portal (12-Hour System)', 14, 286);

      doc.save(`CHAKRAVYUH_EXECUTIVE_SUMMARY_${selectedDate}.pdf`);
    } catch (err) {
      console.error('Summary PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- PDF Export 2: Download Specific Roster List PDF ---
  const handleDownloadCategoryPDF = async (targetCategory = activeTab) => {
    setIsGeneratingPdf(true);
    setShowPdfMenu(false);
    try {
      const targetList = targetCategory === 'all'
        ? personnel
        : personnel.filter((p) => getCategory(p) === targetCategory);

      const categoryTitle =
        targetCategory === 'students'
          ? 'STUDENTS DETAILED ROSTER'
          : targetCategory === 'faculties'
          ? 'FACULTIES DETAILED ROSTER'
          : targetCategory === 'leadership'
          ? 'EXECUTIVE DEANS & LEADERSHIP ROSTER'
          : 'INSTITUTIONAL ALL RECORDS DIRECTORY';

      const doc = new jsPDF();
      const timeNow12Hr = new Date().toLocaleString('en-US', { hour12: true });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`PROJECT CHAKRAVYUH — ${categoryTitle}`, 14, 16);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${timeNow12Hr}  |  Target Date: ${selectedDate}  |  Total Count: ${targetList.length}`, 14, 26);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, 42, 182, 14, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Records: ${targetList.length}`, 20, 51);
      doc.setTextColor(5, 150, 105);
      doc.text(`Present: ${targetList.filter(p => (getStudentStatusForDate(p, selectedDate).status||'').toLowerCase() === 'present').length}`, 85, 51);
      doc.setTextColor(225, 29, 72);
      doc.text(`Absent: ${targetList.filter(p => (getStudentStatusForDate(p, selectedDate).status||'').toLowerCase() !== 'present').length}`, 140, 51);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PHOTO', 14, 66);
      doc.text('ID / ROLL NO', 34, 66);
      doc.text('NAME', 65, 66);
      doc.text('DEPARTMENT', 105, 66);
      doc.text('DATE & TIME', 140, 66);
      doc.text('STATUS', 180, 66);
      doc.line(14, 69, 196, 69);

      let y = 76;

      for (let i = 0; i < targetList.length; i += 1) {
        const person = targetList[i];
        const rec = getStudentStatusForDate(person, selectedDate);

        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (person.photoUrl) {
          try {
            const base64Photo = await loadImageAsBase64(person.photoUrl);
            if (base64Photo) {
              doc.addImage(base64Photo, 'JPEG', 14, y - 5, 14, 14);
            }
          } catch (e) {
            // ignore
          }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(String(person.id), 34, y + 2);
        doc.text(String(person.name).slice(0, 18), 65, y + 2);
        doc.setFont('helvetica', 'normal');
        doc.text(String(person.department).slice(0, 16), 105, y + 2);
        doc.text(String(rec.fullDateTime || rec.time || '--').slice(0, 22), 140, y + 2);

        if (rec.status === 'Present') doc.setTextColor(5, 150, 105);
        else if (rec.status === 'Late') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(225, 29, 72);

        doc.setFont('helvetica', 'bold');
        doc.text(String(rec.status), 180, y + 2);
        doc.setTextColor(15, 23, 42);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 8, 196, y + 8);
        y += 16;
      }

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Personnel Directory Log — Project Chakravyuh Command Portal', 14, 286);

      doc.save(`CHAKRAVYUH_${targetCategory.toUpperCase()}_LIST_${selectedDate}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- PDF Export 3: Download Single Individual Dossier PDF ---
  const handleDownloadSingleProfilePDF = async (person) => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const timeNow12Hr = new Date().toLocaleString('en-US', { hour12: true });
      const rec = getStudentStatusForDate(person, selectedDate);

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PROJECT CHAKRAVYUH — OFFICIAL PERSONNEL DOSSIER', 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('BIOMETRIC ATTENDANCE & INSTITUTIONAL RECORD (12-HOUR SYSTEM)', 14, 28);
      doc.text(`Generated: ${timeNow12Hr}  |  Record Date: ${selectedDate}`, 14, 34);

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 48, 182, 94, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 48, 182, 94, 'S');

      let photoAdded = false;
      if (person.photoUrl) {
        try {
          const base64Photo = await loadImageAsBase64(person.photoUrl);
          if (base64Photo) {
            doc.addImage(base64Photo, 'JPEG', 22, 56, 40, 48);
            doc.setDrawColor(15, 23, 42);
            doc.rect(22, 56, 40, 48, 'S');
            photoAdded = true;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!photoAdded) {
        doc.setFillColor(226, 232, 240);
        doc.rect(22, 56, 40, 48, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.text('NO PHOTO', 26, 82);
      }

      const startX = 72;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(person.name, startX, 62);

      doc.setFontSize(10);
      doc.setTextColor(14, 116, 144);
      doc.text(`ID / ROLL NO: ${person.id}`, startX, 70);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Category: ${getCategory(person).toUpperCase()}`, startX, 77);
      doc.text(`Role / Designation: ${person.designation || person.role || 'Member'}`, startX, 84);
      doc.text(`Department / Branch: ${person.department}`, startX, 91);
      doc.text(`Badge ID: ${person.badgeId || person.id}`, startX, 98);
      doc.text(`Selected Date: ${selectedDate}`, startX, 105);
      doc.text(`Check-In Timestamp (12-HR): ${rec.fullDateTime || rec.time}`, startX, 112);
      doc.text(`Presence Status: ${rec.status}`, startX, 119);

      doc.setDrawColor(5, 150, 105);
      doc.rect(140, 122, 50, 14, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('VERIFIED DOSSIER', 145, 130);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Biometric Personnel Identity Dossier — Project Chakravyuh Command Portal', 14, 286);

      doc.save(`CHAKRAVYUH_PROFILE_DOSSIER_${person.id}.pdf`);
    } catch (err) {
      console.error('Profile PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-10 text-slate-900">
      {/* Top Banner - Clean Balanced Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            <span>Student & Staff Information Portal</span>
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Complete student directory
          </p>
        </div>

        {/* PDF Export Dropdown Menu */}
        <div className="relative">
          <button
            disabled={isGeneratingPdf}
            onClick={() => setShowPdfMenu(!showPdfMenu)}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-sm flex items-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Reports'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showPdfMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 space-y-1 animate-in fade-in duration-150">
              <div className="px-3.5 py-2 text-xs font-black uppercase text-slate-500 border-b border-slate-100">
                PDF Export Options (12-Hour Format)
              </div>

              <button
                onClick={handleDownloadSummaryPDF}
                className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <BarChart2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Summarized Executive PDF</span>
                  <span className="text-xs text-slate-500 font-semibold">Stats, 12-hr timestamps & key photos</span>
                </div>
              </button>

              <button
                onClick={() => handleDownloadCategoryPDF('students')}
                className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 text-slate-800 flex-shrink-0" />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Students List PDF</span>
                  <span className="text-xs text-slate-500 font-semibold">Complete Students roster with 12-hr dates</span>
                </div>
              </button>

              <button
                onClick={() => handleDownloadCategoryPDF('faculties')}
                className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Briefcase className="w-5 h-5 text-slate-800 flex-shrink-0" />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Faculties List PDF</span>
                  <span className="text-xs text-slate-500 font-semibold">Teaching staff with photos</span>
                </div>
              </button>

              <button
                onClick={() => handleDownloadCategoryPDF('leadership')}
                className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Crown className="w-5 h-5 text-slate-800 flex-shrink-0" />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Deans & Admin List PDF</span>
                  <span className="text-xs text-slate-500 font-semibold">Leadership & Deans directory</span>
                </div>
              </button>

              <button
                onClick={() => handleDownloadCategoryPDF('all')}
                className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer border-t border-slate-100 pt-2.5"
              >
                <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">All Personnel Master PDF</span>
                  <span className="text-xs text-slate-500 font-semibold">Complete directory with 12-hr timestamps</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time System Clock Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-base sm:text-lg font-black tracking-tight">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })} •{' '}
            <span className="text-emerald-300 font-mono">{currentTime.toLocaleTimeString('en-US', { hour12: true })}</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            <span>Students</span>
          </button>

          <button
            onClick={() => setActiveTab('faculties')}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'faculties'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4.5 h-4.5" />
            <span>Faculties</span>
          </button>

          <button
            onClick={() => setActiveTab('leadership')}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'leadership'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Crown className="w-4.5 h-4.5" />
            <span>Administration & Deans</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>All Records</span>
          </button>
        </div>

        {/* View Mode Switcher Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'roster'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Selected Date View</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Multi-Date Matrix (Date Columns)</span>
          </button>
        </div>
      </div>

      {/* Main Content White Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
        {/* Presence Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">
              Date Status ({selectedDate}):
            </span>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              All ({totalInTab})
            </button>

            <button
              onClick={() => setStatusFilter('present')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-white" />
              <span>Present ({presentCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600 dark:text-white" />
              <span>Absent ({absentCount})</span>
            </button>

            {lateCount > 0 && (
              <button
                onClick={() => setStatusFilter('late')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'late'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-white" />
                <span>Late ({lateCount})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID, department..."
              className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
            />
          </div>
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
                    <th className="py-3.5 px-3 min-w-[90px] w-[90px] sticky left-0 z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">ID / Roll No</th>
                    <th className="py-3.5 px-4 min-w-[170px] w-[170px] sticky left-[90px] z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">Student / Personnel Name</th>
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
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={dateColumns.length + 4} className="py-12 text-center text-slate-500 text-sm font-bold">
                        No matching student records found for this date view.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((person) => {
                      let presentDays = 0;
                      dateColumns.forEach((col) => {
                        const rec = getStudentStatusForDate(person, col.dateStr);
                        if (rec.status === 'Present' || rec.status === 'Late') presentDays += 1;
                      });
                      const attRate = Math.round((presentDays / dateColumns.length) * 100);

                      return (
                        <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 sticky left-0 z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{person.id}</td>
                          <td className="py-3.5 px-4 sticky left-[90px] z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
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
                          <td className="py-3.5 px-3 text-slate-700 font-semibold text-[11px] sticky left-[260px] z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{person.department}</td>
                          {dateColumns.map((col) => {
                            const rec = getStudentStatusForDate(person, col.dateStr);
                            const isP = rec.status === 'Present';
                            const isL = rec.status === 'Late';

                            return (
                              <td
                                key={col.dateStr}
                                onClick={() => handleToggleDateAttendance(person.id, col.dateStr, rec.status)}
                                title={`${person.name} on ${col.fullDate}: ${rec.status} (${rec.fullDateTime || rec.time}) — Click to toggle (12-Hour Format)`}
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
                          <td className="py-3.5 px-3 text-center border-l border-slate-100 font-extrabold text-xs min-w-[100px] sticky right-0 z-20 bg-white group-hover:bg-slate-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
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
          /* MODE 2: SELECTED DATE ROSTER VIEW (With 12-Hour Format Timestamp Column) */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">ID / Badge</th>
                  <th className="py-3.5 px-4">Name & Photo</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Role / Designation</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Presence Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-bold">
                      No matching student records found for date {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((person) => {
                    const rec = getStudentStatusForDate(person, selectedDate);
                    const isPresent = rec.status === 'Present';
                    const isLate = rec.status === 'Late';

                    return (
                      <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* ID / Badge */}
                        <td className="py-4 px-4 font-mono font-black text-slate-900 text-sm">{person.id}</td>

                        {/* Name & Photo */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-xs">
                              {person.photoUrl ? (
                                <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{person.avatar || '👤'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-base block leading-snug">{person.name}</span>
                              <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                                {person.badgeId || person.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-4 font-extrabold text-slate-800 text-sm">{person.department}</td>

                        {/* Role / Designation */}
                        <td className="py-4 px-4 font-extrabold text-slate-800 text-sm">
                          {person.designation || person.role || 'Member'}
                        </td>

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

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : isLate
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            {isPresent ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Present</span>
                              </>
                            ) : isLate ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Late</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                                <span>Absent</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadSingleProfilePDF(person)}
                              title="Download PDF Identity Dossier"
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-700" />
                              <span>PDF</span>
                            </button>

                            <button
                              onClick={() => handleToggleDateAttendance(person.id, selectedDate, rec.status)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
                                isPresent
                                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                              }`}
                            >
                              {isPresent ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </div>
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
  );
};

export default StudentInformation;
