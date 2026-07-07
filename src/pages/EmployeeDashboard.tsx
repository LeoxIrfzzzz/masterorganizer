import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Chat from '../components/Chat';
import { 
  getCurrentUser, getTasksByUser, getAttendance, clockIn, clockOut, markAbsent,
  updateTaskStatus, updateTask, addLeaveRequest, getLeaveRequests, clearDB, 
  getActivityLog, logActivity, updateUserTheme, getAnnouncements, awardBadge,
  addClaim, getClaims, getConnectedDevices, getNotifications, markNotificationRead,
  User, Task, LeaveRequest, ActivityLogItem, Announcement, Attendance, FinancialClaim, AppNotification
} from '../db/store';
import { CheckSquare, TrendingUp, Trash2, Activity, Clock, Tag, Play, Pause, RotateCcw, Pin, Smile, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

function EmployeeHome() {
  const [user, setUser] = useState<User | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [streak, setStreak] = useState(0);
  const [chartData, setChartData] = useState<{name:string, value:number}[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [mood, setMood] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'Work' | 'Break'>('Work');

  const loadData = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (!currentUser) return;
    
    const attendance = getAttendance().filter(a => a.userId === currentUser.id);
    const today = new Date().toISOString().split('T')[0];
    const todayRec = attendance.find(a => a.date === today);
    setTodayAttendance(todayRec || null);
    
    const currStreak = attendance.filter(a => a.status === 'present').length;
    setStreak(currStreak);
    
    if (currStreak >= 5) awardBadge(currentUser.id, '5-Day Streak');

    const tasks = getTasksByUser(currentUser.id);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.length - completedTasks;
    
    if (completedTasks >= 10) awardBadge(currentUser.id, 'Speed Demon');
    
    setChartData([
      { name: 'Completed Works', value: completedTasks },
      { name: 'Pending Works', value: pendingTasks },
      { name: 'Attendance Streak', value: currStreak }
    ]);

    setAnnouncements(getAnnouncements());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  useEffect(() => {
    let interval: any;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timerRunning && timeLeft === 0) {
      if (timerMode === 'Work') {
        logActivity(`[Pomodoro] ${user?.name} completed a 25m focus session!`);
        awardBadge(user?.id || '', 'Focus Master');
        setTimerMode('Break');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('Work');
        setTimeLeft(25 * 60);
        setTimerRunning(false);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const handleClockIn = () => {
    if (!user) return;
    clockIn(user.id, 5); // Default mood to 5
    logActivity(`[Attendance] ${user.name} marked as Present for today.`);
    // Trigger update
    window.dispatchEvent(new Event('local-db-updated'));
  };

  const handleClockOut = () => {
    if (!user) return;
    clockOut(user.id);
    logActivity(`[Attendance] ${user.name} checked out early for the day.`);
    window.dispatchEvent(new Event('local-db-updated'));
  };

  const handleMarkAbsent = () => {
    if (!user) return;
    markAbsent(user.id);
    logActivity(`[Attendance] ${user.name} marked as Absent for today.`);
    window.dispatchEvent(new Event('local-db-updated'));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAbsent = todayAttendance?.status === 'absent';
  const hasClockedIn = !!todayAttendance?.clockIn;
  const hasClockedOut = !!todayAttendance?.clockOut;
  const disablePresentAbsent = isAbsent || hasClockedIn;
  const disableExit = isAbsent || !hasClockedIn || hasClockedOut;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}</h1>
      
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3>Today's Attendance</h3>
          {/* Status Display Area */}
          <div style={{ marginTop: '1rem', minHeight: '4.5rem' }}>
            {isAbsent && <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Marked Absent</div>}
            
            {hasClockedIn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ color: 'var(--success-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={16} /> Marked Present
                </div>
                <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  Entry Time: <strong style={{ color: '#fff' }}>{new Date(todayAttendance!.clockIn!).toLocaleTimeString()}</strong>
                </div>
                {hasClockedOut && (
                  <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                    Exit Time: <strong style={{ color: '#fff' }}>{new Date(todayAttendance!.clockOut!).toLocaleTimeString()}</strong>
                  </div>
                )}
              </div>
            )}
            
            {!isAbsent && !hasClockedIn && (
               <p style={{ opacity: 0.8, margin: 0 }}>You haven't marked your attendance for today yet.</p>
            )}
          </div>

          {/* Persistent Buttons Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            
            {/* Row 1: Entry and Exit */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, opacity: disablePresentAbsent ? 0.4 : 1, cursor: disablePresentAbsent ? 'not-allowed' : 'pointer' }} 
                onClick={handleClockIn}
                disabled={disablePresentAbsent}
              >
                Entry
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, border: '1px solid var(--danger-color)', color: 'var(--danger-color)', opacity: disableExit ? 0.4 : 1, cursor: disableExit ? 'not-allowed' : 'pointer' }} 
                onClick={handleClockOut}
                disabled={disableExit}
              >
                Exit
              </button>
            </div>

            {/* Row 2: Present and Absent */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: disablePresentAbsent ? 0.4 : 1, cursor: disablePresentAbsent ? 'not-allowed' : 'pointer' }} 
                onClick={handleClockIn}
                disabled={disablePresentAbsent}
              >
                <CheckSquare size={18} /> Present
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, border: '1px solid var(--danger-color)', color: 'var(--danger-color)', opacity: disablePresentAbsent ? 0.4 : 1, cursor: disablePresentAbsent ? 'not-allowed' : 'pointer' }} 
                onClick={handleMarkAbsent}
                disabled={disablePresentAbsent}
              >
                Absent
              </button>
            </div>

            {/* Row 3: Emergency / Today Out */}
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', border: '1px solid var(--warning-color)', color: 'var(--warning-color)', opacity: disableExit ? 0.4 : 1, cursor: disableExit ? 'not-allowed' : 'pointer' }} 
              onClick={handleClockOut}
              disabled={disableExit}
            >
              Emergency / Today Out
            </button>
          </div>
        </div>
        
        <div className="glass-card flex-between" style={{ padding: '2rem' }}>
          <div>
            <h3>Current Streak</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{streak} Days</div>
          </div>
          <TrendingUp size={48} opacity={0.3} />
        </div>

        <div className="glass-card" style={{ padding: '1rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, opacity: 0.8 }}>Pomodoro Focus</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: timerMode === 'Work' ? 'var(--glow-color)' : 'var(--success-color)' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? <Pause size={16}/> : <Play size={16}/>}</button>
            <button className="btn btn-secondary" onClick={() => {setTimerRunning(false); setTimeLeft(timerMode==='Work'? 25*60 : 5*60)}}><RotateCcw size={16}/></button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2>My Performance Metrics</h2>
          <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="var(--light-text)" />
                <YAxis stroke="var(--light-text)" />
                <RechartsTooltip contentStyle={{ background: 'var(--darker-bg)', border: '1px solid var(--glass-border)', color: 'var(--dark-text)' }} />
                <Bar dataKey="value" fill="var(--glow-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h2><Pin size={24} style={{verticalAlign:'bottom'}} /> Global Notice Board</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {announcements.length === 0 ? <p>No announcements.</p> : announcements.slice(0,5).map(a => (
              <div key={a.id} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(a.date).toLocaleDateString()}</div>
                <div style={{ fontSize: '1rem' }}>{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const loadTasks = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setTasks(getTasksByUser(currentUser.id));
    }
  };

  useEffect(() => {
    loadTasks();
    window.addEventListener('local-db-updated', loadTasks);
    return () => window.removeEventListener('local-db-updated', loadTasks);
  }, []);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    changeTaskStatus(taskId, newStatus);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const changeTaskStatus = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskStatus(taskId, newStatus);
      logActivity(`[Task] ${user?.name} moved "${task.title.substring(0,15)}..." to ${newStatus}`);
    }
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subTasks) {
      const updatedSub = task.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
      updateTask(taskId, { subTasks: updatedSub });
    }
  };

  const columns: { title: string, status: Task['status'] }[] = [
    { title: 'Incomplete', status: 'incomplete' },
    { title: 'On Process', status: 'on process' },
    { title: 'Completed', status: 'completed' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Kanban Board</h1>
      <div className="kanban-board">
        {columns.map(col => (
          <div key={col.status} className="kanban-column" onDrop={(e) => handleDrop(e, col.status)} onDragOver={handleDragOver}>
            <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              {col.title} ({tasks.filter(t => t.status === col.status).length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto' }}>
              {tasks.filter(t => t.status === col.status).map(t => (
                <div key={t.id} className="glass-card kanban-card" draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ display: 'block', marginBottom: '0.4rem' }}>{t.title}</strong>
                    {t.priority === 'High' && <span className="badge badge-danger">High</span>}
                    {t.priority === 'Medium' && <span className="badge badge-warning">Med</span>}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.8rem' }}>{t.description}</div>
                  
                  {t.subTasks && t.subTasks.length > 0 && (
                    <div style={{ marginBottom: '0.8rem', fontSize: '0.8rem' }}>
                      <div style={{ opacity: 0.7, marginBottom: '0.3rem' }}>Checklist:</div>
                      {t.subTasks.map(st => (
                        <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: st.completed ? 0.5 : 1 }}>
                          <input type="checkbox" checked={st.completed} onChange={() => toggleSubTask(t.id, st.id)} />
                          <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {t.resourceLink && (
                    <div style={{ fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                      <a href={t.resourceLink} target="_blank" rel="noreferrer" style={{ color: 'var(--glow-color)' }}>Attached Resource</a>
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', opacity: 0.6, display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Due: {t.timeline}</span>
                    <select 
                      value={t.status} 
                      onChange={e => changeTaskStatus(t.id, e.target.value as Task['status'])}
                      style={{ background: 'var(--darker-bg)', color: 'var(--dark-text)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '0.2rem' }}
                    >
                      <option value="incomplete">Incomplete</option>
                      <option value="on process">On Process</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeClaims() {
  const user = getCurrentUser();
  const [claims, setClaims] = useState<FinancialClaim[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Travel');
  const [description, setDescription] = useState('');

  const loadClaims = () => {
    if(user) setClaims(getClaims().filter(c => c.userId === user.id));
  };

  useEffect(() => {
    loadClaims();
    window.addEventListener('local-db-updated', loadClaims);
    return () => window.removeEventListener('local-db-updated', loadClaims);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(user && amount) {
      addClaim(user.id, parseFloat(amount), category, description);
      logActivity(`[Finance] ${user.name} submitted a $${amount} expense claim.`);
      setAmount(''); setDescription('');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Reimbursement Claims</h1>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>Submit New Expense</h2>
        <form onSubmit={handleSubmit} className="grid-2" style={{ marginTop: '1rem' }}>
          <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" className="form-control" value={amount} onChange={e=>setAmount(e.target.value)} required /></div>
          <div className="form-group"><label>Category</label><select className="form-control" value={category} onChange={e=>setCategory(e.target.value)}><option>Travel</option><option>Office Supplies</option><option>Meals</option><option>Other</option></select></div>
          <div className="form-group col-span-2"><label>Description / Reason</label><textarea className="form-control" value={description} onChange={e=>setDescription(e.target.value)} required rows={2} /></div>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>Submit Claim</button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>My Submitted Claims</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {claims.sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => (
            <div key={c.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>${c.amount.toFixed(2)} - {c.category}</h4>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic' }}>"{c.description}" ({new Date(c.date).toLocaleDateString()})</div>
              </div>
              <span className={`badge ${c.status === 'approved' ? 'badge-success' : c.status === 'denied' ? 'badge-danger' : 'badge-warning'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeLeave() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const loadRequests = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setRequests(getLeaveRequests().filter(r => r.userId === currentUser.id));
    }
  };

  useEffect(() => {
    loadRequests();
    window.addEventListener('local-db-updated', loadRequests);
    return () => window.removeEventListener('local-db-updated', loadRequests);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addLeaveRequest(user.id, date, reason);
    logActivity(`[Request] ${user.name} submitted a leave request for ${date}`);
    setDate('');
    setReason('');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Time-Off Requests</h1>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>Submit Application</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
          <textarea className="form-control" placeholder="Provide detailed reasoning for your request..." value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}></textarea>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>Submit Application</button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>My Request History</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(r => (
            <div key={r.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>Date: {r.date}</h4>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic' }}>"{r.reason}"</div>
              </div>
              <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'disapproved' ? 'badge-danger' : 'badge-warning'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeSettings() {
  const user = getCurrentUser();
  const [themeColor, setThemeColor] = useState(user?.themeColor || '#ffffff');
  const [isLightMode, setIsLightMode] = useState(!!user?.isLightMode);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    getConnectedDevices((devs) => {
      setDevices(devs);
    });
  }, []);

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateUserTheme(user.id, themeColor, isLightMode);
      alert('Personal theme updated!');
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("WARNING: This app is based on local storage. Deleting this will erase ALL company data, including admin data, from this device permanently. Once deleted, it CANNOT BE RESTORED. Are you sure you want to proceed?")) {
      clearDB();
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>System Preferences</h1>
      <div className="grid-2">
        <div className="glass-panel">
          <h2>Personal Aesthetics</h2>
          <form onSubmit={handleSaveTheme} style={{ marginTop: '1rem' }}>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem', lineHeight: '1.6' }}>Choose your personal glowing accent color and layout mode.</p>
            
            <div className="form-group">
              <label>Accent Color (Neon Glow)</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: '50px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                <span>{themeColor}</span>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isLightMode} onChange={e => setIsLightMode(e.target.checked)} />
                Enable Frosted Light Mode
              </label>
            </div>

            <button type="submit" className="btn btn-primary">Apply Theme</button>
          </form>
        </div>

        <div className="glass-panel">
          <h2>Connected Devices (P2P Network)</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Active nodes connected to this decentralized workspace.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {devices.length === 0 ? <p>Scanning P2P network...</p> : devices.map(d => (
              <div key={d.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{d.user}</h4>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>{d.userAgent.substring(0, 50)}...</div>
                </div>
                <span className="badge badge-success">Online ({Math.floor((Date.now() - d.lastActive)/1000)}s ago)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ border: '1px solid var(--danger-color)' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>Destructive Action</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem', lineHeight: '1.6' }}>
            <strong>Attention:</strong> Masterorganizer operates as a decentralized application. All attendance, tasks, and credentials exist <em>only in this browser's local storage</em>. 
            If you execute this action, all records for this entire workspace will be permanently lost and cannot be restored.
          </p>
          <button className="btn btn-danger" onClick={handleDeleteAll} style={{ width: '100%' }}><Trash2 size={18}/> Execute Local Data Wipe</button>
        </div>

        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '1rem', padding: '2rem' }}>
          <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>About the Developer</h3>
          <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>Built by Mohammed Irfaan Zayn</p>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>For more solutions-based softwares contact: <br/><strong style={{color: '#fff'}}>+91 6383027257</strong></p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  useEffect(() => {
    const loadAct = () => {
      setActivities(getActivityLog().slice(0, 15));
      const user = getCurrentUser();
      if (user) {
        setNotifications(getNotifications().filter(n => n.targetUserId === user.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    };
    loadAct();
    window.addEventListener('local-db-updated', loadAct);
    return () => window.removeEventListener('local-db-updated', loadAct);
  }, []);

  return (
    <div className="dashboard-layout">
      <Header role="employee" onToggleLogs={() => setIsLogsOpen(!isLogsOpen)} />
      
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<EmployeeHome />} />
            <Route path="/tasks" element={<EmployeeKanban />} />
            <Route path="/claims" element={<EmployeeClaims />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/leave" element={<EmployeeLeave />} />
            <Route path="/settings" element={<EmployeeSettings />} />
          </Routes>
        </div>

      {/* Collapsible Global Notifications Panel */}
      <div style={{ 
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '300px', 
        background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', borderLeft: '1px solid var(--glass-border)',
        transform: isLogsOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column', padding: '2rem', zIndex: 10, boxShadow: '-5px 0 30px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={18}/> My Notifications</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {notifications.length === 0 ? <p style={{ fontSize: '0.9rem' }}>No new notifications.</p> : notifications.map(notif => (
            <div key={notif.id} style={{ padding: '0.8rem', background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)', borderLeft: '2px solid var(--accent-color)', borderRadius: '4px', cursor: 'pointer' }} onClick={() => markNotificationRead(notif.id)}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{notif.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.2rem' }}>{notif.body}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem' }}>{new Date(notif.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
