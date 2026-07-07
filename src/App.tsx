import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage, AdminAuth, EmployeeAuth, LinkDevicePage } from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { getCurrentUser, getNotifications, markNotificationRead, registerDevicePresence, autoReconnect } from './db/store';

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

    autoReconnect();

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
          new Notification(n.title, { body: n.body, icon: '/icon.svg' });
          markNotificationRead(n.id);
        });
      }
    };

    handleDBUpdate();
    window.addEventListener('local-db-updated', handleDBUpdate);
    
    // Ping P2P presence every 10 seconds
    registerDevicePresence();
    const presenceInterval = setInterval(registerDevicePresence, 10000);

    return () => {
      window.removeEventListener('local-db-updated', handleDBUpdate);
      clearInterval(presenceInterval);
    };
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/link-device" element={<LinkDevicePage />} />
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
        </div>
        <footer style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          Built by Mohammed Irfaan Zayn
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
