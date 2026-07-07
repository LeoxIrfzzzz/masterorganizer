import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage, AdminAuth, EmployeeAuth } from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { getCurrentUser, getNotifications, markNotificationRead } from './db/store';

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
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleDBUpdate = () => {
      // 1. Apply Theme
      const user = getCurrentUser();
      const color = user?.themeColor || '#ffffff';
      document.documentElement.style.setProperty('--glow-color', color);
      
      if (user?.isLightMode) {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }

      // 2. Process Notifications
      if (user && 'Notification' in window && Notification.permission === 'granted') {
        const unread = getNotifications().filter(n => n.targetUserId === user.id && !n.read);
        unread.forEach(n => {
          new Notification(n.title, { body: n.body, icon: '/favicon.svg' });
          markNotificationRead(n.id);
        });
      }
    };

    handleDBUpdate();
    window.addEventListener('local-db-updated', handleDBUpdate);
    return () => window.removeEventListener('local-db-updated', handleDBUpdate);
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
