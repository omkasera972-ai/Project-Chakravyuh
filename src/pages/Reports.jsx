import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search,
  ScanFace,
  ShieldAlert,
  AlertTriangle,
  Video,
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Shield,
  UserCheck,
  Car,
  User,
  Lock,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { 
  ReportBgSvg, 
  WatchlistBgSvg, 
  AlertBgSvg,
  AttendanceBgSvg,
  CpuBgSvg
} from '../components/common/CardBackgroundIcons';

export const Reports = () => {
  const { activeModule, watchlist = [], alerts = [], cameras = [], personnel = [], vehicles = [], missingChildren = [], depotInventory = [], detectionReports = [], setActiveModal, showToast } = useApp();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enforce strict 100% module isolation: currentModule is bound to route / active session
  const currentModule = moduleId || activeModule || 'attendance';

  // Get Module Title & Theme Badge
  const getModuleReportTitle = () => {
    switch (currentModule) {
      case 'attendance':
        return { name: 'Biometric Attendance Audit Reports', desc: 'Employee shift logs, entry timestamps, biometric confidence rates & roster verifications.' };
      case 'anpr':
        return { name: 'ANPR Traffic & Vehicle Intercept Reports', desc: 'Highway scans, speed corridor flags, blacklisted vehicle intercepts & route logs.' };
      case 'missing-child':
        return { name: 'Missing Children Rescue & Search Reports', desc: 'Search spotlight telemetry, last seen location logs & rescued child dossiers.' };
      case 'defence':
        return { name: 'Defence Depot Armory & Vault Movement Audits', desc: 'Armory issue logs, RFID container tracking, vault access checks & thermal audits.' };
      case 'criminal-tracking':
      default:
        return { name: 'Criminal Tracking AI Reports & Intercept Dossiers', desc: 'Official AI facial recognition match reports, caught criminal dossiers & threat dispatch logs.' };
    }
  };

  const moduleMeta = getModuleReportTitle();

  // 1. Criminal Tracking Data & Reports
  const criminalMatches = (watchlist || []).map((person, idx) => ({
    id: person.id || `CRIM-${1001 + idx}`,
    name: person.name || 'Unknown Suspect',
    crimeCategory: person.category || person.crime || 'Wanted Fugitive (IPC 302/392)',
    matchConfidence: person.confidence || '98.4%',
    location: person.location || 'Indore Junction CCTV Node #4',
    timestamp: person.lastSeen || 'Today, 14:22:05',
    status: person.status === 'Found' || person.status === 'Intercepted' ? 'FOUND & INTERCEPTED' : 'ACTIVE MATCH',
    riskLevel: person.riskLevel || 'Critical'
  }));

  const criminalTrackingReports = [
    {
      id: 'criminal-dossier',
      title: 'Wanted Criminal Match & Facial Recognition Audit',
      description: 'Complete AI facial biometric vector logs, suspect matches, FIR reference IDs, and live camera intercept telemetry.',
      records: `${watchlist.length} Active Targets`,
      period: 'Live Daily Log',
      size: '4.2 MB',
      type: 'PDF / CSV',
      accuracy: '99.8% Precision',
      icon: ScanFace
    },
    {
      id: 'alerts-audit',
      title: 'Active Threat Incidents & Control Room Dispatch Audit',
      description: 'All Critical, High, and Medium priority threat breaches, dispatch response times, patrol notifications, and resolution logs.',
      records: `${alerts.length} Total Incidents`,
      period: 'Past 30 Days',
      size: '2.8 MB',
      type: 'PDF / CSV',
      accuracy: '12ms Response',
      icon: AlertTriangle
    }
  ];

  // 2. Attendance Reports
  const attendanceReports = [
    {
      id: 'attendance-main',
      title: 'Biometric Attendance Verification & Roster Log',
      description: 'Daily shift attendance, entry timestamps, biometric confidence rates, absentee logs, and roster verifications.',
      records: `${personnel.length || 4} Personnel Records`,
      period: 'Past 30 Days',
      size: '2.4 MB',
      type: 'PDF / CSV',
      accuracy: '100% Verified',
      icon: UserCheck
    },
    {
      id: 'attendance-overtime',
      title: 'Shift Overtime & Access Control Gate Audit',
      description: 'Turnstile access logs, overtime hours calculation, and unauthorized gate access attempts.',
      records: `${personnel.filter(p => p.status === 'Present').length} Checked In`,
      period: 'Past 14 Days',
      size: '1.2 MB',
      type: 'PDF / CSV',
      accuracy: 'Gate Active',
      icon: Lock
    }
  ];

  // 3. ANPR Reports
  const anprReports = [
    {
      id: 'anpr-main',
      title: 'ANPR License Plate OCR & Intercept Intelligence Report',
      description: 'Highway scans, speed corridor flags, blacklisted vehicle intercepts, license plate OCR, and route tracking logs.',
      records: `${vehicles.length || 14} Vehicle Scans`,
      period: 'Past 7 Days',
      size: '5.1 MB',
      type: 'PDF / CSV',
      accuracy: '97.2% OCR Rate',
      icon: Car
    }
  ];

  // 4. Missing Children Reports
  const missingChildReports = [
    {
      id: 'missing-main',
      title: 'Missing Children Rescue & Sonar Search Audit',
      description: 'Search spotlight telemetry, last seen location logs, rescue status updates & reunited child dossiers.',
      records: `${missingChildren.length || 8} Cases Logged`,
      period: 'Past 30 Days',
      size: '1.5 MB',
      type: 'PDF / CSV',
      accuracy: 'Active Sonar',
      icon: User
    }
  ];

  // 5. Defence Reports
  const defenceReports = [
    {
      id: 'defence-main',
      title: 'Defence Depot Munitions & Vault Movement Audit',
      description: 'Armory issue logs, RFID container tracking, vault access checks, and thermal movement audits.',
      records: `${depotInventory.length || 12} Transfers`,
      period: 'Past 14 Days',
      size: '980 KB',
      type: 'PDF / CSV',
      accuracy: 'Encrypted Vault Log',
      icon: Shield
    }
  ];

  // Select Reports based on selectedCategory tab
  const getActiveModuleReports = () => {
    switch (currentModule) {
      case 'attendance': return attendanceReports;
      case 'anpr': return anprReports;
      case 'missing-child': return missingChildReports;
      case 'defence': return defenceReports;
      case 'all': return [...attendanceReports, ...criminalTrackingReports, ...anprReports, ...missingChildReports, ...defenceReports];
      case 'criminal-tracking':
      default:
        return criminalTrackingReports;
    }
  };

  const activeReportsList = getActiveModuleReports();

  // Filter reports by search term
  const filteredReports = activeReportsList.filter(rep => {
    const q = searchTerm.toLowerCase();
    return (
      rep.title?.toLowerCase().includes(q) ||
      rep.description?.toLowerCase().includes(q) ||
      rep.records?.toLowerCase().includes(q)
    );
  });

  // Filter criminal matches by search term
  const filteredMatches = criminalMatches.filter(person => {
    const q = searchTerm.toLowerCase();
    return (
      person.name?.toLowerCase().includes(q) ||
      person.id?.toLowerCase().includes(q) ||
      person.crimeCategory?.toLowerCase().includes(q) ||
      person.location?.toLowerCase().includes(q)
    );
  });

  // Filter personnel by search term
  const filteredPersonnel = personnel.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    );
  });

  // Dynamic KPI Stats based strictly on currentModule with explicit navigation handlers
  const renderKpiStats = () => {
    switch (currentModule) {
      case 'attendance':
        return (
          <>
            <StatCard
              title="Total Enrolled Roster"
              value={String(personnel.length)}
              subtext="Personnel Registered"
              icon={Users}
              onClick={() => navigate(`/portal/${currentModule}/students`)}
            />
            <StatCard
              title="Checked In Today"
              value={String(personnel.filter(p => p.status === 'Present').length)}
              subtext="Present & Verified"
              icon={UserCheck}
              indicatorDot="green"
              onClick={() => navigate(`/portal/${currentModule}/attendance`)}
            />
            <StatCard
              title="Report Status"
              value="AVAILABLE"
              subtext="PDF & CSV Direct Download"
              icon={FileText}
              onClick={() => handleDownloadFullAttendanceReport('pdf')}
            />
            <StatCard
              title="Audit Uptime"
              value="100%"
              subtext="Live Telemetry Pipeline"
              icon={CheckCircle2}
              onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            />
          </>
        );
      case 'anpr':
        return (
          <>
            <StatCard
              title="Total Vehicle Scans"
              value={String(vehicles.length || 14)}
              subtext="Plate OCR Telemetry"
              icon={Car}
              onClick={() => navigate(`/portal/${currentModule}/anpr`)}
            />
            <StatCard
              title="Blacklisted Intercepts"
              value={String(vehicles.filter(v => v.status === 'Blacklisted' || v.status === 'Stolen').length || 3)}
              subtext="Active Stolen/Wanted"
              icon={AlertTriangle}
              indicatorDot="red"
              onClick={() => navigate(`/portal/${currentModule}/alerts`)}
            />
            <StatCard
              title="OCR Accuracy"
              value="97.2%"
              subtext="High Speed Capture"
              icon={CheckCircle2}
              onClick={() => handleDownloadGeneralReport('ANPR System Accuracy Report', 'pdf')}
            />
            <StatCard
              title="Audit Uptime"
              value="100%"
              subtext="Live Radar Stream"
              icon={CheckCircle2}
              onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            />
          </>
        );
      case 'missing-child':
        return (
          <>
            <StatCard
              title="Reported Missing Cases"
              value={String(missingChildren.length || 8)}
              subtext="Active Sonar Search"
              icon={User}
              onClick={() => navigate(`/portal/${currentModule}/missing-child`)}
            />
            <StatCard
              title="Children Located"
              value={String(detectionReports.length)}
              subtext="Verified Rescues"
              icon={CheckCircle2}
              indicatorDot="green"
              onClick={() => navigate(`/portal/${currentModule}/missing-child`)}
            />
            <StatCard
              title="Search Status"
              value="ACTIVE"
              subtext="CCTV Mesh Scanning"
              icon={FileText}
              onClick={() => navigate(`/portal/${currentModule}/maps`)}
            />
            <StatCard
              title="Audit Uptime"
              value="100%"
              subtext="Child Rescue Grid"
              icon={CheckCircle2}
              onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            />
          </>
        );
      case 'defence':
        return (
          <>
            <StatCard
              title="Armory Transfers"
              value={String(depotInventory.length || 12)}
              subtext="RFID Logged Movements"
              icon={Shield}
              onClick={() => navigate(`/portal/${currentModule}/defence`)}
            />
            <StatCard
              title="Vault Clearance"
              value="SECURE"
              subtext="Biometric Gate DEF-01"
              icon={CheckCircle2}
              indicatorDot="green"
              onClick={() => navigate(`/portal/${currentModule}/alerts`)}
            />
            <StatCard
              title="Report Status"
              value="ENCRYPTED"
              subtext="Command Level Audit"
              icon={FileText}
              onClick={() => handleDownloadGeneralReport('Defence Armory Vault Report', 'pdf')}
            />
            <StatCard
              title="Audit Uptime"
              value="100%"
              subtext="Depot Sensor Grid"
              icon={CheckCircle2}
              onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            />
          </>
        );
      case 'criminal-tracking':
      default:
        return (
          <>
            <StatCard
              title="Watchlist Suspects"
              value={String(watchlist.length)}
              subtext="Active High Risk Targets"
              icon={ScanFace}
              onClick={() => navigate(`/portal/${currentModule}/criminal-tracking`)}
            />
            <StatCard
              title="Caught / Intercepted"
              value={String(criminalMatches.filter(m => m.status === 'FOUND & INTERCEPTED').length)}
              subtext="AI Biometric Matches"
              icon={CheckCircle2}
              indicatorDot="green"
              onClick={() => navigate(`/portal/${currentModule}/alerts`)}
            />
            <StatCard
              title="AI Precision"
              value="99.8%"
              subtext="Deep Neural ResNet"
              icon={CheckCircle2}
              onClick={() => handleDownloadGeneralReport('Criminal Biometric Precision Report', 'pdf')}
            />
            <StatCard
              title="Audit Uptime"
              value="100%"
              subtext="Live CCTV Network"
              icon={CheckCircle2}
              onClick={() => navigate(`/portal/${currentModule}/cameras`)}
            />
          </>
        );
    }
  };

  const renderHeaderDownloadButton = () => {
    if (currentModule === 'attendance') {
      return (
        <button
          onClick={() => handleDownloadFullAttendanceReport('pdf')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Attendance Report (PDF)</span>
        </button>
      );
    }
    const moduleLabel = currentModule.replace('-', ' ').toUpperCase();
    return (
      <button
        onClick={() => handleDownloadGeneralReport(`${moduleLabel} Module Full Audit Report`, 'pdf')}
        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Download {moduleLabel} Report (PDF)</span>
      </button>
    );
  };

  // Handle Full Attendance Report Download (PDF / CSV)
  const handleDownloadFullAttendanceReport = (format = 'pdf') => {
    const timeNow = new Date().toLocaleString();
    const presentCount = personnel.filter(p => p.status === 'Present').length;
    const absentCount = personnel.filter(p => p.status === 'Absent' || p.status === 'Registered').length;
    const lateCount = personnel.filter(p => p.status === 'Late').length;

    if (format === 'csv') {
      let csvContent = 'ID,NAME,ROLE,DEPARTMENT,ENTRY_TIME,STATUS,BADGE_ID\n';
      personnel.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.role || 'Member'}","${p.department}","${p.entry || '--'}","${p.status}","${p.badgeId || '--'}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FULL_ATTENDANCE_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Download Complete', 'Full attendance report CSV saved to downloads.', 'success');
      return;
    }

    try {
      showToast('Generating PDF', 'Building official Attendance PDF report...', 'info');
      const doc = new jsPDF();

      doc.setFillColor(6, 78, 59); // Dark emerald
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PROJECT CHAKRAVYUH - SMART ATTENDANCE AUDIT REPORT', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(167, 243, 208);
      doc.text('AUTOMATIC AI BIOMETRIC CHECK-IN ROSTER DOSSIER', 14, 25);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.text(`Generated: ${timeNow} | Total Personnel Records: ${personnel.length}`, 14, 32);

      doc.setFillColor(240, 253, 244);
      doc.rect(14, 45, 182, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Enrolled: ${personnel.length}`, 20, 58);
      doc.setTextColor(5, 150, 105);
      doc.text(`Present: ${presentCount}`, 75, 58);
      doc.setTextColor(220, 38, 38);
      doc.text(`Absent: ${absentCount}`, 125, 58);
      doc.setTextColor(217, 119, 6);
      doc.text(`Late: ${lateCount}`, 165, 58);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('PERSONNEL CHECK-IN AUDIT ROSTER LOG', 14, 78);
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(14, 81, 196, 81);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ID', 14, 88);
      doc.text('NAME', 45, 88);
      doc.text('ROLE / DEPT', 95, 88);
      doc.text('ENTRY TIME', 145, 88);
      doc.text('STATUS', 175, 88);
      doc.line(14, 91, 196, 91);

      doc.setFont('helvetica', 'normal');
      let y = 98;
      personnel.forEach((p) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(String(p.id), 14, y);
        doc.text(String(p.name).slice(0, 24), 45, y);
        doc.text(`${p.role || 'Member'} (${p.department})`.slice(0, 26), 95, y);
        doc.text(String(p.entry || '--'), 145, y);
        
        if (p.status === 'Present') doc.setTextColor(5, 150, 105);
        else if (p.status === 'Late') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(100, 116, 139);
        
        doc.text(String(p.status), 175, y);
        doc.setTextColor(15, 23, 42);
        y += 8;
      });

      doc.save(`FULL_ATTENDANCE_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Download Complete', 'Attendance PDF report saved to downloads.', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF Error', err.message, 'error');
    }
  };

  // Handle Download Single Member Receipt PDF
  const handleDownloadSingleMemberPdf = (person) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(6, 78, 59);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PROJECT CHAKRAVYUH - BIOMETRIC ATTENDANCE DOSSIER', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(167, 243, 208);
      doc.text('OFFICIAL MEMBER CHECK-IN RECEIPT', 14, 25);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMBER BIOMETRIC CHECK-IN DETAILS', 14, 52);
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(14, 55, 196, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Member Name:      ${person.name}`, 14, 65);
      doc.text(`Member ID:        ${person.id}`, 14, 73);
      doc.text(`Role / Category:  ${person.role || 'Member'}`, 14, 81);
      doc.text(`Department:       ${person.department}`, 14, 89);
      doc.text(`Entry Timestamp:  ${person.entry || '--'}`, 14, 97);
      doc.text(`Attendance Status:${person.status}`, 14, 105);
      doc.text(`Check-In Terminal:CAM-01 Main Gate Biometric Gate`, 14, 113);

      doc.save(`ATTENDANCE_RECEIPT_${person.name.replace(/ /g, '_')}_${person.id}.pdf`);
      showToast('Download Complete', `Downloaded attendance receipt PDF for ${person.name}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('PDF Error', err.message, 'error');
    }
  };

  // Handle Real Download of FIR & AI Match Dossier (Criminal Tracking)
  const handleDownloadCriminalDossier = (person, format) => {
    if (format === 'csv') {
      const csvHeader = 'SUSPECT_ID,FULL_NAME,OFFENSE_CATEGORY,MATCH_CONFIDENCE,CAMERA_LOCATION,TIMESTAMP,STATUS,RISK_LEVEL\n';
      const csvRow = `"${person.id}","${person.name}","${person.crimeCategory}","${person.matchConfidence}","${person.location}","${person.timestamp}","${person.status}","${person.riskLevel}"\n`;
      const blob = new Blob([csvHeader + csvRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CRIMINAL_INTERCEPT_${person.name.replace(/ /g, '_')}_${person.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Download Complete', `Exported CSV log for ${person.name}.`, 'success');
      return;
    }

    try {
      showToast('Generating PDF', `Building official PDF match dossier for ${person.name}...`, 'info');
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('BHARAT SARKAR - NATIONAL LAW ENFORCEMENT', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(129, 140, 248);
      doc.text('CRIMINAL TRACKING & AI BIOMETRIC INTERCEPT DOSSIER', 14, 25);
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(8);
      doc.text(`Report Generated: ${new Date().toLocaleString()} | Security Hash: CHAKRAVYUH-SEC-${Math.floor(Math.random() * 899999 + 100000)}`, 14, 32);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. SUSPECT DEMOGRAPHICS & IDENTIFICATION', 14, 52);
      doc.setLineWidth(0.5);
      doc.setDrawColor(99, 102, 241);
      doc.line(14, 55, 196, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Full Name:          ${person.name}`, 14, 65);
      doc.text(`Suspect ID:         ${person.id}`, 14, 73);
      doc.text(`Crime Offense:      ${person.crimeCategory}`, 14, 81);
      doc.text(`Risk Severity:      ${person.riskLevel}`, 14, 89);
      doc.text(`Intercept Status:   ${person.status}`, 14, 97);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. AI FACIAL BIOMETRIC VECTOR TELEMETRY', 14, 115);
      doc.line(14, 118, 196, 118);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Facial Embedding:   128D Deep Neural ResNet Vector Matched`, 14, 128);
      doc.text(`Match Precision:    ${person.matchConfidence} Vector Similarity`, 14, 136);
      doc.text(`Detection Camera:   ${person.location}`, 14, 144);
      doc.text(`Intercept Timestamp: ${person.timestamp}`, 14, 152);
      doc.text(`AI Inference Engine: FastAPI ResNet-34 GPU Server (12ms Latency)`, 14, 160);

      doc.save(`CRIMINAL_INTERCEPT_REPORT_${person.name.replace(/ /g, '_')}_${person.id}.pdf`);
      showToast('Download Completed', `Downloaded official PDF match dossier for ${person.name}.`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('PDF Generation Failed', err.message, 'error');
    }
  };

  // Handle Generic Audit Report Download
  const handleDownloadGeneralReport = (title, format) => {
    if (currentModule === 'attendance') {
      handleDownloadFullAttendanceReport(format);
      return;
    }

    const timeNow = new Date().toLocaleString();

    if (format === 'csv') {
      const csvContent = `REPORT_TITLE,MODULE_KEY,INDEXED_RECORDS,TELEMETRY_STATUS,GENERATED_TIME\n"${title}","${currentModule.toUpperCase()}","Verified Audit","100% Operational","${timeNow}"`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentModule.toUpperCase()}_${title.replace(/ /g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link);
      showToast('Download Complete', `${title} CSV saved to downloads.`, 'success');
      return;
    }

    try {
      showToast('Generating PDF', `Building ${title} PDF document...`, 'info');
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`CHAKRAVYUH COMMAND PORTAL - ${currentModule.toUpperCase()} DIVISION`, 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(129, 140, 248);
      doc.text(title.toUpperCase(), 14, 25);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Generated Date: ${timeNow}`, 14, 50);
      doc.text(`System Module:   ${currentModule.toUpperCase()} (Strict Isolated Workspace)`, 14, 58);
      doc.text(`Uptime Metric:   100% Telemetry Stream Active`, 14, 66);
      doc.text(`Security Hash:   CHAKRAVYUH-MOD-${Math.floor(Math.random() * 899999 + 100000)}`, 14, 74);

      doc.save(`${currentModule.toUpperCase()}_${title.replace(/ /g, '_')}.pdf`);
      showToast('Download Complete', `${title} PDF downloaded successfully.`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {moduleMeta.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              Reports Center
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
            {moduleMeta.desc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {renderHeaderDownloadButton()}
        </div>
      </div>

      {/* 📊 KPI OPERATIONAL STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderKpiStats()}
      </div>

      {/* 📜 SMART ATTENDANCE CHECK-IN LOGS TABLE */}
      {currentModule === 'attendance' && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  Smart Attendance Check-In Audit Logs & Downloads
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                  Live roster verifications, entry timestamps & individual PDF dossier downloads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFullAttendanceReport('pdf')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Roster PDF</span>
              </button>
              <button
                onClick={() => handleDownloadFullAttendanceReport('csv')}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161922] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-black uppercase text-xs tracking-wider">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Member Name & Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Check-In Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Download Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {filteredPersonnel.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No personnel records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPersonnel.map((person) => (
                      <tr key={person.id} className="hover:bg-gray-50/60 dark:hover:bg-[#161922]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{person.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-emerald-500/30 overflow-hidden flex items-center justify-center text-xl flex-shrink-0">
                              {person.photoUrl ? (
                                <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{person.avatar || '👤'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block text-sm leading-tight">{person.name}</span>
                              <span className="text-xs text-gray-500 font-medium block mt-0.5">{person.role || 'Member'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 font-medium text-sm">{person.department}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-800 dark:text-gray-200 text-sm font-semibold">{person.entry || '--'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                            person.status === 'Present'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                              : person.status === 'Late'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                          }`}>
                            {person.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDownloadSingleMemberPdf(person)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors shadow-xs cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 REAL CAUGHT & REGISTERED CRIMINAL INTERCEPT DOSSIERS SECTION */}
      {currentModule === 'criminal-tracking' && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Registered Criminal Watchlist Reports & FIR Intercept Dossiers
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Official AI biometric facial recognition reports, registered suspect dossiers & threat intercept records
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono">
              {filteredMatches.length} Active Dossiers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((person) => (
              <div
                key={person.id}
                className="relative overflow-hidden bg-white dark:bg-[#11141c] border-t-4 border-t-rose-500 border-x border-b border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-rose-500 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="relative z-10 space-y-3">
                  {/* Photo & Name Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 border-2 border-rose-500/50 overflow-hidden flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                        {person.photoUrl ? (
                          <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{person.photo || '👤'}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-sm leading-tight">{person.name}</h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold font-mono mt-0.5">{person.id}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide uppercase shadow-xs">
                      {person.riskLevel || 'Critical'}
                    </span>
                  </div>

                  {/* Detailed Criminal Attributes */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">Offense Category:</span>
                      <span className="font-bold text-gray-900 dark:text-white truncate max-w-[170px]">{person.crimeCategory}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">IPC Penal Charges:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 truncate max-w-[170px]">{person.charges || 'IPC 302/395'}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">Age:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{person.age || 32} Yrs</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">Camera / Node:</span>
                      <span className="font-medium text-sky-600 dark:text-sky-400 truncate max-w-[170px]">{person.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">Registration Date:</span>
                      <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{person.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => handleDownloadCriminalDossier(person, 'csv')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-[#1f2330] transition-colors text-center cursor-pointer text-xs"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleDownloadCriminalDossier(person, 'pdf')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download FIR PDF</span>
                  </button>
                </div>
                <WatchlistBgSvg className="w-12 h-12 text-rose-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MISSING CHILDREN DETECTION REPORTS SECTION */}
      {currentModule === 'missing-child' && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-600 dark:text-green-400">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Missing Children Detection & Match Reports
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Real-time facial detection matches, rescue location tracking & automated dispatch records
                  </p>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-bold">
              {detectionReports.length} Detection Matches
            </span>
          </div>

          {detectionReports.length === 0 ? (
            <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-[#161922] flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No detection matches yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Detection reports will appear here when matches are found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectionReports.map((report) => (
                <div
                  key={report.id}
                  className="relative overflow-hidden bg-white dark:bg-[#11141c] border-t-4 border-t-green-500 border-x border-b border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-green-500 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                          <ScanFace className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{report.childName}</h3>
                          <p className="text-xs text-green-600 dark:text-green-400 font-bold font-mono">{report.childId}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/80 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-[10px] font-black tracking-wide">
                        LOCATED
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Match Confidence:</span>
                        <span className="font-mono font-bold text-green-600 dark:text-green-400">{report.confidence}%</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Detection Location:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{report.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Detection Time:</span>
                        <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{report.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs gap-2">
                    <button
                      onClick={() => showToast('Export', `Exporting report for ${report.childName}...`, 'info')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-[#1f2330] transition-colors text-center cursor-pointer text-xs"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => showToast('Download', `Downloading rescue report for ${report.childName}...`, 'success')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Rescue PDF</span>
                    </button>
                  </div>
                  <WatchlistBgSvg className="w-12 h-12 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DEFENCE INVENTORY & VAULT MOVEMENT AUDITS SECTION */}
      {currentModule === 'defence' && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <Shield className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Defence Tactical Armory & Movement Audit Reports
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Encrypted armory issue logs, RFID container tracking & vault access audits stored in Defence_tactical_system database
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
              {depotInventory.length} Inventory Records
            </span>
          </div>

          {depotInventory.length === 0 ? (
            <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-[#161922] flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No defence inventory logs found</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Armory movement records stored in Defence_tactical_system database</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depotInventory.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden bg-white dark:bg-[#11141c] border-t-4 border-t-blue-500 border-x border-b border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{item.item || item.name || 'Armory Asset'}</h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold font-mono">{item.id}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-wide uppercase">
                        {item.status || 'SECURE'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Category:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{item.category || item.type || 'Defence Equipment'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Depot / Vault:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.location || item.depot || 'Main Armory Vault'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span>Database Source:</span>
                        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">Defence_tactical_system</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs gap-2">
                    <button
                      onClick={() => handleDownloadGeneralReport(`DEFENCE_ASSET_${item.id}`, 'csv')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-[#1f2330] transition-colors text-center cursor-pointer text-xs"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleDownloadGeneralReport(`DEFENCE_ASSET_${item.id}`, 'pdf')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Asset Dossier PDF</span>
                    </button>
                  </div>
                  <WatchlistBgSvg className="w-12 h-12 text-blue-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Reports;
