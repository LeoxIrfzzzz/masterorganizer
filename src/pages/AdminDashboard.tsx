import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Chat from '../components/Chat';
import { 
  getUsers, getAttendance, getTasks, getLeaveRequests, addUser, addTask, 
  updateLeaveRequest, getCompanyInfo, setCompanyInfo, clearDB, exportDB, importDB,
  updateUser, deleteUser, deleteTask, logActivity, getActivityLog, updateUserTheme,
  getAnnouncements, addAnnouncement, getClaims, updateClaimStatus, getConnectedDevices,
  User, Task, Attendance, LeaveRequest, ActivityLogItem, Announcement, FinancialClaim
} from '../db/store';
import { Users, CheckCircle, AlertCircle, Trash2, Edit2, Activity, Award, Briefcase, Tag, Download, Upload, Pin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import NodeVisualizer from '../components/NodeVisualizer';

function DashboardHome() {
  const [stats, setStats] = useState({ employees: 0, presentToday: 0, tasksCompleted: 0, pendingLeaves: 0 });
  const [attendanceData, setAttendanceData] = useState<{name:string, Present:number}[]>([]);
  const [taskData, setTaskData] = useState<{name:string, value:number}[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const loadData = () => {
    const users = getUsers().filter(u => u.role === 'employee');
    const attendance = getAttendance();
    const tasks = getTasks();
    const leaves = getLeaveRequests();
    
    const today = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === today && a.status === 'present').length;
    
    setStats({
      employees: users.length,
      presentToday,
      tasksCompleted: tasks.filter(t => t.status === 'completed').length,
      pendingLeaves: leaves.filter(l => l.status === 'pending').length
    });

    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    setAttendanceData(last7Days.map(date => ({
      name: date.split('-').slice(1).join('/'),
      Present: attendance.filter(a => a.date === date && a.status === 'present').length,
    })));

    setTaskData([
      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
      { name: 'On Process', value: tasks.filter(t => t.status === 'on process').length },
      { name: 'Incomplete', value: tasks.filter(t => t.status === 'incomplete').length }
    ]);

    const board = users.sort((a, b) => {
      const aTasks = tasks.filter(t => t.assignedTo === a.id && t.status === 'completed').length;
      const bTasks = tasks.filter(t => t.assignedTo === b.id && t.status === 'completed').length;
      return bTasks - aTasks;
    }).slice(0, 5);
    setLeaderboard(board);

    setAnnouncements(getAnnouncements());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if(newAnnouncement.trim()) {
      addAnnouncement(newAnnouncement);
      setNewAnnouncement('');
      logActivity("Posted new global announcement.");
    }
  };

  const COLORS = ['var(--glow-color)', 'var(--accent-color)', 'var(--secondary-color)'];

  return (
    <div>
      <div style={{ position: 'relative', height: '150px', marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <NodeVisualizer />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, var(--darker-bg), transparent)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <h1 style={{ margin: 0, textShadow: '2px 2px 10px #000' }}>Enterprise Node Matrix</h1>
          <p style={{ margin: 0, color: 'var(--light-text)', textShadow: '1px 1px 5px #000' }}>Real-time local node synchronization</p>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card flex-between">
          <div>
            <h3>Workforce</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.employees}</div>
          </div>
          <Users size={48} opacity={0.3} />
        </div>
        <div className="glass-card flex-between">
          <div>
            <h3>Checked In Today</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.presentToday}</div>
          </div>
          <CheckCircle size={48} opacity={0.3} />
        </div>
        <div className="glass-card flex-between">
          <div>
            <h3>Pending Requests</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.pendingLeaves}</div>
          </div>
          <AlertCircle size={48} opacity={0.3} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ height: '350px' }}>
          <h2>7-Day Check-in Rate</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" stroke="var(--light-text)" />
              <YAxis stroke="var(--light-text)" />
              <RechartsTooltip contentStyle={{ background: 'var(--darker-bg)', border: '1px solid var(--glass-border)', color: 'var(--dark-text)' }} />
              <Bar dataKey="Present" fill="var(--glow-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel" style={{ height: '350px' }}>
          <h2>Global Workload Distribution</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ background: 'var(--darker-bg)', border: '1px solid var(--glass-border)', color: 'var(--dark-text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-panel">
          <h2><Award size={24} style={{verticalAlign:'bottom'}} /> Performance Leaderboard</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard.length === 0 ? <p>No completed tasks yet.</p> : leaderboard.map((l, i) => {
              const completedTasks = getTasks().filter(t => t.assignedTo === l.id && t.status === 'completed').length;
              return (
                <div key={l.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{i+1}</strong> {l.name}
                    {l.badges && l.badges.map(b => (
                      <span key={b} className="badge badge-success" style={{ marginLeft: '0.5rem', background: 'var(--glow-color)', color: '#000' }}>{b}</span>
                    ))}
                  </div>
                  <div>{completedTasks} Tasks Delivered</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel">
          <h2><Pin size={24} style={{verticalAlign:'bottom'}} /> Global Notice Board</h2>
          <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
            <input type="text" className="form-control" style={{flex: 1}} placeholder="Write an announcement..." value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} required/>
            <button type="submit" className="btn btn-primary">Post</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {announcements.length === 0 ? <p>No announcements.</p> : announcements.slice(0,4).map(a => (
              <div key={a.id} className="glass-card" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(a.date).toLocaleDateString()}</div>
                <div>{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeManagement() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [job, setJob] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});

  const loadEmployees = () => setEmployees(getUsers().filter(u => u.role === 'employee'));

  useEffect(() => {
    loadEmployees();
    window.addEventListener('local-db-updated', loadEmployees);
    return () => window.removeEventListener('local-db-updated', loadEmployees);
  }, []);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({ name, username, password, role: 'employee', job, department, email, phone });
    logActivity(`Onboarded new employee: ${name} (${department})`);
    setName(''); setUsername(''); setPassword(''); setJob(''); setDepartment(''); setEmail(''); setPhone('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateUser(editId, editData);
      logActivity(`Updated credentials for employee: ${editData.name}`);
      setEditId(null);
    }
  };

  const handleDelete = (id: string, ename: string) => {
    if (window.confirm("Are you sure you want to delete this employee and all their associated data?")) {
      deleteUser(id);
      logActivity(`Terminated employee: ${ename}`);
    }
  };

  const departments = Array.from(new Set(employees.map(e => e.department || 'Unassigned')));

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Workforce Directory</h1>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>Onboard Employee</h2>
        <form onSubmit={handleAddEmployee} className="grid-3" style={{ marginTop: '1rem' }}>
          <div className="form-group"><label>Full Name</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>Job Title</label><input type="text" className="form-control" value={job} onChange={e => setJob(e.target.value)} required /></div>
          <div className="form-group"><label>Department</label><input type="text" className="form-control" value={department} onChange={e => setDepartment(e.target.value)} required /></div>
          <div className="form-group"><label>Email Address</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="form-group"><label>Phone Number</label><input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
          <div className="form-group"><label>System Username</label><input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required /></div>
          <div className="form-group" style={{ gridColumn: '1 / span 2' }}><label>Initial Password</label><input type="text" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'end', marginBottom: '1.5rem' }}>Onboard</button>
        </form>
      </div>
      
      {departments.map(dept => {
        const deptEmployees = employees.filter(e => (e.department || 'Unassigned') === dept);
        return (
          <div key={dept} className="glass-panel" style={{ marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
              <span>{dept} Division</span>
              <span className="badge badge-secondary">{deptEmployees.length} Personnel</span>
            </h2>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deptEmployees.map(emp => (
                editId === emp.id ? (
                  <form key={emp.id} onSubmit={handleSaveEdit} className="glass-card grid-3" style={{ gap: '1rem' }}>
                    <input type="text" className="form-control" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" required />
                    <input type="text" className="form-control" value={editData.job || ''} onChange={e => setEditData({...editData, job: e.target.value})} placeholder="Job" required />
                    <input type="text" className="form-control" value={editData.department || ''} onChange={e => setEditData({...editData, department: e.target.value})} placeholder="Dept" required />
                    <input type="text" className="form-control" value={editData.username || ''} onChange={e => setEditData({...editData, username: e.target.value})} placeholder="Username" required />
                    <input type="text" className="form-control" value={editData.password || ''} onChange={e => setEditData({...editData, password: e.target.value})} placeholder="Password" required />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{flex: 1}}>Save</button>
                      <button type="button" className="btn" onClick={() => setEditId(null)} style={{flex: 1}}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div key={emp.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>
                        {emp.name} 
                        {emp.badges?.map(b => <span key={b} className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize:'0.7rem' }}>{b}</span>)}
                      </h3>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span><Briefcase size={12}/> {emp.job}</span>
                        <span>@ {emp.username}</span>
                        <span>Key: {emp.password}</span>
                        <span>Email: {emp.email}</span>
                        <span>Phone: {emp.phone}</span>
                        <span>Joined: {emp.joinDate}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => { setEditId(emp.id); setEditData(emp); }}><Edit2 size={16}/></button>
                      <button className="btn btn-danger" onClick={() => handleDelete(emp.id, emp.name || '')}><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [timeline, setTimeline] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [tags, setTags] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [subTaskInput, setSubTaskInput] = useState('');
  const [draftSubTasks, setDraftSubTasks] = useState<{id:string, text:string, completed:boolean}[]>([]);

  const loadData = () => {
    setTasks(getTasks());
    setEmployees(getUsers().filter(u => u.role === 'employee'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  const handleAddSubTask = () => {
    if(subTaskInput.trim()) {
      setDraftSubTasks([...draftSubTasks, { id: Date.now().toString(), text: subTaskInput, completed: false }]);
      setSubTaskInput('');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === assignedTo);
    addTask({ title, description, assignedTo, timeline, priority, tags, resourceLink, subTasks: draftSubTasks });
    logActivity(`Dispatched [${priority}] task "${title.substring(0,20)}..." to ${emp?.name}`);
    setTitle(''); setDescription(''); setTimeline(''); setTags(''); setResourceLink(''); setDraftSubTasks([]);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Task Dispatch & Control</h1>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAddTask} className="grid-3" style={{ gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
            <label>Task Title</label>
            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <select className="form-control" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.department}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
            <label>Detailed Briefing</label>
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} required rows={2} />
          </div>
          <div className="form-group">
            <label>Resource Link (URL)</label>
            <input type="url" className="form-control" value={resourceLink} onChange={e => setResourceLink(e.target.value)} placeholder="https://..." />
          </div>
          
          <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
            <label>Sub-Tasks Checklist</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" className="form-control" value={subTaskInput} onChange={e=>setSubTaskInput(e.target.value)} placeholder="Add a sub-task..." />
              <button type="button" className="btn btn-secondary" onClick={handleAddSubTask}>Add</button>
            </div>
            {draftSubTasks.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                {draftSubTasks.map((st, i) => <li key={i}>{st.text}</li>)}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input type="date" className="form-control" value={timeline} onChange={e => setTimeline(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-control" value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '2 / span 2' }}>
            <label>Tags (Comma separated)</label>
            <input type="text" className="form-control" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. urgent, frontend, Q3" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>Dispatch Task</button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>Enterprise Workload Matrix</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tasks.map(t => {
            const emp = employees.find(e => e.id === t.assignedTo);
            const totalSub = t.subTasks?.length || 0;
            const compSub = t.subTasks?.filter(st => st.completed).length || 0;
            
            return (
              <div key={t.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{t.title}</h4>
                    {t.priority === 'High' && <span className="badge badge-danger">High</span>}
                    {t.priority === 'Medium' && <span className="badge badge-warning">Med</span>}
                    {t.priority === 'Low' && <span className="badge badge-success" style={{color:'#000'}}>Low</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.4rem', fontStyle: 'italic' }}>{t.description}</div>
                  
                  {totalSub > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ marginBottom: '0.2rem' }}>Sub-tasks ({compSub}/{totalSub})</div>
                      <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                        <div style={{ width: `${(compSub/totalSub)*100}%`, height: '100%', background: 'var(--glow-color)', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  )}

                  {t.resourceLink && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <a href={t.resourceLink} target="_blank" rel="noreferrer" style={{ color: 'var(--glow-color)' }}>Attached Resource Link</a>
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.8rem', display: 'flex', gap: '1rem' }}>
                    <span>Agent: {emp ? emp.name : 'Unknown'}</span>
                    <span>Due: {t.timeline}</span>
                    {t.tags && <span><Tag size={12}/> {t.tags}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                  <span className={`badge ${t.status === 'completed' ? 'badge-success' : t.status === 'on process' ? 'badge-warning' : 'badge-danger'}`}>{t.status}</span>
                  <button className="btn btn-danger" onClick={() => { if(window.confirm('Delete task?')){ deleteTask(t.id); logActivity(`Deleted task "${t.title.substring(0,20)}..."`);} }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GanttTimeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  const loadData = () => {
    setTasks(getTasks().sort((a,b) => new Date(a.timeline).getTime() - new Date(b.timeline).getTime()));
    setEmployees(getUsers().filter(u => u.role === 'employee'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ marginBottom: '2rem' }}>Project Timeline (Gantt)</h1>
      <div className="glass-panel" style={{ flex: 1, overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '800px' }}>
          {tasks.length === 0 ? <p>No scheduled tasks.</p> : tasks.map(t => {
            const emp = employees.find(e => e.id === t.assignedTo);
            const today = new Date().getTime();
            const due = new Date(t.timeline).getTime();
            const isLate = due < today && t.status !== 'completed';
            
            return (
              <div key={t.id} className="glass-card" style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '250px', flexShrink: 0, paddingRight: '1rem', borderRight: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{emp?.name || 'Unassigned'}</div>
                </div>
                <div style={{ flex: 1, paddingLeft: '1rem', position: 'relative' }}>
                  <div style={{ fontSize: '0.9rem' }}>Deadline: {t.timeline}</div>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    height: '10px', 
                    background: isLate ? 'var(--danger-color)' : t.status === 'completed' ? 'var(--glow-color)' : 'var(--accent-color)', 
                    borderRadius: '5px',
                    boxShadow: t.status === 'completed' ? 'var(--glow-shadow)' : 'none',
                    width: t.status === 'completed' ? '100%' : '50%' 
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  const loadData = () => {
    setRequests(getLeaveRequests());
    setEmployees(getUsers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  const handleUpdateStatus = (id: string, status: LeaveRequest['status'], reason: string) => {
    updateLeaveRequest(id, status);
    logActivity(`Marked leave request as ${status}`);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Personnel Requests</h1>
      <div className="glass-panel">
        {requests.length === 0 ? <p>No incoming requests.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(r => {
              const emp = employees.find(e => e.id === r.userId);
              return (
                <div key={r.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{emp ? emp.name : r.userId} <span style={{fontSize: '0.9rem', fontWeight: 'normal', opacity: 0.7}}>({r.date})</span></h3>
                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic', opacity: 0.9 }}>"{r.reason}"</div>
                  </div>
                  {r.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleUpdateStatus(r.id, 'approved', r.reason)}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleUpdateStatus(r.id, 'disapproved', r.reason)}>Deny</button>
                    </div>
                  ) : (
                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage() {
  const [companyInfo, setInfo] = useState({ name: '', email: '', adminPassword: '', themeColor: '#ffffff', isLightMode: false });
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    const info = getCompanyInfo();
    if (info) setInfo({ name: info.name || '', email: info.email || '', adminPassword: info.adminPassword || '', themeColor: info.themeColor || '#ffffff', isLightMode: !!info.isLightMode });
    
    getConnectedDevices((devs) => {
      setDevices(devs);
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyInfo(companyInfo);
    updateUserTheme('admin', companyInfo.themeColor, companyInfo.isLightMode);
    logActivity('Updated company security and theme settings');
    alert('Settings updated successfully.');
  };

  const handleExport = () => {
    const dataStr = exportDB();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `masterorganizer-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        if (importDB(json)) {
          alert("Database imported successfully!");
          window.location.reload();
        } else {
          alert("Failed to import database. Invalid format.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>System Architecture</h1>
      <div className="grid-2">
        <div className="glass-panel">
          <h2>Core Configuration</h2>
          <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
            <div className="form-group"><label>Enterprise Name</label><input type="text" className="form-control" value={companyInfo.name} onChange={e => setInfo({...companyInfo, name: e.target.value})} required /></div>
            <div className="form-group"><label>Admin Email</label><input type="email" className="form-control" value={companyInfo.email} onChange={e => setInfo({...companyInfo, email: e.target.value})} required /></div>
            <div className="form-group"><label>Master Cipher (Password)</label><input type="text" className="form-control" value={companyInfo.adminPassword} onChange={e => setInfo({...companyInfo, adminPassword: e.target.value})} required /></div>
            
            <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <label>Global Accent Color</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="color" value={companyInfo.themeColor} onChange={e => setInfo({...companyInfo, themeColor: e.target.value})} style={{ width: '50px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
                  <span>{companyInfo.themeColor}</span>
                </div>
              </div>
              <div>
                <label>Theme Mode</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={companyInfo.isLightMode} onChange={e => setInfo({...companyInfo, isLightMode: e.target.checked})} />
                    Frosted Light Mode
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save Configuration</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <h2>Data Management</h2>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Backup your local node database to your computer, or restore a previous backup.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleExport}><Download size={18}/> Export JSON Backup</button>
              <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                <Upload size={18}/> Restore Backup
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
            </div>
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
            <h2 style={{ color: 'var(--danger-color)' }}>Critical Danger Zone</h2>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
              Permanently annihilate ALL local node storage. This clears the entire workspace, all users, tasks, logs, and settings on this device instantaneously.
            </p>
            <button className="btn btn-danger" onClick={() => { if(window.confirm("FINAL WARNING: Execute Order 66 and destroy all local data?")) clearDB(); }} style={{ width: '100%' }}>
              <Trash2 size={18}/> Wipe Local Node Database
            </button>
          </div>

          <div className="glass-panel" style={{ textAlign: 'center', marginTop: '1rem', padding: '2rem' }}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>About the Developer</h3>
            <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>Built by Mohammed Irfaan Zayn</p>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>For more solutions-based softwares contact: <br/><strong style={{color: '#fff'}}>+91 6383027257</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialManagement() {
  const [claims, setClaims] = useState<FinancialClaim[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  const loadData = () => {
    setClaims(getClaims());
    setEmployees(getUsers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local-db-updated', loadData);
    return () => window.removeEventListener('local-db-updated', loadData);
  }, []);

  const handleUpdate = (id: string, status: FinancialClaim['status']) => {
    updateClaimStatus(id, status);
    logActivity(`Financial claim ${id.substring(0,4)} marked as ${status}`);
  };

  const totalApproved = claims.filter(c => c.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Financial Claims</h1>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--success-color)' }}>Total Disbursed: ${totalApproved.toFixed(2)}</h2>
      </div>

      <div className="glass-panel">
        {claims.length === 0 ? <p>No claims submitted.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {claims.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => {
              const emp = employees.find(e => e.id === c.userId);
              return (
                <div key={c.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>${c.amount.toFixed(2)} - {c.category}</h3>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.2rem' }}>Requested by {emp?.name || 'Unknown'} on {new Date(c.date).toLocaleDateString()}</div>
                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic', opacity: 0.9 }}>"{c.description}"</div>
                  </div>
                  {c.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleUpdate(c.id, 'approved')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleUpdate(c.id, 'denied')}>Deny</button>
                    </div>
                  ) : (
                    <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  useEffect(() => {
    const loadAct = () => setActivities(getActivityLog().slice(0, 15));
    loadAct();
    window.addEventListener('local-db-updated', loadAct);
    return () => window.removeEventListener('local-db-updated', loadAct);
  }, []);

  return (
    <div className="dashboard-layout">
      <Header role="admin" onToggleLogs={() => setIsLogsOpen(!isLogsOpen)} />
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/timeline" element={<GanttTimeline />} />
            <Route path="/financials" element={<FinancialManagement />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/leaves" element={<LeaveManagement />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>

        {/* Collapsible Global Notifications Panel */}
        <div style={{ 
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px', 
          background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', borderLeft: '1px solid var(--glass-border)',
          transform: isLogsOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease',
          display: 'flex', flexDirection: 'column', padding: '2rem', zIndex: 10, boxShadow: '-5px 0 30px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18}/> System Logs</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {activities.length === 0 ? <p style={{ fontSize: '0.9rem' }}>No recent logs.</p> : activities.map(log => (
              <div key={log.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid var(--accent-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.85rem' }}>{log.text}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.3rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
