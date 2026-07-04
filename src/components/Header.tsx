import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, CheckSquare, Calendar, Activity, Settings, MessageSquare, Bell, Menu, DollarSign } from 'lucide-react';
import { logout, getCurrentUser } from '../db/store';

interface HeaderProps {
  role: 'admin' | 'employee';
  onToggleLogs: () => void;
}

export default function Header({ role, onToggleLogs }: HeaderProps) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="header-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={24} />
        </button>
        
        <h2 className="desktop-brand" style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px', cursor: 'pointer', marginRight: '2rem' }} onClick={() => navigate(`/${role}`)}>
          MASTER<span style={{color: 'var(--accent-color)'}}>ORG</span>
        </h2>
        
        <nav className={`header-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {role === 'admin' ? (
            <>
              <NavLink to="/admin" end onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Activity size={18} /> Dashboard</NavLink>
              <NavLink to="/admin/employees" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Users size={18} /> Directory</NavLink>
              <NavLink to="/admin/tasks" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><CheckSquare size={18} /> Tasks</NavLink>
              <NavLink to="/admin/timeline" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Calendar size={18} /> Timeline</NavLink>
              <NavLink to="/admin/financials" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><DollarSign size={18} /> Financials</NavLink>
              <NavLink to="/admin/chat" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><MessageSquare size={18} /> Comms</NavLink>
              <NavLink to="/admin/settings" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Settings size={18} /> Settings</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/employee" end onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Home size={18} /> Home</NavLink>
              <NavLink to="/employee/tasks" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><CheckSquare size={18} /> My Tasks</NavLink>
              <NavLink to="/employee/claims" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><DollarSign size={18} /> Claims</NavLink>
              <NavLink to="/employee/chat" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><MessageSquare size={18} /> Comms</NavLink>
              <NavLink to="/employee/leave" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Calendar size={18} /> Time Off</NavLink>
              <NavLink to="/employee/settings" onClick={closeMenu} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><Settings size={18} /> Settings</NavLink>
            </>
          )}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && <div className="desktop-brand" style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.name}</div>}
        
        <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={onToggleLogs} title="Toggle Network Logs">
          <Bell size={16} />
        </button>

        <button onClick={handleLogout} className="btn" style={{ borderColor: 'rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem' }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
