# 🌌 Masterorganizer

**Masterorganizer** is a premium, decentralized employee and shop management application built for ultimate privacy and zero recurring cloud costs. Utilizing a "Local Node Architecture", all data—including tasks, financial claims, and user credentials—is stored entirely offline within the browser's persistent local storage.

![Dashboard Preview](https://via.placeholder.com/1200x600/0a0a0a/ffffff?text=Masterorganizer+Enterprise+Dashboard)

## 🚀 Live Demo
> **Deployed on Vercel:** [https://masterorganizer.vercel.app/](https://masterorganizer.vercel.app/)

---

## ✨ Unique Features

### 🌐 Decentralized Node Architecture
No databases, no cloud subscriptions, no monthly fees. Masterorganizer operates completely locally. Using a highly advanced `window.addEventListener('local-db-updated')` event engine, state changes instantly sync across tabs without requiring a backend server. 

### 💸 Integrated Financial Claims System
Employees can instantly submit reimbursement claims (e.g., travel, supplies) from their dashboard. Administrators have a dedicated Financials view to approve or deny claims and track total capital disbursement over time.

### 🧠 Enterprise Node Matrix (Canvas Visualizer)
The Administrator dashboard features a custom-built, 60fps HTML5 Canvas animation that mathematically draws glowing connections between nodes based on proximity, visually representing the decentralized nature of the software.

### ⏱️ Pomodoro Engine
A built-in Pomodoro timer for employees to maximize focus and track time seamlessly without leaving the application. Includes automatic badge rewards for consistent focus sessions.

### 🎨 Personal Aesthetics & Responsive Design
- Fully responsive auto-layouts featuring a modern glass-morphism aesthetic.
- Employees can customize their own glowing neon accent colors and toggle between Dark and Frosted Light themes.
- Seamless mobile hamburger navigation for on-the-go management.

---

## 🛠️ Technology Stack
- **Framework:** React + TypeScript (Vite)
- **Styling:** Pure Vanilla CSS (CSS Variables, Flexbox/Grid, Glass-morphism)
- **State Management:** Custom LocalStorage Database Engine
- **Icons:** Lucide React
- **Charts:** Recharts

---

## 💻 Running Locally

To run this decentralized node locally:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/masterorganizer.git

# 2. Navigate to the directory
cd masterorganizer

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Visit `http://localhost:5173` to view the application. 

### Default Credentials
Upon first load, the database seeds automatically.
- **Admin:** `admin / admin123`
- **Employee:** `employee1 / pass1`

---

## 🔒 Privacy & Security Warning
Because Masterorganizer relies on decentralized local storage, **clearing your browser data will wipe the entire database.** Administrators are highly encouraged to use the **Export Database** feature within the Settings page on a weekly basis to maintain a secure backup of company records.

---
*Built with passion for small businesses and decentralized web enthusiasts.*
