import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCompanyInfo, setCompanyInfo, verifyAdminLogin, loginEmployee } from '../db/store';
import { Shield, Users, ArrowRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="landing-container">
      <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'fadeInDown 1s' }}>MASTER<span style={{color: 'var(--accent-color)'}}>ORGANIZER</span></h1>
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

  const companyInfo = getCompanyInfo();
  const isRegistered = !!companyInfo?.name && !!companyInfo?.adminPassword;

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
      navigate('/admin');
    } else {
      alert('Incorrect Admin Password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
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
  const companyInfo = getCompanyInfo();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginEmployee(username, password);
    if (user) {
      navigate('/employee');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
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
