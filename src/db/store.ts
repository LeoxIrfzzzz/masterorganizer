export interface User {
  id: string;
  name?: string;
  username?: string;
  password?: string;
  role: 'admin' | 'employee';
  job?: string;
  department?: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  themeColor?: string;
  isLightMode?: boolean;
  badges?: string[];
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'incomplete' | 'on process' | 'completed';
  timeline: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string;
  resourceLink?: string;
  subTasks?: SubTask[];
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  status: 'present' | 'absent';
  clockIn?: string;
  clockOut?: string;
  mood?: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'disapproved';
}

export interface ActivityLogItem {
  id: string;
  text: string;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  text: string;
  date: string;
}

export interface FinancialClaim {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface AppNotification {
  id: string;
  targetUserId: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface CompanyInfo {
  name: string;
  email: string;
  adminPassword?: string;
  themeColor?: string;
  isLightMode?: boolean;
}

export interface Database {
  users: User[];
  tasks: Task[];
  attendance: Attendance[];
  leaveRequests: LeaveRequest[];
  activityLog: ActivityLogItem[];
  messages: Message[];
  announcements: Announcement[];
  claims: FinancialClaim[];
  notifications: AppNotification[];
  companyInfo: CompanyInfo;
}

const DB_KEY = 'masterorganizer_db';
const SESSION_KEY = 'masterorganizer_session';

const getInitialDB = (): Database => ({
  users: [],
  tasks: [],
  attendance: [],
  leaveRequests: [],
  activityLog: [],
  messages: [],
  announcements: [],
  claims: [],
  notifications: [],
  companyInfo: {
    name: '',
    email: '',
    adminPassword: '',
    themeColor: '#ffffff',
    isLightMode: false
  }
});

export const loadDB = (): Database => {
  const data = localStorage.getItem(DB_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return { 
        ...getInitialDB(), 
        ...parsed, 
        companyInfo: { ...getInitialDB().companyInfo, ...(parsed.companyInfo || {}) },
        announcements: parsed.announcements || [],
        claims: parsed.claims || [],
        notifications: parsed.notifications || []
      };
    } catch (e) {
      return getInitialDB();
    }
  }
  return getInitialDB();
};

export const saveDB = (db: Database): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event('local-db-updated'));
};

export const clearDB = (): void => {
  localStorage.removeItem(DB_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('local-db-updated'));
  window.location.href = '/';
};

// --- DATABASE IMPORT/EXPORT ---
export const exportDB = (): string => {
  const db = loadDB();
  return JSON.stringify(db, null, 2);
};

export const importDB = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      const merged = {
        ...getInitialDB(),
        ...parsed,
        companyInfo: { ...getInitialDB().companyInfo, ...(parsed.companyInfo || {}) }
      };
      saveDB(merged);
      return true;
    }
  } catch(e) {
    console.error("Failed to import DB", e);
  }
  return false;
};

// --- AUTH (Session Storage) ---
export const getCurrentUser = (): User | null => {
  const data = sessionStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event('local-db-updated'));
};

export const logout = (): void => {
  setCurrentUser(null);
};

export const verifyAdminLogin = (password: string): User | null => {
  const db = loadDB();
  if (db.companyInfo.adminPassword === password) {
    const adminUser: User = { 
      id: 'admin', 
      role: 'admin', 
      name: 'Administrator',
      themeColor: db.companyInfo.themeColor,
      isLightMode: db.companyInfo.isLightMode
    };
    setCurrentUser(adminUser);
    return adminUser;
  }
  return null;
};

export const loginEmployee = (username: string, pass: string): User | null => {
  const db = loadDB();
  const user = db.users.find(u => u.role === 'employee' && u.username === username && u.password === pass);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const updateUserTheme = (userId: string, color: string, isLightMode: boolean = false): void => {
  const db = loadDB();
  if (userId === 'admin') {
    db.companyInfo.themeColor = color;
    db.companyInfo.isLightMode = isLightMode;
  } else {
    const index = db.users.findIndex(u => u.id === userId);
    if (index > -1) {
      db.users[index].themeColor = color;
      db.users[index].isLightMode = isLightMode;
    }
  }
  saveDB(db);
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser({ ...currentUser, themeColor: color, isLightMode });
  }
};

