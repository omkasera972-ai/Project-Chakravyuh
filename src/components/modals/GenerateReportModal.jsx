import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

export const GenerateReportModal = () => {
  const { activeModal, setActiveModal, showToast, addReport, personnel = [] } = useApp();
  const [reportType, setReportType] = useState('attendance');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState('current-week');
  const [isExporting, setIsExporting] = useState(false);

  if (activeModal !== 'generateReport') return null;

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsExporting(true);
    addReport({ module: reportType, title: `Official ${reportType.toUpperCase()} Audit Report`, format, dateRange });

    setTimeout(() => {
      setIsExporting(false);
      setActiveModal(null);
      
      const timeNow = new Date().toLocaleString();

      if (reportType === 'attendance') {
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
          link.download = `ATTENDANCE_SUMMARY_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(link);
        } else {
          try {
            const doc = new jsPDF();
            doc.setFillColor(6, 78, 59);
            doc.rect(0, 0, 210, 38, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('PROJECT CHAKRAVYUH - SMART ATTENDANCE REPORT', 14, 16);
            doc.setFontSize(10);
            doc.setTextColor(167, 243, 208);
            doc.text('AUTOMATIC AI BIOMETRIC CHECK-IN AUDIT DOSSIER', 14, 25);
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
            doc.text(`Present: ${presentCount}`, 75, 58);
            doc.setTextColor(220, 38, 38);
            doc.text(`Absent: ${absentCount}`, 125, 58);
            doc.setTextColor(217, 119, 6);
            doc.text(`Late: ${lateCount}`, 165, 58);

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

            doc.save(`ATTENDANCE_SUMMARY_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`);
          } catch (err) {
            console.error('PDF generation error:', err);
          }
        }
      } else {
        const content = `Smart Detection App (SDA) - Command & Control Center\nReport: ${reportType.toUpperCase()}\nDate Range: ${dateRange}\nGenerated at: ${timeNow}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SDA-${reportType}-Report.${format === 'csv' ? 'csv' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      showToast('Report Generated & Downloaded', `Generated ${reportType.toUpperCase()} summary (${format.toUpperCase()}) successfully.`, 'success');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121419] border border-[#272b36] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#21252f] flex items-center justify-between bg-[#0e1014]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#1d2028] border border-[#2c313d] flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Generate Intelligence Report</h3>
              <p className="text-neutral-400 text-xs">Export telemetry, attendance audits, ANPR hits, or crime metrics</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Module / Report Dataset</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white focus:outline-none focus:border-neutral-400 text-xs"
            >
              <option value="attendance">Smart Attendance & Personnel Log</option>
              <option value="anpr">ANPR & Blacklisted Vehicle Detections</option>
              <option value="alerts">Incident & Security Alert Log</option>
              <option value="watchlist">Watchlist Intercepts & Facial Matches</option>
              <option value="missing-child">Missing Child Search Cases</option>
              <option value="defence">Defence Depot & Weapon Inventory Movement</option>
              <option value="camera-activity">Camera Network Health & Uptime</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Reporting Period</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-[#171922] border border-[#272b35] rounded-lg text-white focus:outline-none focus:border-neutral-400 text-xs"
              >
                <option value="today">Today (Past 24 Hours)</option>
                <option value="current-week">This Week</option>
                <option value="current-month">This Month</option>
                <option value="quarterly">Quarterly Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`py-2 rounded-lg font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                    format === 'pdf'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#171922] text-neutral-400 border-[#272b35] hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Doc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`py-2 rounded-lg font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                    format === 'csv'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#171922] text-neutral-400 border-[#272b35] hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV Data</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#161820] border border-[#232731] text-[11px] text-neutral-400 space-y-1">
            <span className="font-semibold text-neutral-200 block">Confidentiality Notice</span>
            <p>This report includes simulated intelligence telemetry generated within the Smart Detection App prototype environment.</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#21252f]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-lg bg-[#191b22] border border-[#272b35] hover:border-neutral-400 text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Report...' : 'Generate & Export'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
