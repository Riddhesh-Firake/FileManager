import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FileProvider } from './context/FileContext';
import GlobalStyles from './components/GlobalStyles';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import MyFiles from './pages/MyFiles';
import Recent from './pages/Recent';
import Starred from './pages/Starred';
import Trash from './pages/Trash';
import Shared from './pages/Shared';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <Router>
      <GlobalStyles />
      <FileProvider>
        {/* Removed fixed height/overflow from here to let pages control their own layout */}
        <div className="font-sans text-[#191A23] selection:bg-[#B9FF66] selection:text-black">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Navigate to="/dashboard/my-files" replace /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/my-files" element={<ProtectedRoute><DashboardLayout><MyFiles /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/recent" element={<ProtectedRoute><DashboardLayout><Recent /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/shared" element={<ProtectedRoute><DashboardLayout><Shared /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/starred" element={<ProtectedRoute><DashboardLayout><Starred /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/trash" element={<ProtectedRoute><DashboardLayout><Trash /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </FileProvider>
    </Router>
  );
}