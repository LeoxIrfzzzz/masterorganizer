import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCompanyInfo, setCompanyInfo, verifyAdminLogin, loginEmployee, connectToPeer, getUsers, setCurrentUser, getCurrentUser } from '../db/store';
import { Shield, Users, ArrowRight, Link as LinkIcon, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export function LandingPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/employee', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-container">
      <h1 style={{ fontSize: 'clamp(1.5rem, 7vw, 4rem)', marginBottom: '0.5rem', animation: 'fadeInDown 1s' }}>MASTER<span style={{color: 'var(--accent-color)'}}>ORGANIZER</span></h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.8, letterSpacing: '2px', textTransform: 'uppercase' }}>Ultimate Productivity & Synchronization</p>
      
      <div className="landing-cards">
        <Link to="/admin-login" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ width: '280px', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Shield size={64} color="#ffffff" />
            <h2 style={{ margin: 0 }}>Admin Portal</h2>
            <p style={{ margin: 0, opacity: 0.7 }}>Manage your workspace</p>
            <div className="btn btn-secondary" style={{ marginTop: '1rem' }}>Enter <ArrowRight size={16}/></div>
          </div>
        </Link>

        <Link to="/employee-login" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ width: '280px', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Users size={64} color="#ffffff" />
            <h2 style={{ margin: 0 }}>Employee Portal</h2>
            <p style={{ margin: 0, opacity: 0.7 }}>Access your tasks</p>
            <div className="btn btn-primary" style={{ marginTop: '1rem' }}>Enter <ArrowRight size={16}/></div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 300 }}>Want to sync an existing workspace?</h3>
        <Link to="/link-device" style={{ textDecoration: 'none' }}>
          <div className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <LinkIcon size={18}/> Link New Device (QR Code)
          </div>
        </Link>
      </div>
    </div>
  );
}

export function LinkDevicePage() {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = (rawId: string) => {
    setConnecting(true);
    let targetPeerId = rawId;
    let autoLoginEmployeeId: string | null = null;
    
    if (rawId.includes(':')) {
      const parts = rawId.split(':');
      targetPeerId = parts[0];
      autoLoginEmployeeId = parts[1];
    }

    connectToPeer(targetPeerId, 
      () => {
        // Connected to peer
      },
      () => {
        // Sync complete
        if (autoLoginEmployeeId) {
          const users = getUsers();
          const emp = users.find(u => u.id === autoLoginEmployeeId);
          if (emp) {
            setCurrentUser(emp);
            navigate('/employee', { replace: true });
            return;
          }
        }
        setTimeout(() => navigate('/admin-login', { replace: true }), 1000);
      }
    );
  };

  return (
    <div className="landing-container">
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h2><Camera size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}/> Scan Pairing Code</h2>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>Scan the QR code shown in the Admin Settings of your main device.</p>
        
        {connecting ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p>Establishing secure WebRTC tunnel...</p>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem' }}>
              <Scanner onScan={(result) => handleConnect(result[0].rawValue)} />
            </div>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>OR</div>
            <div className="form-group">
              <label>Enter Connection Code Manually</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="Peer ID..." />
                <button className="btn btn-primary" onClick={() => handleConnect(manualId)}>Connect</button>
              </div>
            </div>
          </>
        )}
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/')}>Cancel</button>
      </div>
    </div>
  );
}

export function AdminAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [companyInfo, setCompanyInfoState] = useState(getCompanyInfo());
  const isRegistered = !!companyInfo?.name && !!companyInfo?.adminPassword;

  useEffect(() => {
    const handleUpdate = () => setCompanyInfoState(getCompanyInfo());
    window.addEventListener('local-db-updated', handleUpdate);
    return () => window.removeEventListener('local-db-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (isRegistered) {
      setStep(4);
    }
  }, [isRegistered]);

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedOtp(code);
    alert(`[Simulated Email to ${email}]\nYour OTP Code is: ${code}`);
    setStep(2);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === expectedOtp) {
      setStep(3);
    } else {
      alert('Invalid OTP');
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyInfo({ name: companyName, email, adminPassword: password });
    setStep(4);
    alert('Admin account created successfully!');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminLogin(loginPassword)) {
      navigate('/admin', { replace: true });
    } else {
      alert('Incorrect Admin Password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--accent-color)', display: 'inline-block', marginBottom: '1rem' }}>&larr; Back to Home</Link>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Shield size={48} color="#ffffff" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
          <h2 style={{ marginTop: '1rem' }}>Admin Secure Portal</h2>
        </div>

        {!isRegistered && step === 1 && (
          <form onSubmit={handleSendOTP} style={{ animation: 'fadeIn 0.5s' }}>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" className="form-control" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Admin Email</label>
              <input type="email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Verification OTP</button>
          </form>
        )}

        {!isRegistered && step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ animation: 'fadeIn 0.5s' }}>
            <div className="form-group">
              <label>Enter 4-Digit OTP</label>
              <input type="text" className="form-control" required value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Verify OTP</button>
          </form>
        )}

        {!isRegistered && step === 3 && (
          <form onSubmit={handleSetPassword} style={{ animation: 'fadeIn 0.5s' }}>
            <div className="form-group">
              <label>Set Master Password</label>
              <input type="password" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Workspace</button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleLogin} style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.8 }}>
              Workspace: <strong style={{color: '#fff'}}>{companyInfo.name || 'Company'}</strong>
            </div>
            <div className="form-group">
              <label>Master Password</label>
              <input type="password" className="form-control" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Access Dashboard</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function EmployeeAuth() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyInfo, setCompanyInfoState] = useState(getCompanyInfo());

  useEffect(() => {
    const handleUpdate = () => setCompanyInfoState(getCompanyInfo());
    window.addEventListener('local-db-updated', handleUpdate);
    return () => window.removeEventListener('local-db-updated', handleUpdate);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginEmployee(username, password);
    if (user) {
      navigate('/employee', { replace: true });
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--accent-color)', display: 'inline-block', marginBottom: '1rem' }}>&larr; Back to Home</Link>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Users size={48} color="#ffffff" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
          <h2 style={{ marginTop: '1rem' }}>Employee Login</h2>
        </div>

        {!companyInfo?.name ? (
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            <p>Workspace offline.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ animation: 'fadeIn 0.5s' }}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" required value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Enter Workspace</button>
          </form>
        )}
      </div>
    </div>
  );
}