// --- COMPANY INFO & ANNOUNCEMENTS ---
export const getCompanyInfo = (): CompanyInfo => loadDB().companyInfo;

export const setCompanyInfo = (info: CompanyInfo): void => {
  const db = loadDB();
  db.companyInfo = { ...db.companyInfo, ...info };
  saveDB(db);
};

export const getAnnouncements = (): Announcement[] => loadDB().announcements;
export const addAnnouncement = (text: string): void => {
  const db = loadDB();
  db.announcements.unshift({ id: Date.now().toString(), text, date: new Date().toISOString() });
  saveDB(db);
};

// --- USERS & BADGES ---
export const getUsers = (): User[] => loadDB().users;

export const addUser = (user: Omit<User, 'id' | 'joinDate'>): void => {
  const db = loadDB();
  const newUser: User = { 
    id: Date.now().toString(), 
    joinDate: new Date().toISOString().split('T')[0], 
    themeColor: '#ffffff',
    isLightMode: false,
    badges: [],
    ...user 
  };
  db.users.push(newUser);
  saveDB(db);
};

export const updateUser = (id: string, updates: Partial<User>): void => {
  const db = loadDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index > -1) {
    db.users[index] = { ...db.users[index], ...updates };
    saveDB(db);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
       setCurrentUser({ ...currentUser, ...updates });
    }
  }
};

export const deleteUser = (id: string): void => {
  const db = loadDB();
  db.users = db.users.filter(u => u.id !== id);
  db.tasks = db.tasks.filter(t => t.assignedTo !== id);
  saveDB(db);
};

export const awardBadge = (userId: string, badgeName: string): void => {
  const db = loadDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index > -1) {
    if (!db.users[index].badges) db.users[index].badges = [];
    if (!db.users[index].badges!.includes(badgeName)) {
      db.users[index].badges!.push(badgeName);
      saveDB(db);
      logActivity(`🎖️ ${db.users[index].name} earned the [${badgeName}] badge!`);
    }
  }
};

// --- TASKS ---
export const getTasks = (): Task[] => loadDB().tasks;

export const getTasksByUser = (userId: string): Task[] => loadDB().tasks.filter(t => t.assignedTo === userId);

export const addTask = (task: Omit<Task, 'id' | 'status'>): void => {
  const db = loadDB();
  db.tasks.push({ id: Date.now().toString(), status: 'incomplete', ...task });
  saveDB(db);
  
  if (task.assignedTo) {
    pushNotification(task.assignedTo, 'New Task Assigned', `You have been assigned a new task: ${task.title}`);
  }
};

export const updateTaskStatus = (taskId: string, status: Task['status']): void => {
  const db = loadDB();
  const taskIndex = db.tasks.findIndex(t => t.id === taskId);
  if (taskIndex > -1) {
    db.tasks[taskIndex].status = status;
    saveDB(db);
    
    // Notify Admin
    const user = db.users.find(u => u.id === db.tasks[taskIndex].assignedTo);
    pushNotification('admin', 'Task Updated', `${user?.name || 'An employee'} updated task "${db.tasks[taskIndex].title}" to ${status}.`);
  }
};

export const updateTask = (taskId: string, updates: Partial<Task>): void => {
  const db = loadDB();
  const taskIndex = db.tasks.findIndex(t => t.id === taskId);
  if (taskIndex > -1) {
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...updates };
    saveDB(db);
  }
};

export const deleteTask = (taskId: string): void => {
  const db = loadDB();
  db.tasks = db.tasks.filter(t => t.id !== taskId);
  saveDB(db);
};

// --- ATTENDANCE & TIME TRACKING ---
export const getAttendance = (): Attendance[] => loadDB().attendance;

