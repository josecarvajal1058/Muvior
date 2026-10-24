<div align="center">
  <img src="docs/logo.png" width="140" alt="Muvior Logo" />
  <h1>Muvior</h1>
  <p><strong>Full-Stack Remote Queue & Turn Management Prototype</strong></p>
  <p>A decoupled full-stack prototype engineered to streamline customer check-ins and eliminate crowded waiting rooms in micro-businesses (barbershops, beauty salons, and service clinics) through virtual queues and real-time turn tracking.</p>
</div>

---

## Visual Showcase

<div align="center">
  <img src="docs/screenshots/01_login.png" width="18%" alt="Login Screen" />
  <img src="docs/screenshots/02_role_selection.png" width="18%" alt="Role Selection" />
  <img src="docs/screenshots/03_location_picker.png" width="18%" alt="Location & Radius Picker" />
  <img src="docs/screenshots/04_directory_feed.png" width="18%" alt="Directory Feed" />
  <img src="docs/screenshots/05_admin_dashboard.png" width="18%" alt="Admin Operational Dashboard" />
</div>

---

## Architectural Design

The platform follows a decoupled client-server architecture. The mobile client communicates over REST with a Python backend service that processes turn lifecycles, manages queue state, and enforces relational integrity across users, appointments, and staff queues.

```mermaid
graph TD
    Client["Client / User\n(Mobile App)"]
    Admin["Business Admin\n(Mobile / Web)"]
    API["FastAPI Engine\n(REST API / CORS)"]
    DB[("SQLite Database\n(6 Relational Tables)")]

    Client -->|Browse Directory & Request Turn| API
    Admin -->|Kanban Dashboard & Advance Turns| API
    API -->|Direct SQL & Enforced Foreign Keys| DB
```

Clients discover nearby businesses, evaluate active queues, and join waiting lines. The mobile interface computes estimated wait times based on queue depth, while the backend coordinates state transitions and records appointments across relational tables.

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant App as Mobile App (Expo)
    participant API as FastAPI Backend
    participant DB as SQLite DB

    C->>App: Select Business & Desired Services
    App->>API: POST /businesses/{id}/turn (client_id, service_ids)
    API->>DB: Check Business Existence & Active State
    API->>DB: INSERT appointments (user_id, business_id, status='waiting')
    API->>DB: INSERT appointment_services (relational join table)
    DB-->>API: Persisted appointment ID & Foreign Key Verification
    API-->>App: HTTP 200 OK (Appointment Record)
    App-->>C: Display Live Queue Position & Estimated Wait
```

---

## Core Engineering Capabilities

The client interface is constructed with React Native and Expo Router, featuring file-based routing, hardware-accelerated transitions, and a dark-mode design system. State persistence handles local preferences, phone number formatting, and geographic scoping without blocking the main UI thread.

The backend service is powered by FastAPI and Python 3.12, utilizing Pydantic models for request validation, PBKDF2-HMAC password hashing, automatic OpenAPI schema generation, and startup schema initialization. The SQLite database strictly enforces referential integrity through declared foreign keys and `PRAGMA foreign_keys = ON;` across 6 normalized tables (users, businesses, employees, services, appointments, and appointment_services).

---

## Technology Stack

The solution is divided across two distinct layers:

- **Frontend Application:** React Native with Expo SDK 54, TypeScript, Expo Router, React Navigation, Vector Icons, and Async Storage.
- **Backend Service:** Python 3.12, FastAPI, Pydantic, Uvicorn, SQLite3, and PBKDF2-HMAC security.

---

## Getting Started

### Backend Service Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python3 seed_db.py
uvicorn main:app --reload --port 8000
```
Interactive API documentation and schemas are available at `http://localhost:8000/docs`.

### Mobile Frontend Setup
```bash
cd frontend
npm install
npm start
```
The application can be launched on iOS, Android, or mobile web via Expo CLI.

---

## Repository Structure

```text
├── backend/
│   ├── database.py       # SQLite connection, DDL schema & PRAGMA foreign_keys
│   ├── main.py           # 15 FastAPI endpoints, CORS & Lifespan handler
│   ├── requirements.txt  # Pinned backend dependencies
│   ├── security.py       # PBKDF2-HMAC password hashing & verification
│   └── seed_db.py        # Relational dataset generator & test users
├── frontend/
│   ├── app/              # File-based routing (Expo Router)
│   ├── app.json          # Expo configuration (Muvior namespace)
│   ├── assets/           # Media, brand icons & splash assets
│   └── package.json      # React Native & Expo SDK 54 dependencies
└── docs/
    └── screenshots/      # Mobile UI verification captures
```
