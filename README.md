# Timetable — College Timetable Generator

A clash-free timetable generator for Anna University affiliated engineering colleges.

Built with: **React + Vite + Tailwind CSS + Supabase**

---

## 🚀 How to Run Locally

### Step 1 — Install Node.js

Download from https://nodejs.org (LTS version)

### Step 2 — Extract this ZIP

Extract to any folder, e.g. `Desktop/timetable`

### Step 3 — Open in VS Code

```text
File → Open Folder → select timetable folder
```

### Step 4 — Set up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **SQL Editor** → paste the contents of `src/lib/schema.sql` → click Run
4. Go to **Settings → API** → copy your Project URL and anon key

### Step 5 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 6 — Create admin user

1. In Supabase → **Authentication → Users → Invite user**
2. After user is created, click the user → **Edit** → add to User Metadata:

```json
{"role": "admin"}
```

3. For staff users, set metadata to:

```json
{"role": "staff"}
```

### Step 7 — Install dependencies and run

Open VS Code terminal (Ctrl + `) and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in Chrome

---

## 📁 Project Structure

```text
timetable/
├── src/
│   ├── components/
│   │   ├── Layout.jsx        ← Sidebar + navigation
│   │   ├── TimetableGrid.jsx ← Timetable display component
│   │   └── UI.jsx            ← Shared UI components
│   ├── context/
│   │   └── AuthContext.jsx   ← Login/auth state
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client
│   │   ├── engine.js         ← Timetable scheduling algorithm
│   │   ├── exports.js        ← PDF + Excel export
│   │   └── schema.sql        ← Database schema (run in Supabase)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Departments.jsx
│   │   ├── SetupPages.jsx    ← Sections, Subjects, Teachers
│   │   ├── Generate.jsx
│   │   ├── StudentView.jsx
│   │   ├── TeacherView.jsx
│   │   ├── Settings.jsx
│   │   └── Constraints.jsx
│   ├── App.jsx               ← Routes
│   ├── main.jsx              ← Entry point
│   └── index.css             ← Global styles
├── .env.example              ← Copy to .env and fill credentials
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🌐 Hosting on Vercel (Free)

1. Push this project to GitHub
2. Go to https://vercel.com → Import your GitHub repo
3. Add environment variables in Vercel dashboard:

   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
4. Click Deploy — your app is live!

---

## ✅ Features

* **Admin login** — full access to all pages
* **Staff login** — can only view student and teacher timetables
* **8 departments** — CSE, ECE, EEE, MECH, CIVIL, IT, AIDS, AIML
* **Year-wise sections** — I Year to IV Year per department
* **CSP scheduling engine** — zero teacher clashes, zero free periods
* **Lab support** — 4 consecutive periods, P1–P4 or P5–P8
* **Export** — PDF and Excel for both student and teacher timetables
* **Configurable settings** — semester months, period durations, lunch duration

---

## 🔧 Built by Timetable