export const clockIn = (userId: string, mood: number): void => {
  const db = loadDB();
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString();
  
  const existingIndex = db.attendance.findIndex(a => a.userId === userId && a.date === today);
  if (existingIndex > -1) {
    db.attendance[existingIndex] = { ...db.attendance[existingIndex], status: 'present', clockIn: time, mood };
  } else {
    db.attendance.push({ id: Date.now().toString(), userId, date: today, status: 'present', clockIn: time, mood });
  }
  saveDB(db);

  const user = db.users.find(u => u.id === userId);
  pushNotification('admin', 'Employee Clock-In', `${user?.name || 'An employee'} clocked in. (Mood: ${mood}/5)`);
};

export const clockOut = (userId: string): void => {
  const db = loadDB();
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString();
  
  const existingIndex = db.attendance.findIndex(a => a.userId === userId && a.date === today);
  if (existingIndex > -1) {
    db.attendance[existingIndex].clockOut = time;
    saveDB(db);
  }
};

// --- LEAVE REQUESTS ---
export const getLeaveRequests = (): LeaveRequest[] => loadDB().leaveRequests;

export const addLeaveRequest = (userId: string, date: string, reason: string): void => {
  const db = loadDB();
  db.leaveRequests.push({ id: Date.now().toString(), userId, date, reason, status: 'pending' });
  saveDB(db);
};

export const updateLeaveRequest = (requestId: string, status: LeaveRequest['status']): void => {
  const db = loadDB();
  const requestIndex = db.leaveRequests.findIndex(r => r.id === requestId);
  if (requestIndex > -1) {
    db.leaveRequests[requestIndex].status = status;
    saveDB(db);
  }
};

// --- FINANCIAL CLAIMS ---
export const getClaims = (): FinancialClaim[] => loadDB().claims || [];

export const addClaim = (userId: string, amount: number, category: string, description: string): void => {
  const db = loadDB();
  if (!db.claims) db.claims = [];
  db.claims.push({
    id: Date.now().toString(),
    userId,
    amount,
    category,
    description,
    date: new Date().toISOString(),
    status: 'pending'
  });
  saveDB(db);
};

export const updateClaimStatus = (claimId: string, status: FinancialClaim['status']): void => {
  const db = loadDB();
  if (!db.claims) return;
  const index = db.claims.findIndex(c => c.id === claimId);
  if (index > -1) {
    db.claims[index].status = status;
    saveDB(db);
  }
};

// --- MESSAGING ---
export const getMessages = (): Message[] => loadDB().messages || [];
export const sendMessage = (senderId: string, senderName: string, text: string): void => {
  const db = loadDB();
  if (!db.messages) db.messages = [];
  db.messages.push({
    id: Date.now().toString(),
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString()
  });
  if (db.messages.length > 200) db.messages.shift();
  saveDB(db);
};

// --- ACTIVITY LOG ---
export const getActivityLog = (): ActivityLogItem[] => loadDB().activityLog;

export const logActivity = (text: string): void => {
  const db = loadDB();
  if (!db.activityLog) db.activityLog = [];
  db.activityLog.unshift({ id: Date.now().toString(), text, timestamp: new Date().toISOString() });
  if (db.activityLog.length > 100) db.activityLog.pop();
  saveDB(db);
};

// --- SYSTEM NOTIFICATIONS ---
export const getNotifications = (): AppNotification[] => loadDB().notifications || [];

export const pushNotification = (targetUserId: string, title: string, body: string): void => {
  const db = loadDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: Date.now().toString() + Math.random(),
    targetUserId,
    title,
    body,
    timestamp: new Date().toISOString(),
    read: false
  });
  saveDB(db);
};

export const markNotificationRead = (notificationId: string): void => {
  const db = loadDB();
  if (!db.notifications) return;
  const idx = db.notifications.findIndex(n => n.id === notificationId);
  if (idx > -1) {
    db.notifications[idx].read = true;
    saveDB(db);
  }
};
