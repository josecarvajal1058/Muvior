# Muvior — Real-Time Queue & Booking Management Platform

A cross-platform SaaS platform designed to eliminate waiting rooms in service micro-businesses (barbershops, beauty salons, and outpatient clinics) through virtual queueing and real-time appointment management.

---

## Architecture Overview

Muvior implements a decoupled client-server architecture with an asynchronous backend and an Expo-driven mobile frontend.

```mermaid
graph TD
    Client["Client / User\n(Mobile App)"]
    Admin["Business Admin\n(Mobile / Web)"]
    API["FastAPI Engine\n(REST API / CORS)"]
    DB[("SQLite Database\n(Normalized Relational)")]

    Client -->|Browse & Book Queue| API
    Admin -->|Manage Turns & Staff| API
    API -->|Async CRUD / ORM| DB
```

---

## Sequence Flow: Remote Turn Allocation

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant App as Mobile App (Expo)
    participant API as FastAPI Backend
    participant DB as SQLite DB

    C->>App: Select Business & Staff Member
    App->>API: POST /appointments (client_id, service_id, employee_id)
    API->>DB: Check Availability & Active Queue Length
    DB-->>API: Confirm slot
    API->>DB: INSERT appointment (status = 'PENDING')
    DB-->>API: Appointment record
    API-->>App: Return 201 Created (Token, Estimated Time)
    App-->>C: Display Live Queue Ticket
```

---

## Domain Model (Class Diagram)

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string name
        +string role
    }

    class Business {
        +int id
        +int owner_id
        +string name
        +string category
        +string address
        +string phone
    }

    class Employee {
        +int id
        +int business_id
        +string name
        +string specialty
    }

    class Service {
        +int id
        +int business_id
        +string name
        +float price
        +int duration_minutes
    }

    class Appointment {
        +int id
        +int client_id
        +int employee_id
        +datetime scheduled_at
        +string status
    }

    User "1" <-- "0..*" Business : owns
    Business "1" *-- "1..*" Employee : employs
    Business "1" *-- "1..*" Service : offers
    Employee "1" o-- "0..*" Appointment : handles
    User "1" <-- "0..*" Appointment : books
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React Native, Expo SDK 54, Expo Router, TypeScript, React Navigation |
| **Backend** | Python 3.12, FastAPI, Pydantic, Uvicorn |
| **Database** | SQLite (Relational Schema with Foreign Key enforcement) |
| **Tooling** | Git, ESLint, TypeScript Compiler |

---

## Repository Structure

```text
Muvior/
├── backend/
│   ├── main.py          # FastAPI REST endpoints & business logic
│   ├── database.py      # SQLite connection & schema initialization
│   └── seed_db.py       # Fixture seeding for local development
├── frontend/
│   ├── app/             # File-based routing (onboarding, tabs, admin)
│   ├── components/      # Modular UI components (Pickers, Inputs)
│   ├── constants/       # Design tokens & Dominican Republic presets
│   ├── hooks/           # Custom React hooks
│   ├── package.json     # Node dependencies & scripts
│   └── tsconfig.json    # Strict TypeScript configuration
└── README.md            # Technical specifications
```

---

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic

python3 seed_db.py       # Initialize & seed SQLite DB
uvicorn main:app --reload --port 8000
```
Interactive OpenAPI docs: `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## Author
**José Manuel Carvajal Florentino** — Software Engineering Student at **Universidad del Caribe (UNICARIBE)**.
GitHub: [@josecarvajal1058](https://github.com/josecarvajal1058)
