import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Forecast from './pages/Forecast';
import AlertCenter from './pages/AlertCenter';
import AuditLogs from './pages/AuditLogs';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-3 font-bold text-slate-400">Verifying authorization...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-darkBg text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route
            path="/sales"
            element={
              ['admin', 'pharmacist'].includes(user.role)
                ? <Sales />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route
            path="/audit-logs"
            element={
              user.role === 'admin'
                ? <AuditLogs />
                : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
