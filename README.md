# Muvior — Real-Time Queue & Booking Management Platform

> Final Project for **Proyecto de Software I** (Software Engineering I) at **Universidad del Caribe (UNICARIBE)**.  
> Developed by **José Manuel Carvajal Florentino**.

---

## 📌 Overview

**Muvior** (*Movement + Valor*) is a full-stack SaaS platform designed to streamline queue management, appointments, and service bookings for micro-businesses (barbershops, beauty salons, and medical clinics).

Its core value proposition is **"invisible waiting"**: allowing clients to take virtual turns and monitor estimated wait times from home, eliminating crowded waiting rooms and giving business owners a clear, real-time administrative dashboard.

---

## 🚀 Architecture & Tech Stack

The system follows a decoupled client-server architecture:

### Frontend (Mobile & Web)
- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54) and [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **Language:** TypeScript.
- **State & Storage:** Asynchronous client-side persistence via `@react-native-async-storage/async-storage`.
- **UI & UX:** Custom dark-mode aesthetic with high-contrast palette (Carbon Black and Vibrant Orange `#d9320d`), responsive bottom tabs, modal date pickers, and localized Dominican Republic presets.

### Backend (API & Engine)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12).
- **Data Layer:** SQLite with relational integrity, foreign keys, and seed scripts.
- **CORS & Middleware:** Configured for cross-origin mobile and web client consumption.
- **Data Validation:** Strict schema enforcement using [Pydantic](https://docs.pydantic.dev/).

---

## 🛠️ Key Features

1. **Client Experience:**
   - Business directory with category filtering and real-time operational status.
   - Remote turn allocation with calculated queue positions.
   - Specialist / multi-employee selection per business.
   - User onboarding, phone number validation, and localized address selectors.

2. **Business Owner (Admin Dashboard):**
   - Centralized view of active queues separated by staff members.
   - Turn status management (Call next, in-progress, completed, cancelled).
   - Metrics and schedule oversight.

3. **Software Engineering Artifacts:**
   - Formal architecture blueprints, database ER diagrams, and real-time sequence flows in `/Latex`.

---

## 📁 Repository Structure

```text
Muvior/
├── backend/
│   ├── main.py          # FastAPI application routes & endpoints
│   ├── database.py      # SQLite connection & schema initialization
│   └── seed_db.py       # Initial database fixture seeding
├── frontend/
│   ├── app/             # Expo Router screens (onboarding, auth, tabs, admin)
│   ├── components/      # Reusable UI widgets (LocationPicker, DatePickerModal)
│   ├── constants/       # Design tokens, theme colors, and DR regional data
│   ├── hooks/           # Color scheme and responsive hooks
│   ├── package.json     # Node dependencies & Expo config
│   └── tsconfig.json    # TypeScript compiler configuration
└── Latex/               # Academic documentation, ER diagrams, and LaTeX sources
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (>= 18) and npm/yarn.
- Python (>= 3.10).
- Expo Go app on your physical device or Android/iOS emulator.

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn pydantic

# Run initial database seed (creates clean database with demo data)
python3 seed_db.py

# Start API server
uvicorn main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Scan the QR code with Expo Go or press `w` to run on the web.

---

## 📄 Academic Information
- **Course:** Proyecto de Software I.
- **Institution:** Universidad del Caribe (UNICARIBE).
- **Author:** José Manuel Carvajal Florentino ([@josecarvajal1058](https://github.com/josecarvajal1058)).
