import React, { useState } from 'react';
import { 
  Database, 
  Trash2, 
  Search, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Download,
  UserX,
  UserCheck,
  GraduationCap,
  Briefcase,
  UserPlus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';

export const RegisteredData = () => {
  const { 
    watchlist = [], 
    personnel = [], 
    missingChildren = [],
    depotInventory = [],
    activeModule = 'attendance',
    deletePersonnel, 
    deleteBatchPersonnel, 
    removeFromWatchlist, 
    deleteMultipleWatchlist, 
    deleteMissingChild,
    deleteDepotItem,
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Strict Module context checks
  const isDefence = activeModule === 'defence';
  const isMissingChild = activeModule === 'missing-child';
  const isAttendance = activeModule === 'attendance' || activeModule === 'students';
  const isCriminal = activeModule === 'criminal-tracking' || (!isDefence && !isMissingChild && !isAttendance);

  // Primary dataset depending on active module
  const rawData = isDefence
    ? (depotInventory || [])
    : isMissingChild 
      ? (missingChildren || []) 
      : isAttendance 
        ? (personnel || []) 
        : (watchlist || []);

  // Sort records alphabetically A-to-Z by Name/Item
  const sortedData = [...rawData].sort((a, b) => 
    (a.name || a.item || '').localeCompare(b.name || b.item || '', undefined, { sensitivity: 'base' })
  );

  // Defence Category Counts
  const armoryCount = sortedData.filter(i => 
    (i.category || i.type || '').toLowerCase().includes('armory') || 
    (i.item || i.name || '').toLowerCase().includes('rifle') || 
    (i.item || i.name || '').toLowerCase().includes('gun') || 
    (i.item || i.name || '').toLowerCase().includes('ammo') ||
    (i.type || '').toLowerCase().includes('weapon')
  ).length;
  const secureCount = sortedData.filter(i => (i.status || 'SECURE').toUpperCase().includes('SECURE') || (i.status || '').toUpperCase().includes('ACTIVE')).length;

  // Attendance Category Counts
  const studentCount = sortedData.filter(p => p.role?.includes('Student') || p.category === 'students').length;
  const facultyCount = sortedData.filter(p => p.role?.includes('Faculty') || p.role?.includes('Teacher')).length;
  const deanCount = sortedData.filter(p => p.role?.includes('Dean') || p.role?.includes('HOD') || p.role?.includes('Management')).length;
  const staffCount = sortedData.filter(p => p.role?.includes('Staff') || p.role?.includes('Officer')).length;

  // Missing Children Category Counts
  const searchingCount = sortedData.filter(c => (c.status || 'Searching') === 'Searching').length;
  const locatedCount = sortedData.filter(c => String(c.status || '').includes('Located')).length;

  // Criminal Category Counts
  const criticalCount = sortedData.filter(w => w.riskLevel === 'Critical' || w.riskLevel === 'Critical Risk' || w.riskLevel === 'Criminal').length;
  const highRiskCount = sortedData.filter(w => w.riskLevel === 'High Risk' || w.riskLevel === 'High').length;

  // Filter records by Category & Search term
  const filteredData = sortedData.filter((item) => {
    let matchesCategory = true;

    if (isDefence) {
      if (categoryFilter === 'armory') {
        matchesCategory = (item.category || item.type || '').toLowerCase().includes('armory') || 
                          (item.item || item.name || '').toLowerCase().includes('rifle') || 
                          (item.item || item.name || '').toLowerCase().includes('gun') || 
                          (item.item || item.name || '').toLowerCase().includes('ammo') ||
                          (item.type || '').toLowerCase().includes('weapon');
      } else if (categoryFilter === 'secure') {
        matchesCategory = (item.status || 'SECURE').toUpperCase().includes('SECURE') || (item.status || '').toUpperCase().includes('ACTIVE');
      }
    } else if (isMissingChild) {
      if (categoryFilter === 'searching') {
        matchesCategory = (item.status || 'Searching') === 'Searching';
      } else if (categoryFilter === 'located') {
        matchesCategory = String(item.status || '').includes('Located');
      }
    } else if (isAttendance) {
      if (categoryFilter === 'students') {
        matchesCategory = item.role?.includes('Student') || item.category === 'students';
      } else if (categoryFilter === 'faculty') {
        matchesCategory = item.role?.includes('Faculty') || item.role?.includes('Teacher');
      } else if (categoryFilter === 'dean') {
        matchesCategory = item.role?.includes('Dean') || item.role?.includes('HOD') || item.role?.includes('Management');
      } else if (categoryFilter === 'staff') {
        matchesCategory = item.role?.includes('Staff') || item.role?.includes('Officer');
      }
    } else {
      if (categoryFilter === 'critical') {
        matchesCategory = item.riskLevel === 'Critical' || item.riskLevel === 'Critical Risk' || item.riskLevel === 'Criminal';
      } else if (categoryFilter === 'high') {
        matchesCategory = item.riskLevel === 'High Risk' || item.riskLevel === 'High';
      }
    }

    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(q) ||
      (item.item || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.location || item.depot || item.lastSeenLocation || '').toLowerCase().includes(q) ||
      (item.category || item.type || '').toLowerCase().includes(q) ||
      (item.guardianName || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Checkbox Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Single Record Deletion
  const handleDeleteRecord = (item) => {
    if (isDefence) {
      if (deleteDepotItem) deleteDepotItem(item.id);
    } else if (isMissingChild) {
      if (deleteMissingChild) deleteMissingChild(item.id);
    } else if (isAttendance) {
      if (deletePersonnel) deletePersonnel(item.id);
    } else {
      if (removeFromWatchlist) removeFromWatchlist(item.id);
    }
    setSelectedIds(prev => prev.filter(i => i !== item.id));
    setDeleteConfirmId(null);
  };

  // Bulk Deletion
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (isDefence) {
      selectedIds.forEach(id => deleteDepotItem && deleteDepotItem(id));
    } else if (isMissingChild) {
      selectedIds.forEach(id => deleteMissingChild && deleteMissingChild(id));
    } else if (isAttendance) {
      if (deleteBatchPersonnel) {
        deleteBatchPersonnel(selectedIds);
      } else {
        selectedIds.forEach(id => deletePersonnel && deletePersonnel(id));
      }
    } else {
      if (deleteMultipleWatchlist) {
        deleteMultipleWatchlist(selectedIds);
      } else {
        selectedIds.forEach(id => removeFromWatchlist && removeFromWatchlist(id));
      }
    }
    setSelectedIds([]);
  };

  // Download Profile Dossier PDF for single item
  const handleDownloadDossier = (item) => {
    try {
      const doc = new jsPDF();
      if (isDefence) {
        doc.setFillColor(30, 58, 138); // Dark blue header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PROJECT CHAKRAVYUH — DEFENCE TACTICAL REPOSITORY', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(191, 219, 254);
        doc.text('OFFICIAL REGISTERED ARMORY & EQUIPMENT DOSSIER', 14, 26);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()} | Asset ID: ${item.id || item.code}`, 14, 34);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('ARMORY ASSET SPECIFICATIONS & SECURITY CLEARANCE', 14, 54);
        doc.setLineWidth(0.5);
        doc.setDrawColor(30, 58, 138);
        doc.line(14, 57, 196, 57);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Asset / Item Name:   ${item.item || item.name || 'Armory Asset'}`, 14, 68);
        doc.text(`Asset ID / Code:     ${item.id || item.code}`, 14, 76);
        doc.text(`Equipment Type:      ${item.category || item.type || 'Defence Asset'}`, 14, 84);
        doc.text(`Depot Location:      ${item.location || item.depot || 'Main Armory Vault'}`, 14, 92);
        doc.text(`Security Clearance:  ${item.status || 'SECURE'}`, 14, 100);
        doc.text(`Database Source:     Defence_tactical_system`, 14, 108);

        doc.save(`DEFENCE_ASSET_DOSSIER_${(item.item || item.name || 'ASSET').replace(/ /g, '_')}_${item.id}.pdf`);
      } else if (isMissingChild) {
        doc.setFillColor(13, 148, 136); // Teal rescue header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PROJECT CHAKRAVYUH — MISSING PERSON RECOVERY REPOSITORY', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(204, 251, 241);
        doc.text('OFFICIAL MISSING PERSON RECOVERY DOSSIER', 14, 26);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()} | Case ID: ${item.id}`, 14, 34);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CASE IDENTIFICATION & GUARDIAN DETAILS', 14, 54);
        doc.setLineWidth(0.5);
        doc.setDrawColor(13, 148, 136);
        doc.line(14, 57, 196, 57);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Full Name:           ${item.name}`, 14, 68);
        doc.text(`Case ID:             ${item.id}`, 14, 76);
        doc.text(`Age / Gender:        ${item.age || 7} Yrs • ${item.gender || 'Male'}`, 14, 84);
        doc.text(`Father / Guardian:   ${item.guardianName || 'Parent / Guardian'}`, 14, 92);
        doc.text(`Emergency Contact:   ${item.contactNumber || '+91 9876543210'}`, 14, 100);
        doc.text(`Last Seen Location:  ${item.lastSeenLocation || 'Central District'}`, 14, 108);
        doc.text(`Case Status:         ${item.status || 'Searching'}`, 14, 116);

        doc.save(`MISSING_PERSON_DOSSIER_${item.name.replace(/ /g, '_')}_${item.id}.pdf`);
      } else if (isAttendance) {
        doc.setFillColor(15, 23, 42); // Dark navy header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PROJECT CHAKRAVYUH — REGISTERED ATTENDANCE REPOSITORY', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('OFFICIAL REGISTERED MEMBER BIOMETRIC & ACADEMIC DOSSIER', 14, 26);
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()} | ID: ${item.id}`, 14, 34);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('MEMBER PROFILE TELEMETRY & SPECIFICATIONS', 14, 54);
        doc.setLineWidth(0.5);
        doc.setDrawColor(15, 23, 42);
        doc.line(14, 57, 196, 57);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Member Full Name:    ${item.name}`, 14, 68);
        doc.text(`Registration ID:     ${item.id}`, 14, 76);
        doc.text(`Designation / Role:   ${item.role || 'Student'}`, 14, 84);
        doc.text(`Department / Class:   ${item.department || 'General Branch'}`, 14, 92);
        doc.text(`Status:               ${item.status || 'Registered'}`, 14, 100);
        doc.text(`Enrolled Camera:      ${item.camera || 'CAM-01 Primary Station'}`, 14, 108);

        doc.save(`ATTENDANCE_REGISTERED_DOSSIER_${item.name.replace(/ /g, '_')}_${item.id}.pdf`);
      } else {
        doc.setFillColor(153, 27, 27); // Dark red header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PROJECT CHAKRAVYUH — REGISTERED CRIMINAL REPOSITORY', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(254, 202, 202);
        doc.text('OFFICIAL REGISTERED SUSPECT BIOMETRIC DOSSIER', 14, 26);
        doc.setFontSize(8);
        doc.setTextColor(226, 232, 240);
        doc.text(`Generated: ${new Date().toLocaleString()} | Record ID: ${item.id}`, 14, 34);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('SUSPECT DOSSIER TELEMETRY & SPECIFICATIONS', 14, 54);
        doc.setLineWidth(0.5);
        doc.setDrawColor(220, 38, 38);
        doc.line(14, 57, 196, 57);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Suspect Full Name:   ${item.name}`, 14, 68);
        doc.text(`Criminal Record ID:  ${item.id}`, 14, 76);
        doc.text(`Threat Risk Level:   ${item.riskLevel || 'Critical Risk'}`, 14, 84);
        doc.text(`IPC Penal Charges:   ${item.charges || item.crimeType || 'IPC 302/395'}`, 14, 92);
        doc.text(`Age:                 ${item.age || 32} Years`, 14, 100);
        doc.text(`Last Known Node:     ${item.lastSeen || 'Command Center HQ'}`, 14, 108);
        doc.text(`Status:              ${item.status || 'REGISTERED & ACTIVE'}`, 14, 116);

        doc.save(`CRIMINAL_REGISTERED_DOSSIER_${item.name.replace(/ /g, '_')}_${item.id}.pdf`);
      }
      showToast && showToast('Download Complete', `Exported dossier PDF for ${item.name || item.item}.`, 'success');
    } catch (err) {
      console.error('PDF Error:', err);
      showToast && showToast('PDF Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 select-none pb-10 text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${
              isDefence
                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                : isMissingChild 
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                  : isAttendance 
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
            }`}>
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {isDefence
                ? 'Defence Tactical Registered Data Repository'
                : isMissingChild 
                  ? 'Missing Children Registered Repository' 
                  : isAttendance 
                    ? 'Attendance Registered Data Repository' 
                    : 'Criminal Tracking Registered Data Repository'
              }
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1 border ${
              isDefence
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : isMissingChild 
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' 
                  : isAttendance 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Synchronized Archive
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isDefence
              ? 'Master database of all registered defence equipment, depot inventory & tactical assets stored in Defence_tactical_system database.'
              : isMissingChild
                ? 'Real-time database of all registered missing person cases in Missing_children database.'
                : isAttendance 
                  ? 'Real-time master database of all registered students, faculties, deans, and staff enrolled in Attendance System.'
                  : 'Master database of all registered criminal records & suspects stored in Criminal_traking database.'
            }
          </p>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/20 cursor-pointer animate-in fade-in"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedIds.length} Records)</span>
          </button>
        )}
      </div>

      {/* Main Content Repository Table Card */}
      <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5 shadow-xs">
        {/* Category Filters & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-gray-800 p-4 rounded-xl">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider mr-1">Filter:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              All Records ({sortedData.length})
            </button>

            {isDefence ? (
              <>
                <button
                  onClick={() => setCategoryFilter('armory')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'armory'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Armory Assets ({armoryCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('secure')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'secure'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure Clearance ({secureCount})</span>
                </button>
              </>
            ) : isMissingChild ? (
              <>
                <button
                  onClick={() => setCategoryFilter('searching')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'searching'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-purple-400" />
                  <span>Searching ({searchingCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('located')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'located'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Located ({locatedCount})</span>
                </button>
              </>
            ) : isAttendance ? (
              <>
                <button
                  onClick={() => setCategoryFilter('students')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'students'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Students ({studentCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('faculty')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'faculty'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Faculty / Teachers ({facultyCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('dean')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'dean'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>Deans & Management ({deanCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('staff')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'staff'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span>Staff / Officers ({staffCount})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCategoryFilter('critical')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'critical'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Critical Risk ({criticalCount})</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('high')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'high'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#11141c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>High Risk ({highRiskCount})</span>
                </button>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isDefence
                  ? "Search asset ID, equipment, depot location..."
                  : isMissingChild 
                    ? "Search child name, case ID, guardian..." 
                    : isAttendance 
                      ? "Search Name, ID, Department or Role..." 
                      : "Search Name, ID or IPC..."
              }
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161922] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3.5">{isDefence ? 'Asset ID / Code' : isMissingChild ? 'Case ID' : isAttendance ? 'ID / Code' : 'Record ID / Criminal ID'}</th>
                <th className="py-3 px-3.5">{isDefence ? 'Equipment Icon' : 'Photograph'}</th>
                <th className="py-3 px-3.5">{isDefence ? 'Asset / Equipment Name' : isMissingChild ? 'Child Name & Guardian' : 'Registered Identity / Name'}</th>
                <th className="py-3 px-3.5">{isDefence ? 'Depot / Base Location' : isMissingChild ? 'Last Seen Location' : isAttendance ? 'Department / Branch' : 'Crime / IPC Charges'}</th>
                <th className="py-3 px-3.5">{isDefence ? 'Security Clearance' : isMissingChild ? 'Case Status' : isAttendance ? 'Member Role / Designation' : 'Threat Level / Status'}</th>
                <th className="py-3 px-3.5 text-right">Delete Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center space-y-2">
                      <UserX className="w-10 h-10 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                        {isDefence
                          ? 'No registered defence inventory or assets found'
                          : isMissingChild 
                            ? 'No registered missing child cases found'
                            : isAttendance 
                              ? 'No registered member records found' 
                              : 'No registered criminal records found'
                        }
                      </p>
                      <p className="text-xs text-gray-400">
                        {isDefence
                          ? 'Depot inventory stored in Defence_tactical_system database.'
                          : isMissingChild 
                            ? 'Use "Report Missing Child" button in Missing Children portal to add cases.'
                            : isAttendance 
                              ? 'Use "Register New Data" tab to add students, faculties, deans, or staff.' 
                              : 'Try adjusting your category filter or search keywords.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const itemKey = item.id || item.code || `DEF-${Math.random()}`;
                  const isSelected = selectedIds.includes(itemKey);
                  const isConfirming = deleteConfirmId === itemKey;
                  return (
                    <tr 
                      key={itemKey}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-blue-50/50 dark:bg-blue-950/30' 
                          : 'hover:bg-gray-50/70 dark:hover:bg-[#161922]/70'
                      }`}
                    >
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemKey)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.id || item.code}
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 overflow-hidden flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.name || item.item}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{isDefence ? '🛡️' : (item.avatar || item.photo || '👤')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-gray-900 dark:text-white block leading-tight text-sm">
                            {item.item || item.name || 'Armory Asset'}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            {isDefence
                              ? `Category: ${item.category || item.type || 'Defence Asset'} • Qty: ${item.quantity || 1}`
                              : isMissingChild 
                                ? `Guardian: ${item.guardianName || 'Parent / Guardian'} (${item.age || 7} Yrs • ${item.gender || 'Male'})`
                                : isAttendance 
                                  ? `Added: ${item.entry || 'Registered'}` 
                                  : `Age: ${item.age || 32} Yrs • ${item.lastSeen || 'Node CAM-01'}`
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 font-bold text-gray-800 dark:text-gray-200 text-xs">
                        {isDefence
                          ? (item.location || item.depot || 'Central Armory Vault')
                          : isMissingChild
                            ? (item.lastSeenLocation || item.location || 'Central District')
                            : isAttendance 
                              ? (item.department || 'Computer Science') 
                              : (item.charges || item.ipcCharges || item.crimeType || item.details || 'IPC 302/395')
                        }
                      </td>
                      <td className="py-3.5 px-3.5">
                        {isDefence ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-black text-[10px] uppercase tracking-wider">
                              {item.status || 'SECURE'}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                              ● ACTIVE ASSET
                            </span>
                          </div>
                        ) : isMissingChild ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                              String(item.status || '').includes('Located')
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            }`}>
                              {item.status || 'Searching'}
                            </span>
                          </div>
                        ) : isAttendance ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                              {item.role || item.designation || 'Student'}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                              ● {item.status || 'Registered'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-white font-black text-[10px] uppercase tracking-wider ${
                              String(item.riskLevel || '').toLowerCase().includes('high')
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}>
                              {item.riskLevel || 'Critical Risk'}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                              ● {item.status || 'REGISTERED & ACTIVE'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownloadDossier(item)}
                            title="Export Dossier PDF"
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#161922] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {isConfirming ? (
                            <div className="flex items-center space-x-1 animate-in fade-in">
                              <button
                                onClick={() => handleDeleteRecord(item)}
                                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-xs"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[10px] hover:bg-gray-300 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(itemKey)}
                              title="Delete Record"
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-red-200 dark:border-red-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegisteredData;

