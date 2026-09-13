import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './layouts/MainLayout';
import { PurposeSelector } from './pages/PurposeSelector';
import { ModuleLogin } from './pages/ModuleLogin';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { StudentInformation } from './pages/StudentInformation';
import { DataRegistration } from './pages/DataRegistration';
import { CriminalTracking } from './pages/CriminalTracking';
import { AnprSystem } from './pages/AnprSystem';
import { MissingChild } from './pages/MissingChild';
import { DefenceTracker } from './pages/DefenceTracker';
import { CameraNetwork } from './pages/CameraNetwork';
import { Alerts } from './pages/Alerts';
import { Maps } from './pages/Maps';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { RegisteredData } from './pages/RegisteredData';
import { AddCriminal } from './pages/AddCriminal';
import { AddMissingChild } from './pages/AddMissingChild';

// Route guard component enforcing strict 100% module security & access isolation
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, activeModule, setActiveModule } = useApp();
  const { moduleId } = useParams();

  // Retrieve authorized module for this session
  const authorizedModule = localStorage.getItem('sda_active_module') || activeModule;

  useEffect(() => {
    if (moduleId && authorizedModule && moduleId === authorizedModule) {
      setActiveModule(moduleId);
    }
  }, [moduleId, authorizedModule, setActiveModule]);

  if (!isAuthenticated) {
    return <Navigate to={moduleId ? `/portal/${moduleId}/login` : '/'} replace />;
  }

  // 🔒 SECURITY GATE ENFORCEMENT:
  // If an operator tries to access a different module than the one authorized for this session,
  // block cross-module access and redirect back to their authorized module workspace!
  if (moduleId && authorizedModule && moduleId !== authorizedModule) {
    console.warn(`[SECURITY GATE] Cross-module access denied: ${moduleId}. Redirecting to authorized workspace: ${authorizedModule}`);
    return <Navigate to={`/portal/${authorizedModule}/dashboard`} replace />;
  }

  return children;
};

// Component to select proper primary feature screen based on module ID
const ModuleDashboardWrapper = () => {
  return <Dashboard />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Software Opening Purpose Selector Landing Page */}
      <Route path="/" element={<PurposeSelector />} />

      {/* 2. Dedicated Login/Signup Portal per Module */}
      <Route path="/portal/:moduleId/login" element={<ModuleLogin />} />

      {/* Legacy login fallback */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* 3. Protected Module Workspace & Navigation Workflows */}
      <Route
        path="/portal/:moduleId"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ModuleDashboardWrapper />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="students" element={<StudentInformation />} />
        <Route path="enrollment" element={<DataRegistration />} />
        <Route path="criminal-tracking" element={<CriminalTracking />} />
        <Route path="add-criminal" element={<AddCriminal />} />
        <Route path="anpr" element={<AnprSystem />} />
        <Route path="missing-child" element={<MissingChild />} />
        <Route path="add-missing-child" element={<AddMissingChild />} />
        <Route path="defence" element={<DefenceTracker />} />
        <Route path="cameras" element={<CameraNetwork />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="maps" element={<Maps />} />
        <Route path="reports" element={<Reports />} />
        <Route path="registered-data" element={<RegisteredData />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect to Purpose Selector */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught exception]:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md shadow-2xl space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Application Error Recovered</h2>
            <p className="text-sm text-slate-300">
              An unexpected runtime error occurred. You can reset your session to restore default state.
            </p>
            <p className="text-xs font-mono bg-slate-950 p-3 rounded text-red-300 text-left overflow-x-auto max-h-32">
              {this.state.error?.toString() || 'Unknown Error'}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white transition-colors"
            >
              Reset Session & Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);
  return null;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
