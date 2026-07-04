import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage, AdminAuth, EmployeeAuth } from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { getCurrentUser } from './db/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'employee';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }
  return <>{children}</>;
};

function App() {
  React.useEffect(() => {
    const applyTheme = () => {
      const user = getCurrentUser();
      const color = user?.themeColor || '#ffffff';
      document.documentElement.style.setProperty('--glow-color', color);
      
      if (user?.isLightMode) {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    };
    applyTheme();
    window.addEventListener('local-db-updated', applyTheme);
    return () => window.removeEventListener('local-db-updated', applyTheme);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<AdminAuth />} />
        <Route path="/employee-login" element={<EmployeeAuth />} />
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/employee/*" element={
          <ProtectedRoute allowedRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
