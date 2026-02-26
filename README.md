# PulseHR — AI-Powered HRMS with Blockchain Verification

> An intelligent Human Resource Management System that uses **Google Gemini AI** for performance analytics and **Ethereum blockchain** for tamper-proof task completion records.

## 🔗 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://ai-hrmspulsehr.vercel.app](https://ai-hrmspulsehr.vercel.app) |
| **Backend API** | [https://ai-hrms-evhn.onrender.com](https://ai-hrms-evhn.onrender.com) |
| **Health Check** | [https://ai-hrms-evhn.onrender.com/api/health](https://ai-hrms-evhn.onrender.com/api/health) |

> **Note:** The Render free tier spins down after 15 min of inactivity. The first request may take ~30 seconds.

---

## 📁 Project Structure

```
AI-HRMS/
├── backend/
│   ├── server.js              # Express entry point
│   ├── db/
│   │   ├── db.js              # PostgreSQL connection pool (Neon)
│   │   └── schema.sql         # Database schema
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Login, register, session management
│   │   ├── employees.js       # Employee CRUD operations
│   │   ├── tasks.js           # Task management + blockchain hash storage
│   │   ├── dashboard.js       # Dashboard statistics
│   │   └── ai.js              # AI-powered analytics endpoints
│   └── services/
│       └── aiService.js       # Scoring algorithms + Gemini integration
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Admin + Employee login
│   │   │   ├── Register.jsx       # Organization registration
│   │   │   ├── Dashboard.jsx      # Admin dashboard with stats
│   │   │   ├── Employees.jsx      # Employee management
│   │   │   ├── Tasks.jsx          # Task assignment & tracking
│   │   │   ├── AIInsights.jsx     # AI analytics dashboard
│   │   │   └── EmployeePortal.jsx # Employee task view + MetaMask
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   └── Navbar.jsx         # Top navigation bar
│   │   └── context/
│   │       └── AuthContext.jsx    # Global auth state management
│   ├── vercel.json            # Vercel deployment config
│   └── vite.config.js         # Vite + Tailwind v4 config
└── README.md
```

---

## 🧠 AI Logic — Model & Scoring Explanation

PulseHR uses a **hybrid AI approach**: deterministic rule-based scoring for consistency, enhanced with **Google Gemini 2.0 Flash** for natural language insights.

### 1. Productivity Scoring Algorithm

Each employee receives a score (0–100) computed from their task data:

```
Final Score = Base Score + Speed Bonus − Overdue Penalty
```

| Component | Formula | Range |
|-----------|---------|-------|
| **Base Score** | `(completed_tasks / total_tasks) × 100` | 0–100 |
| **Speed Bonus** | `(completed_on_time / completed_tasks) × 10` | 0–10 |
| **Overdue Penalty** | `overdue_tasks × 5` (capped at 20) | 0–20 |

**Grading Scale:**

| Score | Grade | Meaning |
|-------|-------|---------|
| 85–100 | A | Exceptional performer |
| 70–84 | B | Solid performer |
| 50–69 | C | Average — needs improvement |
| 30–49 | D | Below average |
| 0–29 | F | Critical — intervention needed |

### 2. Skill Gap Detection

The system maintains a **role-to-skills mapping** for 10 common roles:

```javascript
'Software Engineer': ['JavaScript', 'Git', 'SQL', 'REST APIs', 'Testing']
'Team Lead':         ['JavaScript', 'Git', 'System Design', 'Code Review', 'Project Management', 'Communication']
'Data Scientist':    ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization', 'TensorFlow']
// ... and 7 more roles
```

For each employee, the algorithm:
1. Looks up the required skills for their role
2. Compares against the employee's listed skills (fuzzy matching)
3. Computes **coverage percentage** = `(matched / required) × 100`
4. Returns the list of missing skills

### 3. Smart Task Recommendation

When assigning tasks, the system ranks employees by a weighted score:

```
Recommendation Score = Skill Match (50%) + Workload (30%) + Productivity (20%)
```

| Factor | Calculation | Weight |
|--------|-------------|--------|
| **Skill Match** | `(matched_skills / required_skills) × 50` | 50 pts |
| **Workload** | `30 − (active_tasks × 6)`, min 0 | 30 pts |
| **Productivity** | `(productivity_score / 100) × 20` | 20 pts |

### 4. Gemini AI Integration

On top of the rule-based scores, the system sends structured data to **Gemini 2.0 Flash** for:
- **Team Performance Summaries**: Natural language review of top performers, concerns, and actionable recommendations
- **Skill Gap Analysis**: Training priority suggestions and which employees need the most attention
- **Assignment Reasoning**: Explanation of why a specific employee is the best fit for a task

The Gemini calls are **non-blocking** — if the API fails, the system gracefully falls back to the rule-based results.

**Relevant Source Files:**
- [`backend/services/aiService.js`](backend/services/aiService.js) — All scoring algorithms + Gemini prompts
- [`backend/routes/ai.js`](backend/routes/ai.js) — API endpoints that orchestrate AI features

---

## 🔗 Wallet / Blockchain Integration

PulseHR implements **Ethereum-compatible message signing** for tamper-proof task completion verification.

### How It Works

```
Employee completes task → MetaMask prompt → Cryptographic signature → Stored in DB
```

1. **Wallet Connection**: The Employee Portal integrates with MetaMask via `ethers.js` (`BrowserProvider`)
2. **Task Completion Signing**: When an employee marks a task as "Completed", if their wallet is connected:
   - A structured message is created containing the task title, ID, employee name, and timestamp
   - MetaMask prompts the user to sign this message with their private key
   - The resulting **ECDSA signature** serves as a cryptographic proof
3. **Storage**: The signature is stored in the `tx_hash` column of the `tasks` table
4. **Verification Badge**: Completed tasks signed via blockchain display a "🔗 Verified" badge with a truncated signature hash

### Message Format
```
PulseHR Task Completion

Task: <task title>
Task ID: <id>
Employee: <employee name>
Completed: <ISO timestamp>
```

### Key Design Decisions
- **Message signing** (not transactions) — no gas fees required, works on any Ethereum network
- **Graceful degradation** — if the employee rejects the MetaMask prompt or doesn't have a wallet, the task is still marked as completed, just without blockchain proof
- **Non-repudiation** — the signature mathematically proves the specific employee completed the task at that time

**Relevant Source Files:**
- [`frontend/src/pages/EmployeePortal.jsx`](frontend/src/pages/EmployeePortal.jsx) — MetaMask integration and signing logic (lines 49–104)
- [`backend/routes/tasks.js`](backend/routes/tasks.js) — `PATCH /:id/status` stores the `tx_hash`
- [`backend/db/schema.sql`](backend/db/schema.sql) — `tx_hash` column in tasks table

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4 |
| **Backend** | Node.js, Express 5 |
| **Database** | PostgreSQL (Neon.tech) |
| **AI** | Google Gemini 2.0 Flash |
| **Blockchain** | Ethers.js v6, MetaMask |
| **Auth** | JWT + HTTP-only cookies |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js ≥ 20
- A PostgreSQL database (or free account at [neon.tech](https://neon.tech))
- Google AI API key from [Google AI Studio](https://aistudio.google.com/apikey)
- MetaMask browser extension (for blockchain features)

### 1. Clone the repository
```bash
git clone https://github.com/vyshnavi005-max/AI-HRMS.git
cd AI-HRMS
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_random_secret_string
PORT=5000
```

Apply the database schema:
```bash
npm run db:migrate
```

Start the backend:
```bash
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend on port 5000.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new organization |
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/employee-login` | Employee login |
| GET | `/api/auth/me` | Get current session |
| POST | `/api/auth/logout` | Logout |

### Employees (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Add new employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Deactivate employee |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filtered by role) |
| POST | `/api/tasks` | Create task (Admin) |
| PATCH | `/api/tasks/:id/status` | Update status + store tx_hash |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |

### AI Analytics (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/productivity` | Productivity scores + Gemini summary |
| GET | `/api/ai/skill-gap` | Skill gap analysis + Gemini summary |
| POST | `/api/ai/assign` | Smart task assignment recommendations |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Organization statistics |

---

## 📊 Database Schema

```sql
organizations    — Multi-tenant admin accounts
├── employees    — Belong to an org, have roles/skills/wallet
└── tasks        — Assigned to employees, track status + blockchain hash
```

See [`backend/db/schema.sql`](backend/db/schema.sql) for the full schema.

---

## 🎥 Demo Video Suggested Outline

A 15–20 minute walkthrough covering:

1. **Introduction** (1 min) — What is PulseHR, tech stack overview
2. **Registration & Login** (2 min) — Register an org, login as admin
3. **Employee Management** (3 min) — Add employees with roles and skills
4. **Task Management** (3 min) — Create tasks, assign to employees, set priorities
5. **AI Insights** (4 min) — Show productivity scores, skill gaps, Gemini summaries
6. **Employee Portal** (3 min) — Login as employee, view tasks, update status
7. **Blockchain Verification** (3 min) — Connect MetaMask, complete a task, show signature
8. **Code Walkthrough** (2 min) — Briefly show AI scoring logic and wallet integration

---

## 📄 License

ISC
