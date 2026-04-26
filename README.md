# Smartseason
A full-stack web application for tracking crop progress across multiple fields during a growing season.
# SmartSeason Field Monitoring System

## Tech Stack

- **Backend:** Django 4.2 + Django REST Framework + SimpleJWT
- **Frontend:** React 18 + Vite + React Router
- **Database:** SQLite (default) or PostgreSQL (via env vars)

## Setup Instructions

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be at `http://localhost:5173`.

### Demo Credentials

Create accounts via the Register page, or create a superuser:

```bash
python manage.py createsuperuser
```

Suggested demo accounts:
- **Admin:** username `admin` / password `admin123` — role: Admin
- **Agent:** username `agent1` / password `agent123` — role: Field Agent

Register them at `/register` (select the role during registration).

### PostgreSQL (optional)

Create a `.env` file in `backend/`:

```
DB_NAME=smartseason
DB_USER=postgres
DB_PWD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

## Design Decisions

### Roles
- **Admin (Coordinator):** Can create/edit/delete fields, assign agents, view all fields, see dashboard summary across all agents.
- **Field Agent:** Can only see their assigned fields, and submit stage updates with notes.

Role is stored in a `Profile` model (one-to-one with Django's User). A Django signal auto-creates a Profile on user creation; superusers get the `admin` role automatically.

### Field Status Logic

Each field has a computed `status` property (not stored in DB) based on:

| Condition | Status |
|---|---|
| `current_stage == "harvested"` | `completed` |
| No updates logged in 30+ days (and not harvested) | `at_risk` |
| Still `planted` or `growing` after 90+ days | `at_risk` |
| All other cases | `active` |

The logic assumes a typical growing season is under 90 days. Fields going stale without any agent activity are flagged at-risk to prompt attention.

### API Design
- `GET /api/fields/` — filtered by role (all for admin, assigned-only for agents)
- `GET /api/dashboard/` — role-aware summary data
- `POST /api/fields/<id>/updates/create/` — also updates `Field.current_stage` atomically
- `GET /api/me/` — returns current user + role (used by frontend for role-based rendering)

### Assumptions
- A single field can only be assigned to one agent at a time
- Both admins and agents can submit field updates (admins may need to log observations too)
- Planting date is set at field creation and doesn't change
- No email/notification system is included (out of scope)
