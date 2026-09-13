import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Sidebar } from '../components/Sidebar';
import { CameraDetailModal } from '../components/modals/CameraDetailModal';
import { AddAlertModal } from '../components/modals/AddAlertModal';
import { SearchPersonModal } from '../components/modals/SearchPersonModal';
import { SearchVehicleModal } from '../components/modals/SearchVehicleModal';
import { GenerateReportModal } from '../components/modals/GenerateReportModal';
import { AddPersonModal } from '../components/modals/AddPersonModal';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const MainLayout = () => {
  const { toastMessage, activeModule } = useApp();
  const { moduleId } = useParams();
  const currentModule = moduleId || activeModule || 'criminal-tracking';

  // Filter Toast Notification: Only display if it matches currentModule or is a global action
  const showToastForModule = toastMessage && (!toastMessage.module || toastMessage.module === currentModule);

  return (
    <div className="h-screen w-screen bg-[#f8f9fa] dark:bg-[#0b0d12] text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden transition-colors">
      {/* Persistent Fixed Top Navigation Bar */}
      <Topbar />

      {/* Main Container Row with Fixed Sidebar & Scrollable Main Content */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar />

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth p-5 bg-[#f8f9fa] dark:bg-[#0b0d12]">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CameraDetailModal />
      <AddAlertModal />
      <SearchPersonModal />
      <SearchVehicleModal />
      <GenerateReportModal />
      <AddPersonModal />

      {/* Module Isolated Toast Notifications */}
      {showToastForModule && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={`p-4 rounded-xl border shadow-xl flex items-start space-x-3 max-w-sm ${
            toastMessage.type === 'success'
              ? 'bg-white border-emerald-300 text-gray-900 shadow-emerald-500/10'
              : toastMessage.type === 'warning'
              ? 'bg-white border-amber-300 text-gray-900 shadow-amber-500/10'
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toastMessage.type === 'info' && <Info className="w-5 h-5 text-gray-500" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">{toastMessage.title}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{toastMessage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
